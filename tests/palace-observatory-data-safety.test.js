import {beforeEach,describe,expect,it,vi} from 'vitest';

const state=vi.hoisted(()=>({
  getUser:vi.fn(),isOwner:vi.fn(),from:vi.fn(),sign:vi.fn(),upload:vi.fn()
}));
vi.mock('../src/supabase',()=>({supabase:{
 auth:{getUser:state.getUser},
 from:state.from,
 storage:{from:()=>({createSignedUrl:state.sign,upload:state.upload})}
}}));
vi.mock('../src/palaceObservatoryData',()=>({getPalaceObservatoryAccess:state.isOwner}));

import {attachPalaceObservatoryScreenshot,openPalaceObservatoryScreenshot} from '../src/palaceObservatoryIssuesData.js';

const issue='93b27a03-1747-4e89-859d-1118ff6244da';
const evidence={
 id:'24764223-8c85-4e82-a22e-3b69767fd36e',issue_id:issue,
 file_path:issue+'/3c2ce629-87d0-4a4e-86e6-ea27aee299aa.png'
};
const truePng=()=>new Blob([Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0])],{type:'image/png'});

describe('Palace Observatory private evidence safety',()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  state.getUser.mockResolvedValue({data:{user:{id:'owner-session'}},error:null});
  state.isOwner.mockResolvedValue(true);
  state.sign.mockResolvedValue({data:{signedUrl:'https://private.invalid/short-lived'},error:null});
  state.upload.mockResolvedValue({data:{path:evidence.file_path},error:null});
 });
 it('denies preview before any query or storage call if Owner access is not verified',async()=>{
  state.isOwner.mockResolvedValue(false);
  await expect(openPalaceObservatoryScreenshot(evidence)).rejects.toThrow(/Owner/);
  expect(state.from).not.toHaveBeenCalled();
  expect(state.sign).not.toHaveBeenCalled();
 });
 it('will not sign a storage-only orphan when no indexed evidence exists',async()=>{
  const builder={
   select:vi.fn(),eq:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null})
  };
  builder.select.mockReturnValue(builder);builder.eq.mockReturnValue(builder);
  state.from.mockReturnValue(builder);
  await expect(openPalaceObservatoryScreenshot(evidence)).rejects.toThrow(/no longer indexed/);
  expect(state.from).toHaveBeenCalledWith('observatory_evidence');
  expect(builder.eq).toHaveBeenCalledWith('id',evidence.id);
  expect(builder.eq).toHaveBeenCalledWith('issue_id',evidence.issue_id);
  expect(builder.eq).toHaveBeenCalledWith('file_path',evidence.file_path);
  expect(state.sign).not.toHaveBeenCalled();
 });
 it('signs a saved evidence item only after the indexed record is confirmed',async()=>{
  const builder={select:vi.fn(),eq:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:evidence,error:null})};
  builder.select.mockReturnValue(builder);builder.eq.mockReturnValue(builder);
  state.from.mockReturnValue(builder);
  await expect(openPalaceObservatoryScreenshot(evidence)).resolves.toBe('https://private.invalid/short-lived');
  expect(state.sign).toHaveBeenCalledWith(evidence.file_path,120);
 });
 it('refuses an image with a spoofed PNG MIME label before uploading',async()=>{
  const fake=new Blob([Uint8Array.from([71,73,70,56,57,97,1,2,3,4,5,6])],{type:'image/png'});
  await expect(attachPalaceObservatoryScreenshot({id:issue},fake)).rejects.toThrow(/contents do not match/);
  expect(state.upload).not.toHaveBeenCalled();
  expect(state.from).not.toHaveBeenCalled();
 });
 it('reports a private orphan without minting a public or signed link',async()=>{
  const builder={
   insert:vi.fn(),select:vi.fn(),single:vi.fn().mockResolvedValue({data:null,error:{message:'index insert failed'}})
  };
  builder.insert.mockReturnValue(builder);builder.select.mockReturnValue(builder);
  state.from.mockReturnValue(builder);
  await expect(attachPalaceObservatoryScreenshot({id:issue},truePng()))
   .rejects.toThrow(/Owner-reviewed orphan cleanup/);
  expect(state.upload).toHaveBeenCalled();
  expect(state.sign).not.toHaveBeenCalled();
 });
});
