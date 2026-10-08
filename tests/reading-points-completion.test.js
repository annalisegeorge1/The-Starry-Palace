import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {settleReadingChapterTransition,isShortReadingSession} from '../src/readingRewardTransition';

const room=readFileSync('src/liveRooms.jsx','utf8');
const reader=room.slice(room.indexOf('function ReaderChapter({Frame,slug,chapterId})'),room.indexOf('function palaceLocalDateTimeValue('));
const server=readFileSync('database/palace-writing-reading-rewards.sql','utf8');

describe('Celestial reading points after every chapter',()=>{
 it('settles the captured reward session even if Next chapter unmounts the previous reader while progress saves',async()=>{
  const ref={current:'eligible-session'};
  const completed=vi.fn(async()=>({awarded:2,already_completed:false}));
  const onAward=vi.fn();
  const result=await settleReadingChapterTransition({
   sessionId:ref.current,
   recordProgress:async()=>{ref.current=null;},
   completeReading:completed,
   onAward
  });
  expect(completed).toHaveBeenCalledWith('eligible-session');
  expect(onAward).toHaveBeenCalledWith(2);
  expect(result).toMatchObject({completed:true,awarded:2});
 });
 it('rejects premature reading claims quietly without inventing earned points',async()=>{
  const onAward=vi.fn(),onTooSoon=vi.fn(),onError=vi.fn();
  const result=await settleReadingChapterTransition({
   sessionId:'too-short',
   recordProgress:async()=>{},
   completeReading:async()=>{throw Error('Read for at least 90 seconds before collecting reading points.');},
   onAward,onTooSoon,onError
  });
  expect(isShortReadingSession(Error('Read for at least 90 seconds before collecting reading points.'))).toBe(true);
  expect(result).toMatchObject({completed:false,awarded:0,reason:'too-soon'});
  expect(onTooSoon).toHaveBeenCalledOnce();
  expect(onAward).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
 });
 it('does not claim points without a signed-in eligible reading session',async()=>{
  const completed=vi.fn();
  const r=await settleReadingChapterTransition({sessionId:null,recordProgress:async()=>{},completeReading:completed});
  expect(r).toMatchObject({completed:false,awarded:0});
  expect(completed).not.toHaveBeenCalled();
 });
 it('continues reward completion if private reading progress cannot be recorded',async()=>{
  const onError=vi.fn(),onAward=vi.fn();
  const r=await settleReadingChapterTransition({
   sessionId:'still-eligible',
   recordProgress:async()=>{throw Error('Progress unavailable');},
   completeReading:async()=>({awarded:2}),
   onError,onAward
  });
  expect(onError).toHaveBeenCalledOnce();
  expect(onAward).toHaveBeenCalledWith(2);
  expect(r.awarded).toBe(2);
 });
 it('does not re-award a completed chapter or exceed server limits',async()=>{
  const onAward=vi.fn();
  const r=await settleReadingChapterTransition({
   sessionId:'already-rewarded',recordProgress:async()=>{},
   completeReading:async()=>({awarded:0,already_completed:true}),onAward
  });
  expect(r).toMatchObject({completed:true,awarded:0,alreadyCompleted:true});
  expect(onAward).not.toHaveBeenCalled();
  expect(server).toContain("interval '90 seconds'");
  expect(server).toContain("v_words<200");
  expect(server).toContain("v_day<20");
  expect(server).toContain("'creative:reading:'");
 });
 it('uses the chapter transition in both Next and chapter navigation without finishing the whole work',()=>{
  expect(reader).toContain('const readingSessionId=earnSessionRef.current;');
  expect(reader).toContain('sessionId:readingSessionId');
  expect(reader).toContain('await settleReadingChapterTransition(');
  expect(reader).toContain("onClick={()=>finish(false)} to={\"/work/\"+slug+\"/chapter/\"+next.id}");
  expect(reader).toContain('function jumpChapter(id){if(id&&id!==chapterId){finish(false);navigate(');
  expect(reader).toContain('onClick={()=>finish(true)}>Mark work finished ✦');
  expect(reader).toContain('recordReadingProgress(session.user.id,data.work.id,data.chapter.id,done?100:Math.max(5,Math.min(95,progress)),done,done?100:readerPlace)');
  expect(reader).toContain('90 seconds of reading');
  expect(reader).toContain("session?.user?.id&&session.user.id!==data.work.author_id");
 });
});
