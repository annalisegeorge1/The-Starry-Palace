import {afterEach,expect,it,vi} from 'vitest';
import {renderHook,act,cleanup} from '@testing-library/react';
import useManuscriptReconnect from './useManuscriptReconnect';
afterEach(cleanup);
it('retries dirty work on reconnect, but not clean or currently saving chapters',()=>{
 const retry=vi.fn();
 const coordinator={isDirty:vi.fn(()=>true),isSaving:vi.fn(()=>false)};
 const hook=renderHook(()=>useManuscriptReconnect({chapterId:'one',coordinator,retry}));
 expect(retry).not.toHaveBeenCalled();
 act(()=>window.dispatchEvent(new Event('online')));
 expect(retry).toHaveBeenCalledTimes(1);
 coordinator.isSaving.mockReturnValue(true);
 act(()=>window.dispatchEvent(new Event('online')));
 coordinator.isSaving.mockReturnValue(false);coordinator.isDirty.mockReturnValue(false);
 act(()=>window.dispatchEvent(new Event('online')));
 expect(retry).toHaveBeenCalledTimes(1);
 hook.unmount();coordinator.isDirty.mockReturnValue(true);
 act(()=>window.dispatchEvent(new Event('online')));
 expect(retry).toHaveBeenCalledTimes(1);
});
it('uses the newly selected chapter and latest editor callback',()=>{
 const oldRetry=vi.fn(),nextRetry=vi.fn();
 const coordinator={isDirty:vi.fn(()=>true),isSaving:vi.fn(()=>false)};
 const hook=renderHook(props=>useManuscriptReconnect(props),{initialProps:{chapterId:'old',coordinator,retry:oldRetry}});
 hook.rerender({chapterId:'new',coordinator,retry:nextRetry});
 act(()=>window.dispatchEvent(new Event('online')));
 expect(coordinator.isDirty).toHaveBeenCalledWith('new');
 expect(nextRetry).toHaveBeenCalledTimes(1);expect(oldRetry).not.toHaveBeenCalled();
});
