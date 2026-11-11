import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {PalaceForgotPassword,PalaceEmailAction,readPalaceEmailAction} from './PalaceRecovery';
import {PalaceLogin} from './PalaceAuthGates';
import {supabase} from './supabase';

vi.mock('./auth',()=>({useAuth:()=>({session:null,loading:false,error:null})}));
vi.mock('./supabase',()=>({configured:true,supabase:{auth:{
  resetPasswordForEmail:vi.fn(),verifyOtp:vi.fn(),updateUser:vi.fn(),signOut:vi.fn(),
}}}));
const Frame=({children})=><main>{children}</main>;
function at(path,Component){return render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/login" element={<PalaceLogin Frame={Frame}/>}/>
  <Route path="/auth/forgot-password" element={<PalaceForgotPassword Frame={Frame}/>}/>
  <Route path="/auth/verify" element={<PalaceEmailAction Frame={Frame}/>}/>
  <Route path="/chamber" element={<p>Chamber</p>}/>
  </Routes></MemoryRouter>);
}
beforeEach(()=>{
 supabase.auth.resetPasswordForEmail.mockResolvedValue({error:null});
 supabase.auth.verifyOtp.mockResolvedValue({data:{session:{user:{id:'test'}}},error:null});
 supabase.auth.updateUser.mockResolvedValue({error:null});
 supabase.auth.signOut.mockResolvedValue({error:null});
});
afterEach(()=>{cleanup();vi.clearAllMocks();window.history.replaceState({},'','/');});

it('offers accessible Forgot password from existing sign-in, not signup',()=>{
 at('/login',PalaceLogin);
 expect(screen.getByRole('link',{name:'Forgot password?'}).getAttribute('href')).toBe('/auth/forgot-password');
 cleanup();at('/login?mode=signup',PalaceLogin);
 expect(screen.queryByRole('link',{name:'Forgot password?'})).toBeNull();
});

it('requests recovery without revealing which email addresses have an account',async()=>{
 at('/auth/forgot-password',PalaceForgotPassword);
 fireEvent.change(screen.getByLabelText('Account email'),{target:{value:'test@example.com'}});
 fireEvent.click(screen.getByRole('button',{name:'Email me a reset link'}));
 await waitFor(()=>expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
  'test@example.com',{redirectTo:window.location.origin+'/auth/callback'}
 ));
 expect(screen.getByRole('status').textContent).toMatch(/If this email belongs to a Palace account/);
 expect(screen.queryByRole('button',{name:'Email me a reset link'})).toBeNull();
});

it('shows the same non-enumerating message for an unknown address/provider error',async()=>{
 supabase.auth.resetPasswordForEmail.mockResolvedValue({error:new Error('user not found')});
 at('/auth/forgot-password',PalaceForgotPassword);
 fireEvent.change(screen.getByLabelText('Account email'),{target:{value:'missing@example.com'}});
 fireEvent.click(screen.getByRole('button',{name:'Email me a reset link'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toMatch(/If this email belongs to a Palace account/));
 expect(screen.queryByText(/user not found/i)).toBeNull();
});

it('accepts only supported email actions with token hashes',()=>{
 expect(readPalaceEmailAction('#token_hash=test_123&type=email')).toEqual({token:'test_123',type:'email'});
 expect(readPalaceEmailAction('#token_hash=test&type=recovery')).toEqual({token:'test',type:'recovery'});
 expect(readPalaceEmailAction('#token_hash=passwordless&type=email&intent=magiclink')).toEqual({token:'passwordless',type:'email',intent:'magiclink'});
 expect(readPalaceEmailAction('#token_hash=secret&type=unknown')).toBeNull();
 expect(readPalaceEmailAction('#type=email')).toBeNull();
});

it('does not consume cross-browser email verification tokens before the member clicks',async()=>{
 at('/auth/verify#token_hash=example-hash&type=email',PalaceEmailAction);
 expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
 expect(screen.getByRole('button',{name:'Confirm my email'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Confirm my email'}));
 await waitFor(()=>expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({token_hash:'example-hash',type:'email'}));
 expect(await screen.findByText(/Your email is confirmed/, {selector:'p'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Your place among the stars is secured.'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Welcome to the Palace'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Continue to your chamber'}).getAttribute('href')).toBe('/chamber');
});

it('redeems passwordless Palace magic links as Supabase email OTPs while showing the right sign-in copy',async()=>{
 at('/auth/verify#token_hash=magic-hash&type=email&intent=magiclink',PalaceEmailAction);
 expect(screen.getByRole('heading',{name:'Enter The Starry Palace'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Sign in to the Palace'})).toBeTruthy();
 expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Sign in to the Palace'}));
 await waitFor(()=>expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({token_hash:'magic-hash',type:'email'}));
 expect(await screen.findByText(/Your Palace sign-in is complete/)).toBeTruthy();
});

it('supports recovery in a separate browser and changes password only after verifying the link',async()=>{
 at('/auth/verify#token_hash=recover-me&type=recovery',PalaceEmailAction);
 expect(supabase.auth.updateUser).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Continue to new password'}));
 await waitFor(()=>expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({token_hash:'recover-me',type:'recovery'}));
 await screen.findByLabelText('New password');
 fireEvent.change(screen.getByLabelText('New password'),{target:{value:'more-secure-than-before'}});
 fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'more-secure-than-before'}});
 fireEvent.click(screen.getByRole('button',{name:'Save new password'}));
 await waitFor(()=>expect(supabase.auth.updateUser).toHaveBeenCalledWith({password:'more-secure-than-before'}));
 await waitFor(()=>expect(supabase.auth.signOut).toHaveBeenCalledWith({scope:'local'}));
 expect(screen.getByRole('link',{name:'Sign in with your new password'})).toBeTruthy();
});

it('rejects mismatched passwords without modifying the account',async()=>{
 at('/auth/verify#token_hash=recover-me&type=recovery',PalaceEmailAction);
 fireEvent.click(screen.getByRole('button',{name:'Continue to new password'}));
 await screen.findByLabelText('New password');
 fireEvent.change(screen.getByLabelText('New password'),{target:{value:'long-password-123'}});
 fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'different-password'}});
 fireEvent.click(screen.getByRole('button',{name:'Save new password'}));
 expect(screen.getByRole('alert').textContent).toMatch(/do not match/);
 expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});

it('handles expired or already used links without attempting password changes',async()=>{
 supabase.auth.verifyOtp.mockResolvedValue({data:null,error:new Error('Token has expired')});
 at('/auth/verify#token_hash=expired&type=recovery',PalaceEmailAction);
 fireEvent.click(screen.getByRole('button',{name:'Continue to new password'}));
 await waitFor(()=>expect(screen.getByRole('alert').textContent).toMatch(/expired, has already been used/));
 expect(supabase.auth.updateUser).not.toHaveBeenCalled();
 expect(screen.getByRole('link',{name:'Request a new recovery link'})).toBeTruthy();
});

it('refuses missing or unsupported auth links without calling Supabase',()=>{
 at('/auth/verify#type=email&token_hash=',PalaceEmailAction);
 expect(screen.getByRole('alert').textContent).toMatch(/missing its secure verification/);
 expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
});
