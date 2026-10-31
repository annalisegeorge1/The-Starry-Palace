import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter,useLocation} from 'react-router-dom';

// Entirely synthetic signed-in sessions and read-only mock network results.
// No Supabase session is created, and these tests cannot write member records.
const services=vi.hoisted(()=>({
 getTreasury:vi.fn(), getLuckyDrawState:vi.fn(),getHonour:vi.fn(),
 getMyCelestialPoints:vi.fn(),getMyCelestialPointLedger:vi.fn(),
 getCelestialTitleLadder:vi.fn(),getPalaceTitleOptions:vi.fn(),
 getPalaceLife:vi.fn(),getFollowingProfilePosts:vi.fn(),getEventsHeritage:vi.fn(),
 getMyWorks:vi.fn(),getWritingExtras:vi.fn(),
 getMyRelayRooms:vi.fn(),getMicroDuels:vi.fn(),getMicroDuelRecord:vi.fn(),
 createDraft:vi.fn(),saveCommunityIntroduction:vi.fn(),claimLuckyDraw:vi.fn()
}));
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'synthetic-test-member'}}})}));
vi.mock('./palaceData',async(importOriginal)=>({
 ...(await importOriginal()),
 ...services
}));
import {PalaceLifeLive,TreasuryLive,WritingLive} from './liveRooms';

const Frame=({children})=><main>{children}</main>;
function RouteProbe(){const location=useLocation();return <output data-testid="member-route">{location.pathname+location.search}</output>}
function mount(Component,route){
 return render(<MemoryRouter initialEntries={[route]}><RouteProbe/><Component Frame={Frame}/></MemoryRouter>);
}
const emptyLife=()=>({
 threads:[],clubs:[],chat:[],introductions:[],communityIntroductions:[],
 discoverableClubs:[],clubInvites:[],myClubRequests:[],stewardRequests:[],highlights:[]
});
const emptyTreasury=()=>({
 achievements:[],gifts:[],achievementShowcase:[],giftShowcase:[],
 profile:{id:'synthetic-test-member',title:'Palace Member'}
});

beforeEach(()=>{
 vi.clearAllMocks();
 window.scrollTo=vi.fn();
 localStorage.clear();
 services.getTreasury.mockResolvedValue(emptyTreasury());
 services.getLuckyDrawState.mockResolvedValue({catalogueCount:0});
 services.getHonour.mockResolvedValue({periods:[],rankings:[],preferences:{opted_out:false}});
 services.getMyCelestialPoints.mockResolvedValue({lifetime_points:0,giving_points:0,receiving_points:0,participation_points:0});
 services.getMyCelestialPointLedger.mockResolvedValue([]);
 services.getCelestialTitleLadder.mockResolvedValue([]);
 services.getPalaceTitleOptions.mockResolvedValue([]);
 services.getPalaceLife.mockResolvedValue(emptyLife());
 services.getFollowingProfilePosts.mockResolvedValue([]);
 services.getEventsHeritage.mockResolvedValue({events:[],heritage:[]});
 services.getMyWorks.mockResolvedValue([]);
 services.getWritingExtras.mockResolvedValue({comments:[],downloads:[],incoming:[],outgoing:[]});
 services.getMyRelayRooms.mockResolvedValue([]);
 services.getMicroDuels.mockResolvedValue([]);
 services.getMicroDuelRecord.mockResolvedValue(null);
});
afterEach(()=>{cleanup();localStorage.clear()});

describe('member-room smoke checks with synthetic sessions',()=>{
 it('opens the signed-in Royal Treasury and switches to titles without claiming a reward',async()=>{
  mount(TreasuryLive,'/treasury?tab=achievements');
  expect(await screen.findByRole('heading',{name:/Royal Treasury/})).toBeTruthy();
  expect(await screen.findByRole('button',{name:/Celestial titles/i})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Celestial titles/i}));
  expect(services.getTreasury).toHaveBeenCalledWith('synthetic-test-member');
  expect(services.claimLuckyDraw).not.toHaveBeenCalled();
 });
 it('opens Discover Members from a deep link and changes rooms without publishing an introduction',async()=>{
  mount(PalaceLifeLive,'/palace-life?room=stars');
  expect(await screen.findByRole('navigation',{name:'Palace Life rooms'})).toBeTruthy();
  await waitFor(()=>expect(services.getPalaceLife).toHaveBeenCalledWith('synthetic-test-member'));
  expect(screen.getByRole('button',{name:/Discover Members/}).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button',{name:/Clubs/}));
  expect(screen.getByTestId('member-route').textContent).toBe('/palace-life?room=clubs');
  expect(services.saveCommunityIntroduction).not.toHaveBeenCalled();
 });
 it('opens the signed-in Writing Chamber with no manuscripts and never creates a draft on arrival',async()=>{
  mount(WritingLive,'/writing?tab=drafts');
  await waitFor(()=>expect(services.getMyWorks).toHaveBeenCalledWith('synthetic-test-member'));
  expect(screen.getByTestId('member-route').textContent).toBe('/writing?tab=drafts');
  expect(services.createDraft).not.toHaveBeenCalled();
 });
});
