import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {FANDOM_MEDIA_SHELVES,INITIAL_FANDOM_DIRECTORY,NON_FANDOM_CLASSIFICATIONS} from './palaceFandomCatalogue';
const read=p=>readFileSync(resolve(process.cwd(),p),'utf8');

describe('Curated Palace fandom media taxonomy',()=>{
 it('covers the supplied media types plus a safety net for member-created worlds',()=>{
  const ids=FANDOM_MEDIA_SHELVES.map(s=>s.id);
  expect(new Set(ids).size).toBe(ids.length);
  for(const category of ['anime_manga','books_literature','cartoons_comics','celebrities_real_people','movies','music_bands','other_media','theater','tv_shows','video_games','uncategorized']){
   expect(ids).toContain(category);
  }
 });
 it('includes deep world coverage with no two canonical names differing only by case',()=>{
  expect(INITIAL_FANDOM_DIRECTORY.length).toBeGreaterThan(170);
  expect(new Set(INITIAL_FANDOM_DIRECTORY.map(x=>x.name.toLowerCase())).size).toBe(INITIAL_FANDOM_DIRECTORY.length);
  for(const row of INITIAL_FANDOM_DIRECTORY){
   expect(row.name.length).toBeGreaterThan(1);
   expect(row.media_categories.length).toBeGreaterThan(0);
   for(const media of row.media_categories)expect(FANDOM_MEDIA_SHELVES.some(s=>s.id===media)).toBe(true);
  }
  expect(INITIAL_FANDOM_DIRECTORY.find(x=>x.name==='Interview with the Vampire').aliases).toContain('IWTV');
  expect(INITIAL_FANDOM_DIRECTORY.find(x=>x.name==='The Walking Dead').aliases).toContain('TWD');
  expect(INITIAL_FANDOM_DIRECTORY.find(x=>x.name==='Star Wars').media_categories).toContain('video_games');
  expect(NON_FANDOM_CLASSIFICATIONS).toContain('Original Work');
 });
 it('persists safe additive data without modifying existing story tag links',()=>{
  const sql=read('database/palace-fandom-directory-v1.sql');
  expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.fandom_directory');
  expect(sql).toContain('ON CONFLICT DO NOTHING');
  expect(sql).toContain('ON CONFLICT(tag_id) DO NOTHING');
  expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
  expect(sql).toContain('GRANT SELECT');
  expect(sql).not.toMatch(/DELETE\s+FROM\s+public\.(tags|work_tags)/i);
  expect(sql).not.toMatch(/TRUNCATE/i);
  expect(sql).not.toMatch(/UPDATE\s+public\.work_tags/i);
 });
 it('offers stable Atlas entry points and writer-assigned tags',()=>{
  const main=read('src/main.jsx'),live=read('src/liveRooms.jsx');
  const picker=read('src/PalaceFandomMiniPicker.jsx');
  expect(main).toContain('path="/fandoms"');
  expect(main).toContain("['Fandoms','/fandoms']");
  expect(live).toContain('onChoose={chooseNewWorkFandom}');
  expect(live).toContain('onChoose={attachTagToWork}');
  expect(live).toContain('to="/fandoms"');
  expect(picker).toContain('getPalaceFandomDirectory()');
  expect(picker).toContain('type="button"');
 });
 it('never loads per-work metadata or manuscript bodies into the directory',()=>{
  const data=read('src/palaceData.js'),snippet=data.slice(data.indexOf('export async function getPalaceFandomDirectory'),data.indexOf('export async function getTagConstellation'));
  expect(snippet).toContain("from('tags')");
  expect(snippet).toContain("from('fandom_directory')");
  expect(snippet).toContain("from('work_tags')");
  expect(snippet).toContain("eq('publication_status','published')");
  expect(snippet).not.toContain('body_html');
 });
});
