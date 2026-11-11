import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect,it,vi} from 'vitest';
import {EventsLive} from './liveRooms';
import {getEventsHeritage} from './palaceData';

vi.mock('./auth',()=>({useAuth:()=>({session:null})}));
vi.mock('./palaceData',async original=>({...await original(),getEventsHeritage:vi.fn()}));

it('keeps the writing calendar accessible when heritage is unavailable',async()=>{
 window.scrollTo=vi.fn();
 getEventsHeritage.mockResolvedValue({events:[],heritage:[],rsvps:[],saved:[],heritageUnavailable:true});
 render(<MemoryRouter><EventsLive Frame={({children})=><main>{children}</main>}/></MemoryRouter>);
 expect(await screen.findByText('upcoming gatherings')).toBeTruthy();
 expect(screen.queryByText('heritage observances',{exact:true})).toBeNull();
 expect(screen.queryByRole('alert')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Heritage calendar'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Heritage observances are temporarily unavailable');
});
