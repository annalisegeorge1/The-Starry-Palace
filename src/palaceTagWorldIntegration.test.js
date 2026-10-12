import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync('src/main.jsx','utf8');
const page=readFileSync('src/PalaceTagWorld.jsx','utf8');
const data=readFileSync('src/palaceData.js','utf8');
const card=readFileSync('src/ReadingCardTags.jsx','utf8');
const fandom=readFileSync('src/PalaceFandomAtlas.jsx','utf8');
const tagSearch=readFileSync('src/liveRooms.jsx','utf8').split('export function TagSearchLive({Frame})')[1].split('export function WorkLive({Frame})')[0];
describe('Palace tag archive destinations',()=>{
 it('routes guests directly to full tag archive without an account gate',()=>{
  expect(main).toContain('const PalaceTagWorld=React.lazy(');
  expect(main).toContain('<Route path="/tag/:tagId" element={<React.Suspense');
  expect(main).toContain('<Frame><PalaceTagWorld/></Frame>');
  expect(page).toContain('const enabled=Boolean(tag)&&valid');
  expect(page).toContain("include=useMemo(()=>enabled?[tag.id");
  expect(page).toContain('archive=usePublishedBrowse(');
  expect(page).toContain('<ReadingArchivePager page={archive.page}');
  expect(page).toContain('<ReadingStoryContext work={work}');
  expect(page).toContain('<ReadingStoryStats work={work}');
 });
 it('reads only accepted public tags and uses secure full-archive searching',()=>{
  expect(data).toContain('export async function getPalaceTagById(tagId)');
  expect(data).toContain(".in('status',['canonical','community']).maybeSingle()");
  expect(page).toContain('searchPalaceTags(term,\'all\',35)');
  expect(page).not.toContain('ProtectedRoute');
  expect(page).not.toContain('searchWorksByTags');
 });
 it('connects fandoms, relationships and story-card tags to their destinations',()=>{
  expect(card).toContain('to={tagWorldPath(tag)||');
  expect(fandom).toContain('className="palace-fandom-browse-door"');
  expect(fandom).toContain('tagWorldPath(f)');
  expect(tagSearch).toContain('to={tagWorldPath(tag)||');
  expect(tagSearch).toContain('Explore relationship tags');
 });
});
