import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
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
