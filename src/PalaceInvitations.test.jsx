import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PalaceInvitationLanding,PalaceInvitationAdmin,PalaceMyRoyalInvitations,getInvitationDispatchEndpoint,PALACE_PUBLIC_INVITATION_URL} from './PalaceInvitations';
import {renderAgeSafeInvitation} from '../supabase/functions/palace-invitations/email.ts';
const auth=vi.hoisted(()=>({session:null,loading:false}));
vi.mock('./auth',()=>({useAuth:()=>auth}));
vi.mock('./RoyalEnvoyDesk',()=>({default:()=> <div data-testid="envoy-status">Envoy status loaded</div>}));
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
 expect(screen.getByText(/Share an ordinary Palace welcome link/)).toBeTruthy();
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

it('clarifies that a public welcome link cannot grant Royal Invitation privileges',()=>{
 render(<MemoryRouter><PalaceInvitationAdmin Frame={Frame}/></MemoryRouter>);
 expect(screen.getByText(/Exclusive Royal Invitation honours require a unique/)).toBeTruthy();
 expect(screen.getByRole('button',{name:'Copy welcome link'})).toBeTruthy();
});
it('links a signed-in member to the dedicated Royal Invitation hub',()=>{
 auth.session={user:{id:'fixture-id'},access_token:'fixture'};
 render(<MemoryRouter><PalaceInvitationLanding Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('link',{name:'View My Royal Invitations'}).getAttribute('href')).toBe('/my-invitations');
});
it('explains the member hub without exposing Envoy issuing controls to a signed-out visitor',()=>{
 render(<MemoryRouter><PalaceMyRoyalInvitations Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'My Royal Invitations'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Sign in to view your Royal Invitation status'}).getAttribute('href')).toBe('/login');
 expect(screen.queryByRole('button',{name:'Review sealed invitation'})).toBeNull();
});


it('keeps the sealed member hub informative even before member privileges are activated',()=>{
 const network=vi.fn();vi.stubGlobal('fetch',network);
 render(<MemoryRouter><PalaceMyRoyalInvitations Frame={Frame}/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Receiving a sealed invitation'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Earning Royal Envoy status'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Explore Reading Rooms'}).getAttribute('href')).toBe('/reading');
 expect(screen.getByRole('link',{name:'Return to my Chamber'}).getAttribute('href')).toBe('/chamber');
 expect(screen.queryByRole('link',{name:'Open administrator invitation desk'})).toBeNull();
 expect(network).not.toHaveBeenCalled();
});

it('reveals the existing admin welcome desk only after a verified service acknowledgement',async()=>{
 vi.stubEnv('VITE_SUPABASE_URL','https://example.supabase.co');
 auth.session={user:{id:'test-owner'},access_token:'signed-in-fixture'};
 const network=vi.fn().mockResolvedValue({ok:true,json:async()=>({allowed:true,ready:true})});
 vi.stubGlobal('fetch',network);
 render(<MemoryRouter><PalaceMyRoyalInvitations Frame={Frame}/></MemoryRouter>);
 const link=await screen.findByRole('link',{name:'Open administrator invitation desk'});
 expect(link.getAttribute('href')).toBe('/admin/invitations');
 expect(network).toHaveBeenCalledWith('https://example.supabase.co/functions/v1/palace-invitations',{
  headers:{Authorization:'Bearer signed-in-fixture',apikey:''}
 });
});

it('does not expose administrator shortcuts after a denied service check',async()=>{
 vi.stubEnv('VITE_SUPABASE_URL','https://example.supabase.co');
 auth.session={user:{id:'test-reader'},access_token:'regular-fixture'};
 const network=vi.fn().mockResolvedValue({ok:false});
 vi.stubGlobal('fetch',network);
 render(<MemoryRouter><PalaceMyRoyalInvitations Frame={Frame}/></MemoryRouter>);
 await vi.waitFor(()=>expect(network).toHaveBeenCalledOnce());
 expect(screen.queryByRole('link',{name:'Open administrator invitation desk'})).toBeNull();
});
