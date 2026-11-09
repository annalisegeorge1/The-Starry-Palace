import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {PalaceAuthCallback,PalaceLogin} from './PalaceAuthGates';
import {supabase} from './supabase';

vi.mock('./auth',()=>({useAuth:()=>({session:null,loading:false,error:null})}));
vi.mock('./supabase',()=>({configured:true,supabase:{auth:{signInWithOtp:vi.fn()}}}));
const Frame=({children})=><main>{children}</main>;
afterEach(()=>{cleanup();window.history.replaceState({},'','/');vi.clearAllMocks()});

it.each(['?','#'])('recovers a first-time provider callback (%s) through age-checked email signup',async delimiter=>{
 const path='/auth/callback'+delimiter+'error=server_error&error_description=Database+error+saving+new+user';
 window.history.replaceState({},'',path);
 render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/auth/callback" element={<PalaceAuthCallback Frame={Frame}/>}/>
  <Route path="/login" element={<PalaceLogin Frame={Frame}/>}/>
 </Routes></MemoryRouter>);
 const dob=await screen.findByLabelText('Date of birth');
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'member@example.invalid'}});
 const create=screen.getByRole('button',{name:'Create my account with an email link'});
 fireEvent.click(create);
 expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
 fireEvent.change(dob,{target:{value:new Date().toISOString().slice(0,10)}});
 fireEvent.click(create);
 expect(screen.getByText('You must be at least 13 to create a Palace account.')).toBeTruthy();
 expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
 supabase.auth.signInWithOtp.mockResolvedValue({error:null});
 fireEvent.change(dob,{target:{value:'2000-01-01'}});
 fireEvent.click(create);
 await waitFor(()=>expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
  email:'member@example.invalid',options:expect.objectContaining({shouldCreateUser:true,data:{palace_birth_date:'2000-01-01'}})
 }));
});

it('returns the authorization code and flow ID to the requesting browser without forwarding other URL data',async()=>{
 const path='/auth/callback?code=test-code&sb_flow_id=test-flow&extra=discard';
 window.history.replaceState({},'',path);
 const writeText=vi.fn().mockResolvedValue(undefined);
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
 render(<MemoryRouter initialEntries={[path]}><PalaceAuthCallback Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Finish signing in'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Copy sign-in link'}));
 await waitFor(()=>expect(writeText).toHaveBeenCalledWith(window.location.origin+'/auth/callback?code=test-code&sb_flow_id=test-flow'));
 expect(screen.getByRole('link',{name:'Sign in to your account'}).getAttribute('href')).toBe('/login');
});
