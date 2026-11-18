import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {RoyalInvitationClaim,readInvitationSecret} from './RoyalInvitationClaim';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('./supabase',()=>({supabase:{rpc}}));
afterEach(()=>{cleanup();rpc.mockReset();});
const secret='ab'.repeat(32);
function show(member){render(<MemoryRouter><RoyalInvitationClaim secret={secret} member={member}/></MemoryRouter>)}
it('recognises only a complete secret and keeps it out of sign-in and signup links',()=>{
 expect(readInvitationSecret('#seal='+secret)).toBe(secret);
 expect(readInvitationSecret('#seal=short')).toBeNull();show(null);
 expect(screen.getAllByRole('link').map(link=>link.getAttribute('href'))).toEqual(['/login?mode=signup','/login']);
 expect(rpc).not.toHaveBeenCalled();
});
it('requires an explicit action and a confirmed server result before recognising a seal or a gift',async()=>{
 show('fixture');expect(rpc).not.toHaveBeenCalled();
 rpc.mockResolvedValueOnce({error:{message:'unavailable'}});
 fireEvent.click(screen.getByRole('button',{name:'Accept my Royal Invitation'}));await screen.findByText(/could not be accepted/);
 expect(screen.queryByRole('heading')).toBeNull();
 const receipt={class:'founding',accepted:'2026-11-12T12:00:00Z',gift:null};
 rpc.mockResolvedValueOnce({data:receipt});fireEvent.click(screen.getByRole('button',{name:'Accept my Royal Invitation'}));
 await screen.findByRole('heading',{name:'Founding Guest Seal'});
 expect(rpc).toHaveBeenLastCalledWith('royal_invitation_claim',{p_token:secret});
 expect(document.querySelectorAll('.royal-welcome-option')).toHaveLength(5);
 expect(screen.getByRole('button',{name:'Choose a gift first'}).disabled).toBe(true);
 const before=rpc.mock.calls.length;
 fireEvent.click(screen.getByRole('button',{name:/Starforged Circlet/}));
 expect(rpc).toHaveBeenCalledTimes(before);
 rpc.mockResolvedValueOnce({data:{...receipt,gift:null}});
 fireEvent.click(screen.getByRole('button',{name:/Celestial Dawn/}));
 fireEvent.click(screen.getByRole('button',{name:'Confirm Celestial Dawn as my permanent gift'}));
 await screen.findByText(/could not be confirmed/);
 expect(screen.queryByText(/Welcome gift selected/)).toBeNull();
 rpc.mockResolvedValueOnce({data:{...receipt,gift:'celestial-dawn'}});
 fireEvent.click(screen.getByRole('button',{name:'Confirm Celestial Dawn as my permanent gift'}));
 await screen.findByText(/Welcome gift selected · Celestial Dawn/);
});
