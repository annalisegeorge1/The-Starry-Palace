import React,{useState} from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import TagStoryFilters,{DEFAULT_TAG_STORY_FILTERS,hasTagStoryFilters} from './TagStoryFilters';
afterEach(cleanup);
function Harness(){
 const [filters,setFilters]=useState({...DEFAULT_TAG_STORY_FILTERS}),[sort,setSort]=useState('updated'),[text,setText]=useState('');
 return <TagStoryFilters filters={filters} onFilters={setFilters} sort={sort} onSort={setSort} text={text} onText={setText} busy={false} onSubmit={e=>e.preventDefault()}/>;
}
it('offers full archive sorts without advertising loaded-only modes',()=>{
 render(<Harness/>);
 const sort=screen.getByLabelText('Sort stories');
 expect(sort.options).toHaveLength(7);
 expect([...sort.options].map(o=>o.value)).not.toContain('bookmarks');
 expect(screen.getByLabelText('Rating').value).toBe('all');
 fireEvent.change(screen.getByLabelText('Rating'),{target:{value:'explicit'}});
 expect(screen.getByLabelText('Rating').value).toBe('explicit');
 expect(screen.getByText(/length · Active/)).toBeTruthy();
});
it('keeps word bounds and language controlled and does not hide ratings by default',()=>{
 render(<Harness/>);
 fireEvent.change(screen.getByLabelText('Minimum words'),{target:{value:'5000'}});
 expect(screen.getByLabelText('Maximum words').min).toBe('5000');
 fireEvent.change(screen.getByLabelText('Language'),{target:{value:'Spanish'}});
 expect(screen.getByLabelText('Language').value).toBe('Spanish');
 expect(hasTagStoryFilters(DEFAULT_TAG_STORY_FILTERS)).toBe(false);
 expect(hasTagStoryFilters({...DEFAULT_TAG_STORY_FILTERS,rating:'mature'})).toBe(true);
});
