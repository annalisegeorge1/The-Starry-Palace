import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceLegacyRecovery} from './PalaceRecovery';
import {PalaceAuthCallback} from './PalaceAuthGates';
import {supabase} from './supabase';

const state=vi.hoisted(()=>({current:{session:{user:{id:'recovering-member'}},loading:false,error:null,recoverySession:true,clearRecoverySession:vi.fn()}}));
vi.mock('./auth',()=>({useAuth:()=>state.current}));
vi.mock('./supabase',()=>({configured:true,supabase:{auth:{updateUser:vi.fn(),signOut:vi.fn()}}}));
const Frame=({children})=><main>{children}</main>;
afterEach(()=>{cleanup();vi.clearAllMocks();window.history.replaceState({},'','/');state.current={session:{user:{id:'recovering-member'}},loading:false,error:null,recoverySession:true,clearRecoverySession:vi.fn()};});

it('legacy callback shows password update instead of redirecting to chamber after PASSWORD_RECOVERY',()=>{
 render(<MemoryRouter initialEntries={['/auth/callback?code=already-exchanged']}><PalaceAuthCallback Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Choose a new password.'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Save new password'})).toBeTruthy();
});

it('legacy recovery changes the password and ends the local recovery session',async()=>{
 supabase.auth.updateUser.mockResolvedValue({error:null});
 supabase.auth.signOut.mockResolvedValue({error:null});
 render(<MemoryRouter><PalaceLegacyRecovery Frame={Frame} onFinish={state.current.clearRecoverySession}/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('New password'),{target:{value:'very-long-recovery-password'}});
 fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'very-long-recovery-password'}});
 fireEvent.click(screen.getByRole('button',{name:'Save new password'}));
 await waitFor(()=>expect(supabase.auth.updateUser).toHaveBeenCalledWith({password:'very-long-recovery-password'}));
 await waitFor(()=>expect(supabase.auth.signOut).toHaveBeenCalledWith({scope:'local'}));
 expect(state.current.clearRecoverySession).toHaveBeenCalled();
 expect(await screen.findByRole('status')).toHaveProperty('textContent',expect.stringContaining('Your password was changed.'));
});

it('legacy recovery does not update password if confirmation mismatches',()=>{
 render(<MemoryRouter><PalaceLegacyRecovery Frame={Frame}/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('New password'),{target:{value:'very-long-recovery-password'}});
 fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'something-else-entirely'}});
 fireEvent.click(screen.getByRole('button',{name:'Save new password'}));
 expect(screen.getByRole('alert').textContent).toMatch(/passwords do not match/);
 expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});
