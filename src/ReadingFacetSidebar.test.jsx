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
