import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {manuscriptTextStats,manuscriptPlainTextFromHtml} from './palaceWriterStats';
import {nextCelestialTitleProgress} from './nextCelestialTitle';
const live=readFileSync('src/liveRooms.jsx','utf8');
const css=readFileSync('src/writer-statistics-title-path.css','utf8');

describe('honest writer statistics and safely recoverable drafts',()=>{
 it('counts code points, non-whitespace characters and prose paragraphs',()=>{
  expect(manuscriptTextStats('Moon and stars.\n\nNew paragraph!')).toEqual({characters:31,charactersNoSpaces:26,words:5,paragraphs:2,readingMinutes:1});
  expect(manuscriptTextStats('')).toEqual({characters:0,charactersNoSpaces:0,words:0,paragraphs:0,readingMinutes:0});
  expect(manuscriptTextStats('😊')).toMatchObject({characters:1,words:1});
 });
 it('does not mistake HTML tags for content or include scripts in a backup',()=>{
  expect(manuscriptPlainTextFromHtml('<p>First scene</p><script>secrets()</script><p>Second scene</p>')).not.toContain('secrets()');
  expect(manuscriptPlainTextFromHtml('<p>First scene</p><p>Second scene</p>')).toContain('Second scene');
 });
 it('updates editor-only statistics without rewriting the manuscript DOM',()=>{
  expect(live).toContain('setManuscriptStats(manuscriptTextStats(el.innerText||el.textContent||\'\'))');
  expect(live).toContain('manuscriptStats.characters.toLocaleString()');
  expect(live).toContain('manuscriptStats.paragraphs.toLocaleString()');
  expect(live).toContain('manuscriptStats.readingMinutes');
  expect(live).toContain('suppressContentEditableWarning');
 });
 it('offers local recovery export and requires confirmation before discarding',()=>{
  expect(live).toContain('function downloadRecoveryCopy()');
  expect(live).toContain('body:manuscriptPlainTextFromHtml(recovery.body_html||\'\')');
  expect(live).toContain('Download recovery .txt');
  expect(live).toContain('if(!recoveryDiscardArmed)');
  expect(live).toContain("recoveryDiscardArmed?'Confirm discard':'Discard'");
  expect(live).toContain('Keep copy');
  expect(live).not.toContain('window.confirm(');
  expect(live).toContain('Restore copy');
  expect(live).toContain("localStorage.removeItem(recoveryKey())");
 });
});
describe('next Celestial title pathway',()=>{
 const groups=[{name:'First Light',need:250},{name:'Moon Court',need:500},{name:'Eclipse Court',need:1000}];
 it('tracks exact remaining points to the next eligible court',()=>{
  expect(nextCelestialTitleProgress(100,groups)).toMatchObject({missing:150,progress:40,next:groups[0]});
  expect(nextCelestialTitleProgress(300,groups)).toMatchObject({missing:200,progress:20,next:groups[1],previousThreshold:250});
  expect(nextCelestialTitleProgress(1000,groups)).toMatchObject({missing:0,allUnlocked:true,next:null});
  expect(nextCelestialTitleProgress(3,[]).allUnlocked).toBe(false);
 });
 it('refreshes actual server points and preserves keyboard and mobile layout',()=>{
  expect(live).toContain('nextCelestialTitleProgress(celestial?.lifetime_points,titleGroups)');
  expect(live).toContain('Refresh points');
  expect(live).toContain('Progress to next Celestial title court');
  expect(css).toContain('focus-visible');
  expect(css).toContain('@media(max-width:690px)');
  expect(css).toContain('.daylight');
 });
});
