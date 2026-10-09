import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const live=read('src/liveRooms.jsx');
const search=live.slice(live.indexOf('export function SearchLive({Frame}){'),live.indexOf('export function TagSearchLive({Frame}){'));
const main=read('src/main.jsx');
const styles=read('src/palace-search-room-refinement.css');
describe('Palace Search route, navigation and readability',()=>{
 it('reacts when the header searches again while already in Search Room',()=>{
  expect(search).toContain('const navigate=useNavigate(),location=useLocation()');
  expect(search).toContain("new URLSearchParams(location.search).get('q')");
  expect(search).toContain('},[routeQ]);');
  expect(search).toContain("navigate('/search?q='+encodeURIComponent(clean))");
  expect(search).not.toContain("history.replaceState(null,'','/search");
  expect(main).toContain("navigate('/search?q='+encodeURIComponent(search.trim()))");
 });
 it('prevents old results from overwriting a newer search and handles empty URLs',()=>{
  expect(search).toContain('++requestVersion.current');
  expect(search).toContain('if(version!==requestVersion.current)return');
  expect(search).toContain('return()=>{requestVersion.current++}');
  expect(search).toContain('setData(null);setSuggestions(null);setBusy(false)');
  expect(search).toContain('role="status" aria-live="polite"');
  expect(search).toContain('role="alert"');
 });
 it('keeps search filters within existing relevant results, not a new scoring backend',()=>{
  expect(search).toContain('filterPalaceSearchGroups(data,{rating,completion,sort})');
  expect(search).toContain('const groups=data?filterPalaceSearchGroups');
  expect(search).toContain('SEARCH_RESULT_KINDS.map');
  for(const family of ['works','comics','members','tags','clubs','archive']){
   expect(search).toContain('groups.'+family+'.length>0');
   expect(search).toContain('{groups.'+family+'.map');
  }
  expect(search).toContain('<StoryRatingBadge rating={c.rating}/>');
  expect(search).toContain('onClick={clearFacets}');
 });
 it('keeps optional refinements tucked away and safe for mobile/daylight',()=>{
  expect(search).toContain('<details className="palace-search-refinements"');
  expect(search).toContain('Filter search by content rating');
  expect(search).toContain('Filter search by completion');
  expect(styles).toContain('.palace-shell.daylight .legacy-search-page');
  expect(styles).toContain('@media(max-width:600px)');
  expect(main).toContain("import './palace-search-room-refinement.css';");
  expect(styles).not.toContain('backdrop-filter');
 });
});
