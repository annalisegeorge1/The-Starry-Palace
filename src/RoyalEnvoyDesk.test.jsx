import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import RoyalEnvoyDesk from './RoyalEnvoyDesk';
const rpc=vi.hoisted(()=>vi.fn());
vi.mock('./supabase',()=>({supabase:{rpc}}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();rpc.mockReset();});
const member={envoy:true,desk:false,sending:true,available:1,reserved:0,accepted:0,history:[],keepsake:null};
function mount(record){rpc.mockResolvedValue({data:record});render(<MemoryRouter><RoyalEnvoyDesk session={{access_token:'fixture'}} endpoint="https://example.invalid/dispatch"/></MemoryRouter>);}
it('confirms cost and recipient before spending; ambiguous receipt retains the request reference',async()=>{
 const send=vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true,json:async()=>({accepted:true})});
 vi.stubGlobal('fetch',send);mount(member);
 fireEvent.change(await screen.findByLabelText('Recipient email'),{target:{value:'guest@example.invalid'}});
 fireEvent.change(screen.getByLabelText('Personal message (optional)'),{target:{value:'Welcome to the Reading Rooms.'}});
 fireEvent.click(screen.getByRole('button',{name:'Review sealed invitation'}));expect(send).not.toHaveBeenCalled();
 expect(screen.getByText(/Reserves one seal/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Confirm dispatch'}));
 await screen.findByText(/could not confirm this action/);
 fireEvent.click(screen.getByRole('button',{name:'Confirm dispatch'}));
 await screen.findByText(/Provider accepted the email/);
 expect(send.mock.calls[0][1].body).toBe(send.mock.calls[1][1].body);
 expect(JSON.parse(send.mock.calls[1][1].body).message).toBe('Welcome to the Reading Rooms.');
});
it('shows a recipient their keepsake and reception without presenting issuer controls',async()=>{
 mount({...member,envoy:false,available:0,keepsake:{class:'honoured',accepted:'2026-11-12',gift:'starforged-circlet',message:'Welcome!'}});
 expect(await screen.findByText('My private keepsake')).toBeTruthy();
 expect(screen.getByText('Welcome!')).toBeTruthy();expect(screen.getByRole('link',{name:'Visit Palace Life'}).getAttribute('href')).toBe('/palace-life');
 expect(screen.queryByLabelText('Recipient email')).toBeNull();
});

it('shows ordinary members an honest invitation status without issuing controls',async()=>{
 mount({...member,envoy:false,sending:false,available:0});
 expect(await screen.findByRole('heading',{name:'Royal Envoy · Not yet awarded'})).toBeTruthy();
 expect(screen.getByText(/Readers, writers and artists can all become eligible/)).toBeTruthy();
 expect(screen.getByRole('link',{name:'Explore the Palace Guidebook'}).getAttribute('href')).toBe('/guidebook');
 expect(screen.queryByRole('button',{name:'Review sealed invitation'})).toBeNull();
 expect(screen.queryByLabelText('Recipient email')).toBeNull();
});
it('shows a safe preparation state when the Royal Envoy RPC has not been activated',async()=>{
 rpc.mockResolvedValue({data:null,error:{message:'function not installed'}});
 render(<MemoryRouter><RoyalEnvoyDesk session={{access_token:'fixture'}} endpoint="https://example.invalid/dispatch"/></MemoryRouter>);
 expect(await screen.findByText(/Royal Envoy system is being prepared/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Review sealed invitation'})).toBeNull();
});
it('does not offer issuing controls while member sending is disabled',async()=>{
 mount({...member,sending:false});
 expect(await screen.findByText(/sending invitations is not enabled yet/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Review sealed invitation'})).toBeNull();
});
