import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 readingRewardEligibility,readingSessionStartFeedback,readingRewardResultFeedback
} from '../src/readingRewardEligibility';

const room=readFileSync('src/liveRooms.jsx','utf8');
const reader=room.slice(room.indexOf('function ReaderChapter({Frame,slug,chapterId})'),room.indexOf('function palaceLocalDateTimeValue('));
const style=readFileSync('src/reader-reward-completion.css','utf8');
const session={user:{id:'writer-b'}};
const eligible={work:{id:'work',author_id:'writer-a',visibility:'public',publication_status:'published'},chapter:{id:'chapter',status:'published',word_count:478}};

describe('Palace reader explains missing Celestial Points',()=>{
 it('reports when a reader is not logged in or is reading their own story',()=>{
  expect(readingRewardEligibility(eligible,null)).toMatchObject({eligible:false,message:expect.stringContaining('Sign in')});
  expect(readingRewardEligibility({...eligible,work:{...eligible.work,author_id:'writer-b'}},session)).toMatchObject({eligible:false,message:expect.stringContaining('your own story')});
  expect(readingRewardEligibility(undefined,session)).toEqual({eligible:false,message:''});
 });
 it('explains draft, hidden and short chapters instead of silently calling the reward RPC',()=>{
  expect(readingRewardEligibility({...eligible,work:{...eligible.work,visibility:'private'}},session).message).toContain('public');
  expect(readingRewardEligibility({...eligible,chapter:{...eligible.chapter,status:'draft'}},session).eligible).toBe(false);
  expect(readingRewardEligibility({...eligible,chapter:{...eligible.chapter,word_count:199}},session).message).toContain('200');
  expect(readingRewardEligibility(eligible,session)).toMatchObject({eligible:true,message:expect.stringContaining('Checking')});
 });
 it('does not promise points when the Supabase reading session never started',()=>{
  expect(readingSessionStartFeedback(null,Error('network'))).toMatchObject({status:'failed',message:expect.stringContaining('Could not start')});
  expect(readingSessionStartFeedback(null,null).status).toBe('failed');
  expect(readingSessionStartFeedback('514ba2f1-29f6-456a-8e5d-d397a77ac430',null)).toMatchObject({status:'active',message:expect.stringContaining('90 seconds')});
 });
 it('honestly reports new awards, exhausted daily cap, or insufficient reading time',()=>{
  expect(readingRewardResultFeedback({completed:true,awarded:2})).toContain('+2');
  expect(readingRewardResultFeedback({completed:true,awarded:0})).toContain('no new points');
  expect(readingRewardResultFeedback({completed:false,reason:'too-soon'})).toContain('90 seconds');
 });
 it('gives the actual reader visible status and captures pending session before navigation',()=>{
  expect(reader).toContain('readingRewardEligibility(data,session)');
  expect(reader).toContain('setReadingRewardStatus(readingSessionStartFeedback(null,error).message)');
  expect(reader).toContain('const pendingReadingSession=earnSessionRequestRef.current');
  expect(reader).toContain('await pendingReadingSession.catch(()=>null)');
  expect(reader).toContain('readingRewardResultFeedback(result)');
  expect(reader).toContain('className="reader-reward-status" role="status"');
  expect(reader).toContain('sessionId:readingSessionId');
  expect(reader).toContain('function jumpChapter(id){if(id&&id!==chapterId){finish(false);navigate(');
  expect(reader).not.toContain('beginPalaceReading(data.chapter.id).then(id=>{if(active)earnSessionRef.current=id}).catch(()=>{})');
 });
 it('keeps the reading status accessible and readable across layouts',()=>{
  expect(style).toContain('.reader-reward-status');
  expect(style).toContain('.palace-shell.daylight .reader-reward-status');
  expect(style).toContain('@media(max-width:680px)');
 });
});
