import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import Treasury from './Treasury';
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'member'}}})}));
vi.mock('./PalaceBadge',()=>({default:()=>null}));
vi.mock('./PalaceGift',()=>({
 default:({tier})=> <span>Gift artwork: {tier}</span>,
 giftCourt:()=>({sigil:'☾'}),
 giftCourts:[{name:'Moon Garden',slug:'moon-garden',sigil:'☾',motto:'A quiet court'}],
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

it('previews any tier while preserving the highest owned tier default',async()=>{
 render(<Treasury Frame={({children})=><main>{children}</main>}/>);
 fireEvent.click(screen.getByRole('button',{name:/Gift collection/i}));
 await screen.findByRole('heading',{name:'Moon cup'});
 expect(screen.getByText('Gift artwork: silver')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Artwork tier'),{target:{value:'emerald'}});
 expect(screen.getByText('Gift artwork: emerald')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Artwork tier'),{target:{value:'owned'}});
 expect(screen.getByText('Gift artwork: silver')).toBeTruthy();
});
it('clears empty duplicate filters without treating different tiers as duplicates',async()=>{
 render(<Treasury Frame={({children})=><main>{children}</main>}/>);
 fireEvent.click(screen.getByRole('button',{name:/Gift collection/i}));
 await screen.findByRole('heading',{name:'Moon cup'});
 fireEvent.change(screen.getByLabelText('My collection'),{target:{value:'duplicates'}});
 expect(screen.queryByRole('heading',{name:'Moon cup'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Clear gift filters'}));
 expect(screen.getByRole('heading',{name:'Moon cup'})).toBeTruthy();
});

it('paginates all 100 families and resets the page when searching',async()=>{
 window.history.replaceState(null,'','/?collection=expanded');
 render(<Treasury Frame={({children})=><main>{children}</main>}/>);
 expect(screen.getAllByRole('button',{name:/Enlarge .* artwork/})).toHaveLength(24);
 fireEvent.click(screen.getByRole('button',{name:'Next →'}));
 expect(screen.getByText('Page 2 of 5')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Search badges'),{target:{value:'Infinite Inkwell'}});
 expect(screen.getAllByRole('button',{name:/Enlarge .* artwork/})).toHaveLength(1);
 expect(screen.queryByText('Page 2 of 5')).toBeNull();
});
it('opens a keyboard-dismissable in-page art preview with all five tiers',()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
 window.history.replaceState(null,'','/?collection=expanded');
 render(<Treasury Frame={({children})=><main>{children}</main>}/>);
 fireEvent.click(screen.getByRole('button',{name:'Enlarge Chapter Voyager artwork'}));
 expect(screen.getByRole('dialog')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Close artwork preview'}));
 expect(screen.queryByRole('dialog')).toBeNull();
});
