import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceSidebarNavigation,{dividePalaceRooms} from './PalaceSidebarNavigation';
const rooms=[
 {id:'palace',label:'My Palace',path:'/chamber',sections:[['Home','/chamber'],['Chamber','/member'],['Messages','/letters']]},
 {id:'reading',label:'Reading Rooms',path:'/reading',sections:[['All works','/reading'],['Comics','/comics'],['Lost Works','/lost-works']]},
 {id:'writing',label:'Writing Chamber',path:'/writing',sections:[['Drafts','/writing'],['Ink Duels','/writing?tab=duels'],['Relay Writing Rooms','/writing?tab=relay']]},
 {id:'life',label:'Palace Life',path:'/palace-life',sections:[['Commons','/palace-life?room=commons'],['History','/palace-life?room=history']]},
 {id:'library',label:'My Library',path:'/library',sections:[['Saved Stories','/library'],['Reading History','/library?tab=history']]},
 {id:'events',label:'Events & Heritage',path:'/events',sections:[['Calendar','/events']]},
 {id:'treasury',label:'Royal Treasury',path:'/treasury',sections:[['Titles','/treasury?tab=titles'],['Gifts','/treasury?tab=gifts']]}
];
function mount({activeId='reading',href='/reading',roomsToShow=rooms}={}){
 return render(<MemoryRouter initialEntries={[href]}><aside className="full-sidebar">
  <PalaceSidebarNavigation rooms={roomsToShow} activeRoom={roomsToShow.find(r=>r.id===activeId)}
   currentHref={href} currentPath={href.split('?')[0]} profilePath="/member/starlight"
   renderIcon={id=><span data-testid={'icon-'+id}>✦</span>}/>
 </aside></MemoryRouter>);
}
afterEach(cleanup);
describe('restored familiar Palace navigation',()=>{
 it('keeps every available top-level room immediately visible with no More rooms gate',()=>{
  mount();
  const main=screen.getByRole('navigation',{name:'Main Palace rooms'});
  const other=screen.getByRole('navigation',{name:'Other Palace rooms'});
  expect(dividePalaceRooms(rooms).primary).toHaveLength(4);
  expect([...main.querySelectorAll('.full-nav-room>a'),...other.querySelectorAll('.full-nav-room>a')]).toHaveLength(rooms.length);
  expect(within(other).getByRole('link',{name:/Royal Treasury/}).getAttribute('href')).toBe('/treasury');
  expect(screen.queryByRole('button',{name:/All sections|More Palace rooms/})).toBeNull();
 });
 it('shows ALL sections of the active room and keeps every other room quiet',()=>{
  mount({activeId:'writing',href:'/writing?tab=duels'});
  const writing=screen.getByRole('navigation',{name:'Main Palace rooms'});
  expect(within(writing).getByRole('link',{name:'Ink Duels'}).getAttribute('aria-current')).toBe('page');
  expect(within(writing).getByRole('link',{name:'Relay Writing Rooms'}).getAttribute('href')).toBe('/writing?tab=relay');
  expect(screen.queryByRole('link',{name:'Lost Works'})).toBeNull();
  expect(screen.queryByRole('link',{name:'Reading History'})).toBeNull();
  expect(screen.getByRole('link',{name:/Reading Rooms/})).toBeTruthy();
  expect(screen.getByRole('link',{name:/My Library/})).toBeTruthy();
 });
 it('reveals every section automatically when its room becomes active',()=>{
  mount({activeId:'life',href:'/palace-life?room=history'});
  expect(screen.getByRole('link',{name:'History'}).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link',{name:'Commons'})).toBeTruthy();
 });
 it('lists Council and Code directly but only opens their detail links when visiting',()=>{
  mount();
  const stewardship=screen.getByRole('navigation',{name:'Palace stewardship'});
  expect(within(stewardship).getByRole('link',{name:/Palace Council/})).toBeTruthy();
  expect(within(stewardship).getByRole('link',{name:/Palace Code/})).toBeTruthy();
  expect(screen.queryByRole('link',{name:'Voting Chamber'})).toBeNull();
  cleanup();
  mount({activeId:'reading',href:'/council/governance?tab=ballots'});
  expect(screen.getByRole('link',{name:'Voting Chamber'}).getAttribute('aria-current')).toBe('page');
 });
 it('keeps profile URLs attached to the current member and excludes private rooms when not signed in',()=>{
  mount({activeId:'palace',href:'/chamber'});
  expect(screen.getByRole('link',{name:'Chamber'}).getAttribute('href')).toBe('/member/starlight');
  cleanup();
  const guest=rooms.filter(r=>!['palace','writing','library','treasury'].includes(r.id));
  mount({activeId:'reading',href:'/reading',roomsToShow:guest});
  expect(screen.queryByRole('link',{name:/Writing Chamber/})).toBeNull();
  expect(screen.getByRole('link',{name:/Reading Rooms/})).toBeTruthy();
 });
});
