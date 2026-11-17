import React from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import PalaceLegalPages from './PalaceLegalPages';

afterEach(()=>cleanup());

const mount=(initial='/legal/content')=>render(
 <MemoryRouter initialEntries={[initial]}>
  <Routes>
   <Route path="/legal" element={<PalaceLegalPages/>}/>
   <Route path="/legal/:policy" element={<PalaceLegalPages/>}/>
  </Routes>
 </MemoryRouter>
);

it('presents the Content Policy as a navigable policy with creative-freedom and safety rules',()=>{
 mount();
 expect(screen.getByRole('heading',{name:'Content Policy',level:1})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Content Policy'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getByRole('heading',{name:'1. Creative expression and difficult subject matter'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'11. Illegal content, exploitation and technical safety'})).toBeTruthy();
 expect(screen.getByText(/not ordinarily be removed merely because someone considers/)).toBeTruthy();
 expect(screen.getByText(/the Palace allows voluntary external creator-support links/)).toBeTruthy();
});

it('supports on-page non-graphic teen intimacy and contextual historical relationships',()=>{
 mount('/legal/content');
 expect(screen.getByRole('heading',{name:'3A. Young romance, historical relationships and child safety'})).toBeTruthy();
 expect(screen.getByText(/Writers may explore teenage love and growing up without an automatic censorship rule/)).toBeTruthy();
 expect(screen.getByText(/Non-graphic intimate moments may appear on the page/)).toBeTruthy();
 expect(screen.getByText(/Historical, cultural, fantasy and politically arranged relationships/)).toBeTruthy();
 expect(screen.getByText(/Non-negotiable safeguards/)).toBeTruthy();
});

it('links to the new Content Policy from the existing Terms',()=>{
 mount('/legal/terms');
 const links=screen.getAllByRole('link',{name:'Content Policy'});
 expect(links.length).toBeGreaterThan(1);
 fireEvent.click(links[0]);
 expect(screen.getByRole('heading',{name:'Content Policy',level:1})).toBeTruthy();
});
