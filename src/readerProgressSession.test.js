import {expect,it,vi} from 'vitest';
import {readerProgressSession} from './readerProgressSession';

it('serializes one reader and stops an older session after a conflict',async()=>{
 let cloud=0;
 const write=vi.fn(async revision=>revision===cloud?++cloud:null);
 const a=readerProgressSession(0,write), b=readerProgressSession(0,write);
 await Promise.all([a({percent:65}),a({percent:15})]);
 await expect(b({percent:95})).rejects.toThrow('Another session');
 await expect(b({percent:99})).rejects.toThrow('Another session');
 expect(write.mock.calls.map(([revision])=>revision)).toEqual([0,1,0]);
});
it('retains the observed revision through network failures and an uncertain commit',async()=>{
 const write=vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(null);
 const save=readerProgressSession(null,write);
 await expect(save({percent:30})).rejects.toThrow('Offline');
 await expect(save({percent:32})).rejects.toThrow('Another session');
 expect(write.mock.calls.map(([revision])=>revision)).toEqual([null,null]);
});
