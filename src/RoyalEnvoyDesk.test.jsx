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
 mount({...member,envoy:false,available:0,keepsake:{class:'honoured',accepted:'2026-11-12',gift:'seal-ornament',message:'Welcome!'}});
 expect(await screen.findByText('My private keepsake')).toBeTruthy();
 expect(screen.getByText('Welcome!')).toBeTruthy();expect(screen.getByRole('link',{name:'Visit Palace Life'}).getAttribute('href')).toBe('/palace-life');
 expect(screen.queryByLabelText('Recipient email')).toBeNull();
});
