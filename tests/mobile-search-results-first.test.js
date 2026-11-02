import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {shouldShowPalaceTidings} from '../src/palaceTidingsModel';
import {shouldShowPalacePassage} from '../src/palacePassagePolicy';

const main=readFileSync('src/main.jsx','utf8');
const live=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/mobile-search-results-first.css','utf8');

describe('Search results first on mobile',()=>{
 it('removes stacked discovery banners only on the Search route',()=>{
   expect(shouldShowPalaceTidings('/search')).toBe(false);
   expect(shouldShowPalaceTidings('/search?q=moon')).toBe(false);
   expect(shouldShowPalacePassage('/search')).toBe(false);
   expect(shouldShowPalaceTidings('/')).toBe(true);
   expect(shouldShowPalacePassage('/')).toBe(true);
 });
 it('keeps the search button beside the input and preserves touch targets',()=>{
   expect(main).toContain("import './mobile-search-results-first.css'");
   expect(css).toContain('grid-template-columns:22px minmax(0,1fr) auto!important');
   expect(css).toContain('grid-column:3!important');
   expect(css).toContain('min-height:44px!important');
   expect(css).toContain('font-size:16px!important');
   expect(css).toContain('.palace-shell.full-palace-shell.daylight');
 });
 it('shows recent searches without hiding their terms or Clear action',()=>{
   const section=live.split('export function SearchLive({Frame})')[1]?.split('export function TagSearchLive')[0]||'';
   expect(section).toContain('className="palace-search-recent-disclosure"');
   expect(section).toContain("key={data?'results':'before-results'} open={!data}");
   expect(section).toContain('title={term}');
   expect(section).toContain('setRecentSearches([])');
   expect(section).toContain('SEARCH_RESULT_KINDS.map');
   expect(section).toContain('className="palace-search-refinements"');
   expect(section).toContain('className="search-summary"');
 });
 it('retains the writing shortcut as a separate action, not the active Search room',()=>{
   expect(main).toContain('aria-current={activeRoom?.id===\'writing\'?\'page\':undefined}');
   expect(main).toContain('className={"mobile-dock-write "+');
 });
});
