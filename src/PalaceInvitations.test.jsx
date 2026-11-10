import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceInvitationLanding,PalaceInvitationAdmin,getInvitationDispatchEndpoint,PALACE_PUBLIC_INVITATION_URL} from './PalaceInvitations';
import {renderAgeSafeInvitation} from '../supabase/functions/palace-invitations/email.ts';
vi.mock('./auth',()=>({useAuth:()=>({session:null,loading:false})}));
const Frame=({children})=><main>{children}</main>;
afterEach(()=>cleanup());

it('invites readers to an age-checked signup, never to an admin-created user or token callback',()=>{
 render(<MemoryRouter><PalaceInvitationLanding Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'The gates have opened for you.'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Create my Palace chamber'}).getAttribute('href')).toBe('/login?mode=signup');
 expect(screen.getByText(/Membership is for people aged 13 or older/)).toBeTruthy();
 expect(screen.getByRole('link',{name:'Already a member? Sign in'}).getAttribute('href')).toBe('/login');
 expect(document.body.textContent).not.toMatch(/skip age|bypass the age check/i);
});

it('does not show the send form to an unauthenticated or unapproved visitor',()=>{
 render(<MemoryRouter><PalaceInvitationAdmin Frame={Frame}/></MemoryRouter>);
 expect(screen.getByText(/Share an invitation link/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Email royal invitation'})).toBeNull();
});

it('only accepts the configured Supabase project as the invitation sending endpoint',()=>{
 expect(getInvitationDispatchEndpoint('https://sservftxygunkacmwsad.supabase.co'))
  .toBe('https://sservftxygunkacmwsad.supabase.co/functions/v1/palace-invitations');
 expect(getInvitationDispatchEndpoint('https://evil.example')).toBeNull();
 expect(getInvitationDispatchEndpoint('javascript:alert(1)')).toBeNull();
});

it('produces a royal invitation before signup without creating a Supabase invitation token',()=>{
 const mail=renderAgeSafeInvitation();
 expect(mail.subject).toMatch(/An Invitation Awaits You/);
 expect(mail.html).toContain('BY PERSONAL INVITATION');
 expect(mail.html).toContain('Accept My Invitation');
 expect(mail.html).toContain(PALACE_PUBLIC_INVITATION_URL);
 expect(mail.html).not.toContain('{{ .TokenHash }}');
 expect(mail.html).not.toContain('/auth/verify');
 expect(mail.html).not.toMatch(/<script|<iframe/i);
 expect(mail.text).toContain('membership requires age 13 or older');
});
