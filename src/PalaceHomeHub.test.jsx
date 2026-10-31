import React from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter,useLocation} from 'react-router-dom';
import PalaceHomeHub from './PalaceHomeHub';
import {palaceRecentDoorKey} from './palaceRecentDoors';
afterEach(()=>{cleanup();localStorage.clear()});
function Location(){return <output data-testid="location">{useLocation().pathname+useLocation().search}</output>}
it('keeps guest creative destinations after sign-in and switches discovery paths',()=>{
 render(<MemoryRouter><PalaceHomeHub/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Comics Gallery/}).getAttribute('href')).toBe('/comics');
 fireEvent.click(screen.getByRole('button',{name:'Create'}));
 expect(screen.getByRole('link',{name:/Writing Chamber/}).getAttribute('href')).toBe('/login?next=%2Fwriting');
 expect(screen.getByRole('button',{name:'Create'}).getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Gather'}));
 expect(screen.getByRole('link',{name:/Palace Letters/}).getAttribute('href')).toBe('/login?next=%2Fletters');
});
it('routes typed searches safely and ignores whitespace',()=>{
 render(<MemoryRouter><PalaceHomeHub/><Location/></MemoryRouter>);
 const input=screen.getByRole('textbox',{name:'Search the Palace'});
 fireEvent.change(input,{target:{value:'   '}});
 fireEvent.submit(screen.getByRole('search',{name:'Discover stories and creators'}));
 expect(screen.getByTestId('location').textContent).toBe('/');
 fireEvent.change(input,{target:{value:' moon & stars '}});
 fireEvent.submit(screen.getByRole('search',{name:'Discover stories and creators'}));
 expect(screen.getByTestId('location').textContent).toBe('/search?q=moon%20%26%20stars');
});
it('never carries recent rooms between members or into the guest view',()=>{
 localStorage.setItem(palaceRecentDoorKey('member-one'),JSON.stringify([{path:'/writing/private-draft',label:'Private draft'}]));
 const {rerender}=render(<MemoryRouter><PalaceHomeHub memberId="member-one"/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Private draft/})).toBeTruthy();
 rerender(<MemoryRouter><PalaceHomeHub memberId="member-two"/></MemoryRouter>);
 expect(screen.queryByRole('link',{name:/Private draft/})).toBeNull();
 rerender(<MemoryRouter><PalaceHomeHub/></MemoryRouter>);
 expect(screen.queryByRole('navigation',{name:'Recently visited Palace rooms'})).toBeNull();
});


it('does not fill a homecoming with three separate Treasury links',()=>{
 const key=palaceRecentDoorKey('member-one');
 localStorage.setItem(key,JSON.stringify([
  {path:'/treasury?tab=achievements',label:'Badges & achievements'},
  {path:'/treasury/catalogue',label:'Full catalogue'},
  {path:'/treasury',label:'Royal Treasury'},
  {path:'/reading',label:'Reading Rooms'},
  {path:'/writing',label:'Writing Chamber'}
 ]));
 render(<MemoryRouter><PalaceHomeHub memberId="member-one"/></MemoryRouter>);
 const nav=screen.getByRole('navigation',{name:'Recently visited Palace rooms'});
 const links=[...nav.querySelectorAll('a')];
 expect(links).toHaveLength(3);
 expect(links.map(link=>link.getAttribute('href'))).toEqual([
  '/treasury?tab=achievements','/reading','/writing'
 ]);
 expect(screen.getByText('Your latest stop in each Palace room')).toBeTruthy();
});
