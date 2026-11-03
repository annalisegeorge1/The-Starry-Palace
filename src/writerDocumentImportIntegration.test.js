import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const room=readFileSync('src/liveRooms.jsx','utf8'),style=readFileSync('src/writer-document-import.css','utf8');
describe('Private manuscript document import integration',()=>{
 it('is opt-in and reachable from Writing Chamber chapter actions',()=>{
  expect(room).toContain('Import Word / document');
  expect(room).toContain('<WriterDocumentImporter onImport={importDocumentAsPrivateChapter}');
  expect(room).toContain('importDocumentAsPrivateChapter(document)');
 });
 it('creates a separate private chapter rather than replacing the editor DOM',()=>{
  const start=room.indexOf('async function importDocumentAsPrivateChapter('),end=room.indexOf('function handleWriterPaste',start);
  const handler=room.slice(start,end);
  expect(handler).toContain('await createChapter(session.user.id,data.id,document.title)');
  expect(handler).toContain('await saveChapter(session.user.id,added.id');
  expect(handler).toContain('await persistChapter(form)');
  expect(handler).toContain('hasUnsavedChanges()');
  expect(handler).not.toContain('editorRef.current.innerHTML=');
  expect(handler).not.toContain('publishChapter(');
 });
 it('keeps local preview scrollable and mobile import buttons readable',()=>{
  expect(style).toContain('max-height:320px;overflow:auto');
  expect(style).toContain('.writer-import-actions>button');
 });
});
