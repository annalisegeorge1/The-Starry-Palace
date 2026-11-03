import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import PalaceCompactTagRefiner from './PalaceCompactTagRefiner';
afterEach(cleanup);
const facets=[
 {category:'genre',label:'Genres',tags:[{id:'g1',name:'Romance',category:'genre',count:9}]},
 {category:'trope',label:'Tropes',tags:[{id:'t1',name:'Slow Burn',category:'trope',count:8}]},
 {category:'additional',label:'Additional tags',tags:[{id:'a1',name:'Slow Dancing',category:'additional',count:2}]}
];
it('keeps advanced categories out of regular lists',()=>{
 render(<PalaceCompactTagRefiner facets={facets} onToggle={vi.fn()}/>);
 expect(screen.getAllByText('Genres')).toHaveLength(2);
 expect(screen.queryByText('Tropes')).toBeNull();
 expect(screen.queryByText('Additional tags')).toBeNull();
});
it('returns individual matching tags from different categories with one tap',()=>{
 const toggle=vi.fn();
 render(<PalaceCompactTagRefiner facets={facets} onToggle={toggle}/>);
 fireEvent.change(screen.getByLabelText('Search a tag to include'),{target:{value:'slow'}});
 expect(screen.getByRole('group',{name:'Include matching tags'})).toBeTruthy();
 expect(screen.getByText('2 matching tags')).toBeTruthy();
 expect(screen.queryByText('Tropes')).toBeNull();
 fireEvent.click(screen.getByRole('checkbox',{name:'Include Slow Dancing'}));
 expect(toggle).toHaveBeenCalledWith('a1','include');
});
it('supports excludes and removable selections',()=>{
 const toggle=vi.fn();
 const {rerender}=render(<PalaceCompactTagRefiner facets={facets} onToggle={toggle}/>);
 fireEvent.click(screen.getByText('Exclude tags'));
 fireEvent.change(screen.getByLabelText('Search a tag to exclude'),{target:{value:'slow'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Exclude Slow Burn'}));
 expect(toggle).toHaveBeenCalledWith('t1','exclude');
 rerender(<PalaceCompactTagRefiner facets={facets} excluded={['t1']} onToggle={toggle}/>);
 fireEvent.click(screen.getByRole('button',{name:'Remove excluded Slow Burn'}));
 expect(toggle).toHaveBeenLastCalledWith('t1','exclude');
});
it('shows five choices before expanding a long category',()=>{
 const tags=Array.from({length:10},(_,i)=>({id:'g'+i,name:'Genre '+i,category:'genre',count:10-i}));
 render(<PalaceCompactTagRefiner facets={[{category:'genre',label:'Genres',tags}]} onToggle={vi.fn()}/>);
 fireEvent.click(screen.getAllByText('Genres')[0]);
 expect(screen.getByRole('checkbox',{name:'Include Genre 0'})).toBeTruthy();
 expect(screen.queryByRole('checkbox',{name:'Include Genre 8'})).toBeNull();
 fireEvent.click(screen.getAllByRole('button',{name:'Show all 10 genres'})[0]);
 expect(screen.getByRole('checkbox',{name:'Include Genre 8'})).toBeTruthy();
});

it('lets global Search readers find several distinct tags and include them together',()=>{
 const toggle=vi.fn();
 render(<PalaceCompactTagRefiner facets={facets} onToggle={toggle}/>);
 fireEvent.change(screen.getByLabelText('Search a tag to include'),{target:{value:'Romance, Slow Burn'}});
 expect(screen.getByRole('checkbox',{name:'Include Romance'})).toBeTruthy();
 expect(screen.getByRole('checkbox',{name:'Include Slow Burn'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Add 2 exact tags to include'}));
 expect(toggle).toHaveBeenCalledWith('g1','include');
 expect(toggle).toHaveBeenCalledWith('t1','include');
});
