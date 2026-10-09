import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceSidebarNavigation,{dividePalaceRooms} from './PalaceSidebarNavigation';

const rooms=[
 {id:'palace',label:'My Palace',path:'/chamber',sections:[['Home','/chamber'],['Chamber','/member'],['Notifications','/activity'],['Messages','/letters']]},
 {id:'reading',label:'Reading Rooms',path:'/reading',sections:[['All works','/reading'],['Comics','/comics'],['Tags','/tags'],['Lost Works','/lost-works']]},
 {id:'writing',label:'Writing Chamber',path:'/writing',sections:[['Drafts','/writing'],['Ink Duels','/writing?tab=duels'],['Relay Writing Rooms','/writing?tab=relay']]},
 {id:'life',label:'Palace Life',path:'/palace-life',sections:[['Commons','/palace-life'],['History','/palace-life?room=history']]},
 {id:'library',label:'My Library',path:'/library',sections:[['Saved Stories','/library'],['Reading History','/library?tab=history']]},
 {id:'events',label:'Events & Heritage',path:'/events',sections:[['Calendar','/events']]},
 {id:'treasury',label:'Royal Treasury',path:'/treasury',sections:[['Gifts','/treasury'],['Titles','/treasury?tab=titles']]},
 {id:'settings',label:'Settings & Safety',path:'/settings',sections:[['Privacy','/settings']]}
];
const nav=(props={})=><MemoryRouter initialEntries={[props.currentPath||'/reading']}>
 <aside className="full-sidebar"><PalaceSidebarNavigation rooms={props.rooms||rooms} activeRoom={props.activeRoom||rooms[1]}
  currentHref={props.currentHref||'/reading'} currentPath={props.currentPath||'/reading'}
  profilePath="/member/starlight" renderIcon={id=><span data-testid={'icon-'+id}>✦</span>}/>
 </aside>
</MemoryRouter>;
afterEach(cleanup);

describe('the full Palace sidebar directory',()=>{
 it('shows every main and additional Palace room without More rooms expanders',()=>{
  const {container}=render(nav());
  expect(dividePalaceRooms(rooms).primary.map(r=>r.id)).toEqual(['palace','reading','writing','life']);
  const core=screen.getByRole('navigation',{name:'Main Palace rooms'});
  const other=screen.getByRole('navigation',{name:'Other Palace rooms'});
  for(const room of dividePalaceRooms(rooms).primary){
   expect(within(core).getByRole('link',{name:new RegExp(room.label)}).getAttribute('href')).toBe(room.path);
  }
  for(const room of dividePalaceRooms(rooms).additional){
   expect(within(other).getByRole('link',{name:new RegExp(room.label)}).getAttribute('href')).toBe(room.path);
  }
  expect(container.querySelectorAll('.palace-nav-more')).toHaveLength(0);
  expect(screen.queryByText('More Palace rooms')).toBeNull();
  expect(screen.queryByRole('button',{name:/All sections/})).toBeNull();
 });
 it('displays all subsection links even when their room is not active',()=>{
  const {container}=render(nav({activeRoom:rooms[1]}));
  const core=screen.getByRole('navigation',{name:'Main Palace rooms'});
  const other=screen.getByRole('navigation',{name:'Other Palace rooms'});
  expect(within(core).getByRole('link',{name:'Lost Works'}).getAttribute('href')).toBe('/lost-works');
  expect(within(core).getByRole('link',{name:'Ink Duels'}).getAttribute('href')).toBe('/writing?tab=duels');
  expect(within(core).getByRole('link',{name:'Relay Writing Rooms'}).getAttribute('href')).toBe('/writing?tab=relay');
  expect(within(core).getByRole('link',{name:'History'}).getAttribute('href')).toBe('/palace-life?room=history');
  expect(within(other).getByRole('link',{name:'Reading History'}).getAttribute('href')).toBe('/library?tab=history');
  expect(within(other).getByRole('link',{name:'Titles'}).getAttribute('href')).toBe('/treasury?tab=titles');
  expect(container.querySelectorAll('.palace-all-sections').length).toBe(rooms.length+2);
 });
 it('keeps current route context highlighted without hiding any other sections',()=>{
  render(nav({activeRoom:rooms[1],currentPath:'/lost-works',currentHref:'/lost-works'}));
  const active=screen.getByRole('link',{name:'Lost Works'});
  expect(active.getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link',{name:'Ink Duels'})).toBeTruthy();
 });
 it('shows all Council voting, petition, election and appeal sections at all times',()=>{
  render(nav());
  const stewardship=screen.getByRole('navigation',{name:'Palace stewardship'});
  expect(within(stewardship).getByRole('link',{name:/Palace Council/}).getAttribute('href')).toBe('/council/governance');
  expect(within(stewardship).getByRole('link',{name:/Palace Code/}).getAttribute('href')).toBe('/code');
  for(const destination of ['/council/governance?tab=overview','/council/governance?tab=ballots',
   '/council/governance?tab=petitions','/council/governance?tab=elections',
   '/council/governance?tab=notices','/council/governance?tab=appeals','/council']){
   expect([...stewardship.querySelectorAll('a')].some(a=>a.getAttribute('href')===destination)).toBe(true);
  }
 });
 it('resolves the current member Chamber link and respects public-only room lists',()=>{
  render(nav({activeRoom:rooms[0],currentPath:'/chamber',currentHref:'/chamber'}));
  expect(screen.getByRole('link',{name:'Chamber'}).getAttribute('href')).toBe('/member/starlight');
  cleanup();
  const publicRooms=rooms.filter(r=>!['palace','writing','library','treasury','settings'].includes(r.id));
  render(nav({rooms:publicRooms,activeRoom:publicRooms[0]}));
  expect(dividePalaceRooms(publicRooms).primary.map(r=>r.id)).toEqual(['reading','life']);
  expect(screen.queryByRole('link',{name:/Writing Chamber/})).toBeNull();
  expect(screen.getByRole('link',{name:/Reading Rooms/})).toBeTruthy();
 });
});
