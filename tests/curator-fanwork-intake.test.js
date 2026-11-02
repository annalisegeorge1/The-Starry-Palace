import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateFanworkManuscript,countManuscriptWords,safeManuscriptSource,
 curatorImportEditionNote,FANWORK_IMPORT_MAX_CHARACTERS} from '../src/fanworkManuscriptIntakeModel.js';

const valid=()=>({body:'Chapter 1\n\n'+Array.from({length:35},(_,i)=>'This is a chapter written directly by its author.').join(' '),
 sourceUrl:'https://example.org/original-edition',deliveryMethod:'author_supplied',
 evidenceNote:'Received an original .txt file directly from the author for staging, on request.'});

describe('Curator fanfiction intake validates authorized manuscripts safely',()=>{
 it('accepts a complete plain-text edition without changing its content',()=>{
  const input=valid();
  const result=validateFanworkManuscript(input);
  expect(result.valid).toBe(true);
  expect(result.text).toBe(input.body);
  expect(result.wordCount).toBe(countManuscriptWords(input.body));
  expect(result.wordCount).toBeGreaterThan(20);
  const note=curatorImportEditionNote(input);
  expect(note).toContain('Author-supplied manuscript');
  expect(note).toContain('DRAFT ONLY');
  expect(note).not.toContain(input.evidenceNote);
 });
 it('rejects empty, tiny, too-long, untrusted URLs and undocumented sources',()=>{
  const seed=valid();
  expect(validateFanworkManuscript({...seed,body:''}).valid).toBe(false);
  expect(validateFanworkManuscript({...seed,body:'Chapter 1\nA few words.'}).valid).toBe(false);
  expect(validateFanworkManuscript({...seed,body:'a'.repeat(FANWORK_IMPORT_MAX_CHARACTERS+1)}).valid).toBe(false);
  expect(validateFanworkManuscript({...seed,deliveryMethod:'scraped_from_fanfiction_net'}).valid).toBe(false);
  expect(validateFanworkManuscript({...seed,sourceUrl:'javascript:alert(1)'}).valid).toBe(false);
  expect(validateFanworkManuscript({...seed,evidenceNote:''}).valid).toBe(false);
  expect(safeManuscriptSource('http://example.org')).toBe('');
  expect(safeManuscriptSource('https://secret:password@example.org')).toBe('');
 });
 it('keeps the imported text separate from the public site until manual publication',()=>{
  const data=readFileSync('src/curatorFanworkIntakeData.js','utf8');
  const component=readFileSync('src/CuratorFanworkIntake.jsx','utf8');
  const room=readFileSync('src/PalaceLostWorksRoom.jsx','utf8');
  expect(data).toContain(".eq('category','licensed_fanfiction')");
  expect(data).toContain(".in('publication_status',['draft','review'])");
  expect(data).toContain("fresh.host_mode!=='metadata_only'");
  expect(data).toContain(".from('archive_texts').upsert");
  expect(data).not.toContain("publication_status:'published'");
  expect(data).not.toContain("rights_status:'licensed'");
  expect(data).toContain(".from('archive_rights_records')");
  expect(data).toContain("permits_hosting:false");
  expect(data).toContain("status:'review'");
  expect(data).not.toContain("status:'verified'");
  expect(component).toContain("Preserve the author's original text.");
  expect(component).toContain('Stage manuscript privately');
  expect(room).toContain('<CuratorFanworkIntake/>');
 });
});
