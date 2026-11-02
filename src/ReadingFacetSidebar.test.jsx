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
it('keeps the mobile filter panel accessible and presents inclusive and exclusive actions',()=>{
 const onToggle=vi.fn(),onSort=vi.fn();
 render(<MemoryRouter><ReadingFacetSidebar {...props} onToggle={onToggle} onSort={onSort}/></MemoryRouter>);
 const button=screen.getByRole('button',{name:/Sort & Filter/});
 expect(button.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(button);
 expect(button.getAttribute('aria-expanded')).toBe('true');
 fireEvent.click(screen.getByText('Fandoms'));
 fireEvent.click(screen.getByRole('button',{name:'Include Dragon Age'}));
 fireEvent.click(screen.getByRole('button',{name:'More options for Dragon Age'}));
 fireEvent.click(screen.getByRole('button',{name:'Exclude Dragon Age'}));
 expect(onToggle).toHaveBeenNthCalledWith(1,'f1','include');
 expect(onToggle).toHaveBeenNthCalledWith(2,'f1','exclude');
 fireEvent.change(screen.getByLabelText('Sort by'),{target:{value:'comments'}});
 expect(onSort).toHaveBeenCalledWith('comments');
 expect(screen.getByText(/currently loaded works/)).toBeTruthy();
});
it('offers a way to clear combined choices without losing the tag label',()=>{
 const onClear=vi.fn();
 render(<MemoryRouter><ReadingFacetSidebar {...props} included={['f1']} excluded={[]} rating="teen" onClear={onClear}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Clear choices'}));
 expect(onClear).toHaveBeenCalledOnce();
});

it('offers explicit include and exclude relationship categories in a predictable order',()=>{
 const onToggleRelationship=vi.fn();
 render(<MemoryRouter><ReadingFacetSidebar {...props} onToggleRelationship={onToggleRelationship}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:/Sort & Filter/}));
 fireEvent.click(screen.getByRole('button',{name:'Include F/F relationships'}));
 fireEvent.click(screen.getByRole('button',{name:'More options for M/M relationships'}));
 fireEvent.click(screen.getByRole('button',{name:'Exclude M/M relationships'}));
 expect(onToggleRelationship).toHaveBeenNthCalledWith(1,'ff','include');
 expect(onToggleRelationship).toHaveBeenNthCalledWith(2,'mm','exclude');
 expect(screen.getByText('Include / Exclude Tags')).toBeTruthy();
});

it('shows only six tag rows at first, and expands on demand without losing selection',()=>{
 const tags=Array.from({length:12},(_,i)=>({id:'t'+i,name:'Character '+i,count:12-i}));
 const toggle=vi.fn();
 render(<MemoryRouter><ReadingFacetSidebar {...props} facets={[{category:'character',label:'Characters',tags}]} onToggle={toggle}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:/Sort & Filter/}));
 fireEvent.click(screen.getByText('Characters'));
 expect(screen.getByRole('button',{name:'Include Character 0'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Include Character 8'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Show all 12 characters/}));
 expect(screen.getByRole('button',{name:'Include Character 8'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Include Character 8'}));
 expect(toggle).toHaveBeenCalledWith('t8','include');
 fireEvent.click(screen.getByRole('button',{name:/Show fewer characters/}));
 expect(screen.queryByRole('button',{name:'Include Character 8'})).toBeNull();
});
it('closes filter panel using the floating results action',()=>{
 const onShowResults=vi.fn();
 render(<MemoryRouter><ReadingFacetSidebar {...props} onShowResults={onShowResults} resultsCount={14}/></MemoryRouter>);
 const open=screen.getByRole('button',{name:/Sort & Filter/});
 fireEvent.click(open);
 expect(screen.getByRole('button',{name:/Show 14 Results/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Show 14 Results/}));
 expect(onShowResults).toHaveBeenCalledOnce();
 expect(open.getAttribute('aria-expanded')).toBe('false');
});

it('shows one mobile Sort & Filter heading and one close action, not a nested header',()=>{
 render(<MemoryRouter><ReadingFacetSidebar {...props}/></MemoryRouter>);
 const toggle=screen.getByRole('button',{name:'Open Sort & Filter'});
 fireEvent.click(toggle);
 expect(screen.getByRole('button',{name:'Close Sort & Filter'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Sort & Filter'})).toBeTruthy();
 expect(document.querySelector('.reading-facet-heading')).toBeNull();
 expect(screen.queryByRole('button',{name:'Hide'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Close'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Close Sort & Filter'}));
 expect(screen.getByRole('button',{name:'Open Sort & Filter'}).getAttribute('aria-expanded')).toBe('false');
});
it('tag row has no redundant plus icon but retains visible include state',()=>{
 const {rerender}=render(<MemoryRouter><ReadingFacetSidebar {...props}/></MemoryRouter>);
 fireEvent.click(screen.getByRole('button',{name:'Open Sort & Filter'}));
 fireEvent.click(screen.getByText('Fandoms'));
 const tagButton=screen.getByRole('button',{name:'Include Dragon Age'});
 expect(tagButton.querySelector('.reading-tag-selection-icon')).toBeNull();
 expect(tagButton.getAttribute('aria-pressed')).toBe('false');
 rerender(<MemoryRouter><ReadingFacetSidebar {...props} included={['f1']}/></MemoryRouter>);
 const activeTag=screen.getByRole('button',{name:'Include Dragon Age'});
 expect(activeTag.getAttribute('aria-pressed')).toBe('true');
 expect(activeTag.querySelector('.reading-tag-selection-icon').textContent).toBe('✓');
});
