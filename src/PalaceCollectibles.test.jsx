import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import PalaceCollectibles from './PalaceCollectibles';
afterEach(cleanup);
it('filters original courts, renders the matching paintings, and resets pagination',async()=>{
 render(<PalaceCollectibles/>);
 fireEvent.change(screen.getByLabelText('Original court'),{target:{value:'Kingdom of Kongo'}});
 expect(screen.getByText('25 artworks found')).toBeTruthy();
 expect(await screen.findByRole('img',{name:/Forest Moon Balcony/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Next →'}));
 expect(screen.getByText('Page 2 of 2')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'100 tiered gifts'}));
 expect(screen.getByText('Page 1 of 5')).toBeTruthy();
 expect(await screen.findByRole('img',{name:'Bronze Astral Crown'})).toBeTruthy();
});

