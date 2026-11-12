import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceInvitationLanding,PalaceInvitationAdmin,PalaceMyRoyalInvitations,getInvitationDispatchEndpoint,PALACE_PUBLIC_INVITATION_URL} from './PalaceInvitations';
import {renderAgeSafeInvitation} from '../supabase/functions/palace-invitations/email.ts';
const auth=vi.hoisted(()=>({session:null,loading:false}));
vi.mock('./auth',()=>({useAuth:()=>auth}));
const Frame=({children})=><main>{children}</main>;
afterEach(()=>{cleanup();auth.session=null;vi.unstubAllEnvs();vi.unstubAllGlobals();});

it('invites readers to an age-checked signup, never to an admin-created user or token callback',()=>{
 render(<MemoryRouter><PalaceInvitationLanding Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'The gates have opened for you.'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Accept my invitation'}).getAttribute('href')).toBe('/login?mode=signup');
 expect(screen.getByText(/Membership is for people aged 13 or older/)).toBeTruthy();
 expect(screen.getByRole('link',{name:'Already a member? Sign in'}).getAttribute('href')).toBe('/login');
 expect(document.body.textContent).not.toMatch(/skip age|bypass the age check/i);
});

it('does not show the send form to an unauthenticated or unapproved visitor',()=>{
 render(<MemoryRouter><PalaceInvitationAdmin Frame={Frame}/></MemoryRouter>);
 expect(screen.getByText(/Share an invitation link/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Review invitation'})).toBeNull();
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

it.each([true,false])('reviews the actual email and reports provider acknowledgement %s',async accepted=>{
 vi.stubEnv('VITE_SUPABASE_URL','https://example.supabase.co');
 auth.session={access_token:'fixture-session'};
 const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({allowed:true,ready:true})})
   .mockResolvedValueOnce({ok:true,json:async()=>({accepted})});
 vi.stubGlobal('fetch',fetcher);
 render(<MemoryRouter><PalaceInvitationAdmin Frame={Frame}/></MemoryRouter>);
 const input=await screen.findByLabelText('Recipient email');
 fireEvent.change(input,{target:{value:'guest@example.invalid'}});
 fireEvent.click(screen.getByRole('button',{name:'Review invitation'}));
 expect(fetcher).toHaveBeenCalledTimes(1);
 expect(screen.getByText(renderAgeSafeInvitation().subject)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Edit recipient'}));
 expect(input.readOnly).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Review invitation'}));
 fireEvent.click(screen.getByRole('button',{name:'Send this invitation'}));
 await screen.findByText(accepted?/Invitation accepted by the email provider/:/could not confirm the provider accepted/);
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(input.value).toBe(accepted?'':'guest@example.invalid');
});

it('opens the member invitation guide without claiming a reward or requesting a privilege',()=>{
 const network=vi.fn();vi.stubGlobal('fetch',network);
 render(<MemoryRouter><PalaceMyRoyalInvitations Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'My Royal Invitations'})).toBeTruthy();
 expect(screen.getByText(/Member issuing and sealed welcome gifts are still being prepared/)).toBeTruthy();
 expect(screen.queryByRole('button')).toBeNull();expect(network).not.toHaveBeenCalled();
});
