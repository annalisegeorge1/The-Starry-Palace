import React from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import TagFamilyRows,{tagDisplayName} from './TagFamilyRows';
afterEach(cleanup);
it('reveals every nearby tag in increments and can collapse again',()=>{
 const tags=Array.from({length:30},(_,id)=>({id,name:'Tag '+id}));
 render(<TagFamilyRows tags={tags} category="trope">{tag=><button key={tag.id}>{tag.name}</button>}</TagFamilyRows>);
 expect(screen.queryByText('Tag 8')).toBeNull();
 fireEvent.click(screen.getByText('Show more trope tags (22 more)'));
 expect(screen.getByText('Tag 23')).toBeTruthy();
 expect(screen.queryByText('Tag 24')).toBeNull();
 fireEvent.click(screen.getByText('Show more trope tags (6 more)'));
 expect(screen.getByText('Tag 29')).toBeTruthy();
 fireEvent.click(screen.getByText('Show fewer'));
 expect(screen.queryByText('Tag 8')).toBeNull();
});
it('keeps stored spelling intact and preserves fandom and relationship acronyms',()=>{
 expect(tagDisplayName('ACADEMIC SECRET KEEPER')).toBe('Academic Secret Keeper');
 expect(tagDisplayName('F/M')).toBe('F/M');
 expect(tagDisplayName('ASOIAF AU')).toBe('ASOIAF AU');
 expect(tagDisplayName('The Walking Dead')).toBe('The Walking Dead');
});
