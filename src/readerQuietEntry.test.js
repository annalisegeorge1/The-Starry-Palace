import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=p=>readFileSync(resolve(process.cwd(),p),'utf8');
const rooms=read('src/liveRooms.jsx');
const reader=rooms.slice(rooms.indexOf('function ReaderChapter({Frame,slug,chapterId})'),rooms.indexOf('function palaceLocalDateTimeValue(',rooms.indexOf('function ReaderChapter({Frame,slug,chapterId})')));
const shelf=read('src/ReaderChapterShelf.jsx');
describe('Chapter-first quiet reader',()=>{
 it('keeps praise available once, but after the actual chapter prose',()=>{
  const prose=reader.indexOf('dangerouslySetInnerHTML={{__html:html}}');
  const afterword=reader.indexOf('className="reader-afterword-praise"');
  const shelfIndex=reader.indexOf('<ReaderChapterShelf');
  expect(prose).toBeGreaterThan(0);
  expect(afterword).toBeGreaterThan(prose);
  expect(shelfIndex).toBeGreaterThan(afterword);
  expect(reader.match(/className="chapter-praise-room"/g)).toHaveLength(1);
  expect(reader).toContain('onClick={()=>praiseChapter(k)}');
  expect(reader).toContain('onClick={shareChapter}');
 });
 it('memoizes readable chapter identities so the shelf is not recomputed on every scroll',()=>{
  expect(reader).toContain('const readable=React.useMemo(');
  expect(reader.indexOf('const readable=React.useMemo(')).toBeLessThan(reader.indexOf('if(data===null)return'));
  expect(shelf).toContain('export default React.memo(ReaderChapterShelf)');
 });
});
