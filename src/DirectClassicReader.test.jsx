import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {Link,MemoryRouter,Routes,Route} from 'react-router-dom';
import {openHostedClassic} from './directClassicApi';
import DirectClassicReader from './DirectClassicReader';

vi.mock('./directClassicApi',()=>({openHostedClassic:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks()});

it('recovers from a failed fetch and asks for age again after an adult edition fails to load',async()=>{
 const metadata={record:{id:'test',title:'Synthetic edition',minimum_reader_age:18},text:null};
 openHostedClassic.mockRejectedValueOnce(Error('internal database detail'))
  .mockResolvedValueOnce(metadata)
  .mockRejectedValueOnce(Error('internal database detail'))
  .mockResolvedValueOnce(metadata);
 render(<MemoryRouter initialEntries={['/classic/sample']}><Routes><Route path="/classic/:slug" element={<DirectClassicReader Frame={React.Fragment}/>}/></Routes></MemoryRouter>);
 await screen.findByRole('alert');
 expect(screen.queryByText('internal database detail')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 fireEvent.click(await screen.findByRole('button',{name:'I confirm I am 18 or older'}));
 await screen.findByRole('alert');
 fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 await screen.findByRole('region',{name:'Adult reading confirmation'});
 expect(openHostedClassic.mock.calls).toEqual([['sample'],['sample'],['sample',18],['sample']]);
});

it('ignores a delayed edition response after navigation to a different book',async()=>{
 let finishFirst;
 openHostedClassic.mockReturnValueOnce(new Promise(resolve=>{finishFirst=resolve}))
  .mockResolvedValueOnce(null);
 render(<MemoryRouter initialEntries={['/classic/first']}>
  <Link to="/classic/second">Next book</Link>
  <Routes><Route path="/classic/:slug" element={<DirectClassicReader Frame={React.Fragment}/>}/></Routes>
 </MemoryRouter>);
 fireEvent.click(screen.getByRole('link',{name:'Next book'}));
 await screen.findByRole('heading',{name:/isn't available/});
 await act(async()=>finishFirst({record:{id:'old',minimum_reader_age:18},text:null}));
 expect(screen.queryByRole('region',{name:'Adult reading confirmation'})).toBeNull();
 expect(screen.getByRole('heading',{name:/isn't available/})).toBeTruthy();
 expect(openHostedClassic.mock.calls).toEqual([['first'],['second']]);
});

it('keeps the reviewed literary classification from the archive card through the reader',async()=>{
 const slug='alice-in-blunderland-john-kendrick-bangs';
 openHostedClassic.mockResolvedValue({record:{id:'test',slug,category:'historical_fanfiction',title:'Alice in Blunderland',minimum_reader_age:13},
  text:{body_text:'Chapter I\n\nA synthetic page.'}});
 render(<MemoryRouter initialEntries={['/classic/'+slug]}><Routes><Route path="/classic/:slug" element={<DirectClassicReader Frame={React.Fragment}/>}/></Routes></MemoryRouter>);
 expect((await screen.findByRole('link',{name:'Back to Reading Rooms'})).getAttribute('href')).toBe('/reading');
 expect(screen.getByText(/Literary satire ·/)).toBeTruthy();
 expect(screen.getByLabelText('Literary tags')).toBeTruthy();
});
