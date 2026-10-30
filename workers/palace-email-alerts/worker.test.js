import {describe,it,expect,vi} from 'vitest';
import {processPalaceEmailAlerts} from './src/index.js';
describe('scheduled Palace email delivery',()=>{
 it('is off by default and makes zero network calls',async()=>{
  const previous=globalThis.fetch;
  const fetchSpy=vi.fn();
  globalThis.fetch=fetchSpy;
  try{
   expect(await processPalaceEmailAlerts({PALACE_EMAILS_ENABLED:'false'})).toEqual({status:'disabled',sent:0});
   expect(fetchSpy).not.toHaveBeenCalled();
  }finally{globalThis.fetch=previous}
 });
 it('requires server-side authorization before enabling',async()=>{
  await expect(processPalaceEmailAlerts({PALACE_EMAILS_ENABLED:'true'})).rejects.toThrow(/missing/);
 });
});
