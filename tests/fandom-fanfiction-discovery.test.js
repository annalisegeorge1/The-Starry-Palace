import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {MODERN_FANFICTION_LINKS} from '../src/palaceFanfictionDiscovery.js';
import {filterModernFanfiction,matchesFanfictionFandom,modernFanfictionGuide} from '../src/fanfictionMetadata.js';

const atlas=readFileSync('src/PalaceFandomAtlas.jsx','utf8');
const reading=readFileSync('src/UnifiedFanworkCatalogue.jsx','utf8');
const nav=readFileSync('src/main.jsx','utf8');

describe('Fandom Atlas includes the same rights-aware Fanfiction collection',()=>{
 it('keeps all previously indexed modern stories with provenance and matching tags',()=>{
  expect(MODERN_FANFICTION_LINKS).toHaveLength(98);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.id)).size).toBe(98);
  expect(new Set(MODERN_FANFICTION_LINKS.map(w=>w.sourceUrl)).size).toBe(98);
  for(const work of MODERN_FANFICTION_LINKS){
   expect(work.creator).toBeTruthy();
   expect(work.sourceUrl).toMatch(/^https:\/\//);
   expect(work.permissionUrl).toMatch(/^https:\/\//);
   expect(modernFanfictionGuide(work).tags.some(tag=>tag.category==='fandom')).toBe(true);
  }
 });
 it('matches real fandom tags for single, multiple and crossover selections',()=>{
  expect(MODERN_FANFICTION_LINKS.some(w=>w.id==='anime-sharade-and-not-to-yield')).toBe(true);
  expect(MODERN_FANFICTION_LINKS.some(w=>w.id==='anime-miara-masquerade')).toBe(true);
  const naruto=filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['Naruto']});
  expect(naruto.some(w=>w.id==='anime-primulad-platos-rotos')).toBe(true);
  expect(naruto.some(w=>w.id==='lastgoodname-stonewalling')).toBe(false);
  const any=filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['Naruto','One Piece'],fandomMatch:'any'});
  expect(any.length).toBeGreaterThan(naruto.length);
  const all=filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['One Piece','Yu-Gi-Oh! 5D’s'],fandomMatch:'all'});
  expect(all.map(w=>w.id)).toContain('anime-lalunaticscribe-restructer-revolution');
  expect(all.every(w=>matchesFanfictionFandom(w,'One Piece')&&matchesFanfictionFandom(w,'Yu-Gi-Oh! 5D’s'))).toBe(true);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['Nonexistent fandom']}).length).toBe(0);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['Naruto'],rating:'mature'})
   .every(w=>modernFanfictionGuide(w).rating==='mature')).toBe(true);
  expect(filterModernFanfiction(MODERN_FANFICTION_LINKS,{fandomNames:['Ouran High School Host Club']})
   .map(w=>w.id)).toContain('anime-animeisperfection-frozen-heart');
 });
 it('offers an actual Fanfiction tab and per-fandom links without turning recommendations into published works',()=>{
  expect(nav).toContain("['Fanfiction','/reading?section=fanfiction']");
  expect(nav).toContain("['Fandoms','/fandoms']");
  expect(atlas).toContain("params.get('section')==='fanfiction'");
  expect(atlas).toContain("aria-label=\"Fandom Atlas sections\"");
  expect(atlas).toContain('Fanfiction · {MODERN_FANFICTION_LINKS.length} linked works');
  expect(atlas).toContain("'/fandoms?section=fanfiction&ids='");
  expect(atlas).toContain('<UnifiedFanworkCatalogue');
  expect(atlas).toContain('publishedWorks={[...(selectedNames.length?stories:fanworkRows),...historicFanworks]}');
  expect(atlas).toContain('inFandomAtlas={true}');
  expect(atlas).toContain('fandomNames={selectedNames}');
  expect(atlas).toContain('fandomMatch={mode}');
  expect(reading).toContain('fandomNames,fandomMatch,completion');
  expect(reading).toContain("isHistoricalFanfiction(work)");
  expect(atlas).toContain('getArchive(null)');
  expect(reading).toContain("'/classic/'+encodeURIComponent(work.slug)");
  expect(reading).toContain('target="_blank" rel="noopener noreferrer"');
  expect(reading).not.toMatch(/chat\s?gpt|openai|created by ai|written by ai/i);
 });
});
