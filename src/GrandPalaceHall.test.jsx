import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

const actions=vi.hoisted(()=>({search:vi.fn(),send:vi.fn()}));
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'current-member'}}})}));
vi.mock('./grandPalaceData',()=>({
 getGrandPalaceHall:async()=>({
  palaces:[{id:1,name:'The Comet Court',motto:'A brighter crossing',place:1}],
  my_palace_id:1,my_contribution:13,balance:40,
  honours:[{honour:'heart',gift_stock:2}],unlocked_themes:[],selected_theme:null,
  ends_at:'2027-01-01T00:00:00.000Z'
 }),
 purchaseGrandPalaceHonour:vi.fn(),
 sendGrandPalaceHonour:actions.send,
 selectGrandPalaceTheme:vi.fn()
}));
vi.mock('./grandPalaceModel',()=>({
 HONOUR_SHOP:[{key:'heart',glyph:'♥',name:'Heart',rarity:'Common',price:5}],
 QUARTERLY_BOXES:[],
 daysUntilSeasonEnd:()=>10
}));
vi.mock('./palaceData',()=>({searchMembers:actions.search}));
vi.mock('./PalaceEmblem',()=>({default:()=> <span>☾</span>}));
vi.mock('./GrandPalaceWelcome',()=>({default:()=>null}));
vi.mock('./GrandPalaceExpansion',()=>({default:()=>null}));
vi.mock('./GrandPalaceAtlas',()=>({default:()=>null}));
vi.mock('./GrandPalaceCeremony',()=>({default:()=>null}));
vi.mock('./GrandPalaceGatherings',()=>({default:()=>null}));
vi.mock('./PalaceArtsDiscovery',()=>({default:()=>null}));

import GrandPalaceHall from './GrandPalaceHall';

beforeEach(()=>{
 actions.search.mockResolvedValue([{
  id:'11111111-1111-1111-1111-111111111111',
  username:'stargazer',display_name:'Star Gazer'
 }]);
 actions.send.mockResolvedValue(undefined);
});
afterEach(()=>{cleanup();vi.resetAllMocks()});

describe('Grand Palace gifts and room navigation',()=>{
 it('shows a selected member by name and sends honours to their real ID',async()=>{
  render(<MemoryRouter initialEntries={['/grand-palaces?tab=treasury']}>
   <GrandPalaceHall Frame={({children})=><main>{children}</main>}/>
  </MemoryRouter>);
  expect((await screen.findByRole('button',{name:/Royal Treasury.*Honours/i})).getAttribute('aria-pressed')).toBe('true');
  fireEvent.change(screen.getByRole('textbox',{name:'Find a Palace member'}),{target:{value:'Star'}});
  fireEvent.click(screen.getByRole('button',{name:'Find member'}));
  fireEvent.click(await screen.findByRole('button',{name:/Star Gazer.*stargazer/i}));
  expect(screen.getByRole('textbox',{name:'Find a Palace member'}).value).toBe('Star Gazer');
  expect(screen.getByText(/Sending to/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Send heart ✦'}));
  await waitFor(()=>expect(actions.send).toHaveBeenCalledWith(
   '11111111-1111-1111-1111-111111111111','heart',''
  ));
  await waitFor(()=>expect(screen.getByRole('textbox',{name:'Find a Palace member'}).value).toBe(''));
 });
 it('requires picking a member after changing the search text',async()=>{
  render(<MemoryRouter initialEntries={['/grand-palaces?tab=treasury']}>
   <GrandPalaceHall Frame={({children})=><main>{children}</main>}/>
  </MemoryRouter>);
  const find=await screen.findByRole('button',{name:'Find member'});
  fireEvent.change(screen.getByRole('textbox',{name:'Find a Palace member'}),{target:{value:'Star'}});
  fireEvent.click(find);
  fireEvent.click(await screen.findByRole('button',{name:/Star Gazer.*stargazer/i}));
  expect(screen.getByRole('button',{name:'Send heart ✦'}).disabled).toBe(false);
  fireEvent.change(screen.getByRole('textbox',{name:'Find a Palace member'}),{target:{value:'Another reader'}});
  expect(screen.getByRole('button',{name:'Send heart ✦'}).disabled).toBe(true);
 });

 it('explains an empty member search without enabling gifting',async()=>{
  actions.search.mockResolvedValueOnce([]);
  render(<MemoryRouter initialEntries={['/grand-palaces?tab=treasury']}>
   <GrandPalaceHall Frame={({children})=><main>{children}</main>}/>
  </MemoryRouter>);
  await screen.findByRole('button',{name:'Find member'});
  fireEvent.change(screen.getByRole('textbox',{name:'Find a Palace member'}),{target:{value:'Unknown person'}});
  fireEvent.click(screen.getByRole('button',{name:'Find member'}));
  expect(await screen.findByText(/No matching Palace member found/)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Send heart ✦'}).disabled).toBe(true);
 });
 it('discards search results when the member has already changed the query',async()=>{
  let resolveOldSearch;
  actions.search.mockImplementationOnce(()=>new Promise(resolve=>{resolveOldSearch=resolve}));
  render(<MemoryRouter initialEntries={['/grand-palaces?tab=treasury']}>
   <GrandPalaceHall Frame={({children})=><main>{children}</main>}/>
  </MemoryRouter>);
  await screen.findByRole('button',{name:'Find member'});
  const search=screen.getByRole('textbox',{name:'Find a Palace member'});
  fireEvent.change(search,{target:{value:'Star'}});
  fireEvent.click(screen.getByRole('button',{name:'Find member'}));
  fireEvent.change(search,{target:{value:'Different member'}});
  await act(async()=>resolveOldSearch([{id:'11111111-1111-1111-1111-111111111111',username:'stargazer',display_name:'Star Gazer'}]));
  expect(search.value).toBe('Different member');
  expect(screen.queryByRole('button',{name:/Star Gazer.*stargazer/i})).toBeNull();
  expect(screen.getByRole('button',{name:'Send heart ✦'}).disabled).toBe(true);
 });
});
