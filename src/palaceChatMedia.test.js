import {beforeEach,describe,expect,it,vi} from 'vitest';
const storage=vi.hoisted(()=>({from:vi.fn(),download:vi.fn(),createSignedUrl:vi.fn()}));
vi.mock('./supabase',()=>({supabase:{storage:{from:storage.from}}}));
import {downloadPalaceChatPhoto,PALACE_CHAT_PHOTO_BUCKET} from './palaceChatMedia';

const path='direct/70000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000001/72000000-0000-0000-0000-000000000001.webp';

beforeEach(()=>{
 storage.from.mockReset();
 storage.download.mockReset();
 storage.createSignedUrl.mockReset();
 storage.from.mockReturnValue({download:storage.download,createSignedUrl:storage.createSignedUrl});
});

describe('private chat photo retrieval',()=>{
 it('uses an authenticated Storage download, not a shareable signed link',async()=>{
  const blob=new Blob(['synthetic photo'],{type:'image/webp'});
  storage.download.mockResolvedValue({data:blob,error:null});
  expect(await downloadPalaceChatPhoto(path)).toBe(blob);
  expect(storage.from).toHaveBeenCalledWith(PALACE_CHAT_PHOTO_BUCKET);
  expect(storage.download).toHaveBeenCalledWith(path);
  expect(storage.createSignedUrl).not.toHaveBeenCalled();
 });
 it('rejects malformed or external paths before any storage request',async()=>{
  for(const invalid of ['',null,'https://evil.example/photo.webp',
   'direct/../wrong/photo.webp','direct/room/member/photo.webp']){
   await expect(downloadPalaceChatPhoto(invalid)).rejects.toThrow('Invalid private photo location.');
  }
  expect(storage.from).not.toHaveBeenCalled();
 });
 it('propagates access-denied results rather than falling back to public assets',async()=>{
  storage.download.mockResolvedValue({data:null,error:new Error('Access denied')});
  await expect(downloadPalaceChatPhoto(path)).rejects.toThrow('Access denied');
  expect(storage.createSignedUrl).not.toHaveBeenCalled();
 });
 it('rejects empty or unexpected download payloads',async()=>{
  storage.download.mockResolvedValue({data:null,error:null});
  await expect(downloadPalaceChatPhoto(path)).rejects.toThrow('Private photo could not be opened.');
 });
});
