import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceSidebarNavigation,{dividePalaceRooms} from './PalaceSidebarNavigation';

const rooms=[
 {id:'palace',label:'My Palace',path:'/chamber',sections:[['Home','/chamber'],['Chamber','/member'],['Notifications','/activity'],['Messages','/letters']]},
 {id:'reading',label:'Reading Rooms',path:'/reading',sections:[['All works','/reading'],['Comics','/comics'],['Tags','/tags'],['Lost Works','/lost-works']]},
 {id:'writing',label:'Writing Chamber',path:'/writing',sections:[['Drafts','/writing']]},
 {id:'life',label:'Palace Life',path:'/palace-life',sections:[['Commons','/palace-life']]},
 {id:'library',label:'My Library',path:'/library',sections:[['Saved Stories','/library'],['History','/library?tab=history']]},
 {id:'events',label:'Events & Heritage',path:'/events',sections:[['Calendar','/events']]},
 {id:'treasury',label:'Royal Treasury',path:'/treasury',sections:[['Gifts','/treasury']]},
 {id:'settings',label:'Settings & Safety',path:'/settings',sections:[['Privacy','/settings']]}
];
const nav=(props={})=><MemoryRouter initialEntries={[props.currentPath||'/reading']}>
 <aside className="full-sidebar"><PalaceSidebarNavigation rooms={rooms} activeRoom={props.activeRoom||rooms[1]}
  currentHref={props.currentHref||'/reading'} currentPath={props.currentPath||'/reading'}
  profilePath="/member/starlight" renderIcon={id=><span data-testid={'icon-'+id}>✦</span>}/>
 </aside>
</MemoryRouter>;
afterEach(cleanup);

describe('calmer Palace navigation',()=>{
 it('keeps all core rooms visible and preserves every additional room and stewardship route',()=>{
  const {container}=render(nav());
  expect(dividePalaceRooms(rooms).primary.map(r=>r.id)).toEqual(['palace','reading','writing','life']);
  const core=screen.getByRole('navigation',{name:'Main Palace rooms'});
  expect(within(core).getByRole('link',{name:/Reading Rooms/}).getAttribute('href')).toBe('/reading');
  expect(within(core).getByRole('link',{name:/Writing Chamber/}).getAttribute('href')).toBe('/writing');
  const more=container.querySelector('.palace-nav-more');
  expect(more.open).toBe(false);
  fireEvent.click(screen.getByText('More Palace rooms'));
  expect(more.open).toBe(true);
  const other=screen.getByRole('navigation',{name:'Other Palace rooms'});
  for(const target of ['/library','/events','/treasury','/settings']){
   expect([...other.querySelectorAll('a')].some(a=>a.getAttribute('href')===target)).toBe(true);
  }
  fireEvent.click(screen.getByText('Stewardship & safety'));
  const stewardship=screen.getByRole('navigation',{name:'Palace stewardship'});
  expect(within(stewardship).getByRole('link',{name:/Palace Council/}).getAttribute('href')).toBe('/council/governance');
  expect(within(stewardship).getByRole('link',{name:/Palace Code/}).getAttribute('href')).toBe('/code');
 });
 it('opens the current extra room automatically so nobody loses their place',()=>{
  const {container}=render(nav({activeRoom:rooms[4],currentPath:'/library',currentHref:'/library'}));
  expect(container.querySelector('.palace-nav-more').open).toBe(true);
  expect(screen.getByRole('link',{name:/My Library/}).getAttribute('href')).toBe('/library');
 });
 it('keeps room subsections reachable while hiding lower-priority links by default',()=>{
  render(nav({activeRoom:rooms[1],currentPath:'/reading',currentHref:'/reading'}));
  expect(screen.getByText('All works')).toBeTruthy();
  expect(screen.queryByRole('link',{name:'Lost Works'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/All sections/}));
  expect(screen.getByRole('link',{name:'Lost Works'}).getAttribute('href')).toBe('/lost-works');
 });
 it('expands subsections automatically when the selected section is beyond the first three',()=>{
  render(nav({activeRoom:rooms[1],currentPath:'/lost-works',currentHref:'/lost-works'}));
  const active=screen.getByRole('link',{name:'Lost Works'});
  expect(active.getAttribute('aria-current')).toBe('page');
 });
 it('keeps personal profile links bound to the correct member and does not show private rooms when absent',()=>{
  render(nav({activeRoom:rooms[0],currentPath:'/chamber',currentHref:'/chamber'}));
  expect(screen.getByRole('link',{name:'Chamber'}).getAttribute('href')).toBe('/member/starlight');
  cleanup();
  const publicRooms=rooms.filter(r=>!['palace','writing','library','treasury','settings'].includes(r.id));
  expect(dividePalaceRooms(publicRooms).primary.map(r=>r.id)).toEqual(['reading','life']);
 });
});
