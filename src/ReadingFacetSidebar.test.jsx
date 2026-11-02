import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import ReadingFacetSidebar from './ReadingFacetSidebar';
afterEach(cleanup);
const props={
 facets:[{category:'fandom',label:'Fandoms',tags:[{id:'f1',name:'Dragon Age',count:4}]}],
 sort:'updated',onSort:vi.fn(),rating:'all',onRating:vi.fn(),status:'all',onStatus:vi.fn(),
 included:[],excluded:[],onToggle:vi.fn(),onClear:vi.fn(),loadedCount:48,hasMore:true
};
const view=(more={})=>render(<MemoryRouter><ReadingFacetSidebar {...props} {...more}/></MemoryRouter>);
it('uses compact checkboxes in separate Include and Exclude sections without per-row menus',()=>{
 const onToggle=vi.fn(),onSort=vi.fn();view({onToggle,onSort});
 const toggle=screen.getByRole('button',{name:'Open Sort & Filter'});
 expect(toggle.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(toggle);fireEvent.click(screen.getByText('Fandoms'));
 fireEvent.click(screen.getByRole('checkbox',{name:'Include Dragon Age'}));
 expect(onToggle).toHaveBeenNthCalledWith(1,'f1','include');
 expect(screen.queryByRole('button',{name:'More options for Dragon Age'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/4\. Exclude/}));
 const fandoms=screen.getAllByText('Fandoms');
 fireEvent.click(fandoms[fandoms.length-1]);
 fireEvent.click(screen.getByRole('checkbox',{name:'Exclude Dragon Age'}));
 expect(onToggle).toHaveBeenNthCalledWith(2,'f1','exclude');
 fireEvent.change(screen.getByLabelText('Sort by'),{target:{value:'comments'}});
 expect(onSort).toHaveBeenCalledWith('comments');
 expect(screen.getByText(/currently loaded works/)).toBeTruthy();
});
it('offers clear all for current choices',()=>{
 const onClear=vi.fn();view({included:['f1'],rating:'teen',onClear});
 fireEvent.click(screen.getByRole('button',{name:'Clear choices'}));
 expect(onClear).toHaveBeenCalledOnce();
});
it('include and exclude relationship checkboxes work in their respective sections',()=>{
 const onToggleRelationship=vi.fn();view({onToggleRelationship});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Include F/F relationships'}));
 fireEvent.click(screen.getByRole('button',{name:/4\. Exclude/}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Exclude M/M relationships'}));
 expect(onToggleRelationship).toHaveBeenNthCalledWith(1,'ff','include');
 expect(onToggleRelationship).toHaveBeenNthCalledWith(2,'mm','exclude');
 expect(screen.queryByRole('button',{name:'More options for M/M relationships'})).toBeNull();
});
it('limits long tag lists until expanded',()=>{
 const tags=Array.from({length:12},(_,i)=>({id:'t'+i,name:'Character '+i,count:12-i}));
 const onToggle=vi.fn();view({facets:[{category:'character',label:'Characters',tags}],onToggle});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.click(screen.getByText('Characters'));
 expect(screen.getByRole('checkbox',{name:'Include Character 0'})).toBeTruthy();
 expect(screen.queryByRole('checkbox',{name:'Include Character 8'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Show all 12 characters/}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Include Character 8'}));
 expect(onToggle).toHaveBeenCalledWith('t8','include');
 fireEvent.click(screen.getByRole('button',{name:/Show fewer characters/}));
 expect(screen.queryByRole('checkbox',{name:'Include Character 8'})).toBeNull();
});
it('has one mobile header and an accessible results action above the dock',()=>{
 const onShowResults=vi.fn();view({onShowResults,resultsCount:14});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 expect(screen.getByRole('button',{name:'Close Sort & Filter'})).toBeTruthy();
 expect(document.querySelector('.reading-facet-desktop-title')).toBeNull();
 expect(document.querySelector('.reading-facet-heading')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Show 14 Results/}));
 expect(onShowResults).toHaveBeenCalledOnce();
 expect(screen.getByRole('button',{name:'Open Sort & Filter'}).getAttribute('aria-expanded')).toBe('false');
});
it('reflects checked state in controlled tag choices',()=>{
 const {rerender}=view();
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.click(screen.getByText('Fandoms'));
 expect(screen.getByRole('checkbox',{name:'Include Dragon Age'}).checked).toBe(false);
 rerender(<MemoryRouter><ReadingFacetSidebar {...props} included={['f1']}/></MemoryRouter>);
 expect(screen.getByRole('checkbox',{name:'Include Dragon Age'}).checked).toBe(true);
});
