import {afterEach,expect,it,vi} from 'vitest';
import {renderHook,act,cleanup} from '@testing-library/react';
import useReadingDiscoveryState,{cleanReadingDiscovery,readingDefaults} from './useReadingDiscoveryState';
afterEach(()=>{cleanup();sessionStorage.clear();vi.restoreAllMocks()});
it('restores filters after returning from a story',()=>{
 const first=renderHook(()=>useReadingDiscoveryState('member-a'));
 act(()=>{first.result.current[1]('query','slow burn');first.result.current[1]('status','in_progress');first.result.current[1]('catalogueSort','title')});
 first.unmount();
 const second=renderHook(()=>useReadingDiscoveryState('member-a'));
 expect(second.result.current[0]).toMatchObject({query:'slow burn',status:'in_progress',catalogueSort:'title'});
});
it('never flashes another account’s filters on an identity change',()=>{
 const hook=renderHook(({id})=>useReadingDiscoveryState(id),{initialProps:{id:'member-a'}});
 act(()=>hook.result.current[1]('query','private preference'));
 hook.rerender({id:'member-b'});
 expect(hook.result.current[0].query).toBe('');
 act(()=>hook.result.current[1]('rating','teen'));
 hook.rerender({id:'member-a'});
 expect(hook.result.current[0].query).toBe('private preference');
 expect(hook.result.current[0].rating).toBe('all');
 hook.rerender({id:undefined});
 expect(hook.result.current[0]).toEqual(readingDefaults);
});
it('survives corrupt and unavailable browser storage',()=>{
 sessionStorage.setItem('palace-reading-discovery:v1:guest','broken');
 const hook=renderHook(()=>useReadingDiscoveryState());
 expect(hook.result.current[0]).toEqual(readingDefaults);
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full')});
 act(()=>hook.result.current[1]('origin','fandom'));
 expect(hook.result.current[0].origin).toBe('fandom');
 expect(cleanReadingDiscovery({status:'not-real',rating:[],query:'x'.repeat(900)}).query).toHaveLength(500);
 expect(cleanReadingDiscovery({status:'not-real'}).status).toBe('all');
});
