import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import Treasury from './Treasury';
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'member'}}})}));
vi.mock('./PalaceBadge',()=>({default:()=>null}));
vi.mock('./PalaceGift',()=>({
 default:()=> <span>Gift artwork</span>,
 giftCourt:()=>({sigil:'☾'}),
 giftCourts:[{name:'Moon Garden',sigil:'☾',motto:'A quiet court'}],
 giftEditions:['nocturne'],giftEdition:()=> 'nocturne'
}));
vi.mock('./palaceData',()=>({
 getGiftCatalogue:async()=>({items:[{id:'gift',name:'Moon cup',court_name:'Moon Garden',catalogue_number:1}],count:1}),
 getTreasury:async()=>({gifts:[{tier:'bronze',copies:1,virtual_gifts:{id:'gift'}},{tier:'silver',copies:1,virtual_gifts:{id:'gift'}}]})
}));
afterEach(cleanup);
it('opens the gift collection without confusing the selected court with its artwork helper',async()=>{
 render(<Treasury Frame={({children})=><main>{children}</main>}/>);
 fireEvent.click(screen.getByRole('button',{name:/Gift collection/i}));
 expect(await screen.findByRole('heading',{name:'Moon cup'})).toBeTruthy();
});
