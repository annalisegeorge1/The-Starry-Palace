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

it('hides Tropes and every later category from the default Include and Exclude lists',()=>{
 const categories=[
  ['genre','Genres','Fantasy'],['trope','Tropes','Slow Burn'],
  ['additional','Additional tags','Long Chapters'],['theme','Themes','Hope'],
  ['mood','Moods','Dark'],['setting','Settings','Castle'],
  ['format','Formats','Poetry'],['other','Other tags','Unusual']
 ];
 const facets=categories.map(([category,label,name],i)=>({category,label,tags:[{id:'tag-'+i,name,count:4}]}));
 view({facets});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 expect(screen.getByText('Genres')).toBeTruthy();
 for(const [,label] of categories.slice(1))expect(screen.queryByText(label)).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/4\. Exclude/}));
 const genres=screen.getAllByText('Genres');
 expect(genres).toHaveLength(2);
 for(const [,label] of categories.slice(1))expect(screen.queryByText(label)).toBeNull();
});
it('finds a trope through Include search and keeps its active choice removable after clearing search',()=>{
 const facets=[{category:'trope',label:'Tropes',tags:[{id:'slow',name:'Slow Burn',count:7}]}];
 const onToggle=vi.fn();
 const {rerender}=view({facets,onToggle});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 expect(screen.queryByText('Tropes')).toBeNull();
 fireEvent.change(screen.getByLabelText('Other tags to include'),{target:{value:'slow'}});
 expect(screen.queryByText('Tropes')).toBeNull();
 expect(screen.getByRole('group',{name:'Include matching tags'})).toBeTruthy();
 fireEvent.click(screen.getByRole('checkbox',{name:'Include Slow Burn'}));
 expect(onToggle).toHaveBeenCalledWith('slow','include');
 rerender(<MemoryRouter><ReadingFacetSidebar {...props} facets={facets} onToggle={onToggle} included={['slow']} selectedTagNames={{slow:'Slow Burn'}}/></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Other tags to include'),{target:{value:''}});
 expect(screen.queryByText('Tropes')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Remove Slow Burn from include tags'}));
 expect(onToggle).toHaveBeenLastCalledWith('slow','include');
});
it('finds hidden tropes through Exclude search without displaying the category by default',()=>{
 const facets=[{category:'trope',label:'Tropes',tags:[{id:'slow',name:'Slow Burn',count:7}]}];
 const onToggle=vi.fn();view({facets,onToggle});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.click(screen.getByRole('button',{name:/4\. Exclude/}));
 expect(screen.queryByText('Tropes')).toBeNull();
 fireEvent.change(screen.getByLabelText('Other tags to exclude'),{target:{value:'slow'}});
 expect(screen.queryByText('Tropes')).toBeNull();
 expect(screen.getByRole('group',{name:'Exclude matching tags'})).toBeTruthy();
 fireEvent.click(screen.getByRole('checkbox',{name:'Exclude Slow Burn'}));
 expect(onToggle).toHaveBeenCalledWith('slow','exclude');
});

it('hides the results button after scrolling past the filters, then restores it above them',()=>{
 view({resultsCount:14});
 const aside=document.querySelector('.reading-facet-sidebar');
 const original=aside.getBoundingClientRect;
 let rect={top:70,bottom:510,left:0,right:340,width:340,height:440};
 aside.getBoundingClientRect=()=>rect;
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 expect(screen.getByRole('button',{name:/Show 14 Results/})).toBeTruthy();
 rect={top:-800,bottom:-150,left:0,right:340,width:340,height:650};
 fireEvent.scroll(window);
 expect(screen.queryByRole('button',{name:/Show 14 Results/})).toBeNull();
 rect={top:95,bottom:680,left:0,right:340,width:340,height:585};
 fireEvent.scroll(window);
 expect(screen.getByRole('button',{name:/Show 14 Results/})).toBeTruthy();
 aside.getBoundingClientRect=original;
});
it('exposes the measured dock clearance to the results footer',()=>{
 view({resultsCount:3});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 const footer=document.querySelector('body>.reading-filter-mobile-result-action');
 expect(footer).toBeTruthy();
 expect(footer.style.getPropertyValue('--reading-filter-dock-bottom')).toMatch(/px$/);
});

it('shows a flat list of individual tags from different categories when searching',()=>{
 const facets=[
  {category:'trope',label:'Tropes',tags:[{id:'slow-1',name:'Slow Burn',count:9}]},
  {category:'additional',label:'Additional tags',tags:[{id:'slow-2',name:'Slow Romance',count:3}]},
  {category:'genre',label:'Genres',tags:[{id:'other',name:'Fantasy',count:5}]}
 ];
 const onToggle=vi.fn();
 view({facets,onToggle});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.change(screen.getByLabelText('Other tags to include'),{target:{value:'slow'}});
 expect(screen.queryByText('Tropes')).toBeNull();
 expect(screen.queryByText('Additional tags')).toBeNull();
 expect(screen.queryByText('Genres')).toBeNull();
 expect(screen.getByText('2 matching tags')).toBeTruthy();
 fireEvent.click(screen.getByRole('checkbox',{name:'Include Slow Romance'}));
 expect(onToggle).toHaveBeenCalledWith('slow-2','include');
});

it('supports multiple comma-separated tag names in Reading Rooms include and exclude filters',()=>{
 const tags=[
  {id:'rich',name:'Richonne',count:6},
  {id:'slow',name:'Slow Burn',count:3},
  {id:'family',name:'Found Family',count:4}
 ];
 const onToggle=vi.fn();
 view({facets:[{category:'relationship',label:'Relationships',tags:tags.slice(0,1)},{category:'trope',label:'Tropes',tags:tags.slice(1)}],onToggle});
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.change(screen.getByLabelText('Other tags to include'),{target:{value:'Richonne, Slow Burn'}});
 expect(screen.getByRole('checkbox',{name:'Include Richonne'})).toBeTruthy();
 expect(screen.getByRole('checkbox',{name:'Include Slow Burn'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Add 2 exact tags to include'}));
 expect(onToggle).toHaveBeenCalledWith('rich','include');
 expect(onToggle).toHaveBeenCalledWith('slow','include');
 fireEvent.click(screen.getByRole('button',{name:/4\. Exclude/}));
 fireEvent.change(screen.getByLabelText('Other tags to exclude'),{target:{value:'Found Family; Richonne'}});
 fireEvent.click(screen.getByRole('button',{name:'Add 2 exact tags to exclude'}));
 expect(onToggle).toHaveBeenCalledWith('family','exclude');
 expect(onToggle).toHaveBeenCalledWith('rich','exclude');
});
