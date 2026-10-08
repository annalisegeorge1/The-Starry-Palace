import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createChapterSwitchGate,createEditorMetricsScheduler} from './editorFlow';

describe('latest chapter selection wins',()=>{
 it('rejects a superseded save or fetch completion',()=>{
  const gate=createChapterSwitchGate();
  const first=gate.begin(),second=gate.begin();
  expect(gate.isCurrent(first)).toBe(false);
  expect(gate.isCurrent(second)).toBe(true);
  gate.cancel();
  expect(gate.isCurrent(second)).toBe(false);
 });
 it('keeps the latest intent through several quick switches',()=>{
  const gate=createChapterSwitchGate();
  const ids=['first','second','third'];
  const tokens=ids.map(()=>gate.begin());
  expect(tokens.map(gate.isCurrent)).toEqual([false,false,true]);
 });
});
describe('manuscript statistics are not rebuilt per keystroke',()=>{
 beforeEach(()=>vi.useFakeTimers());
 afterEach(()=>vi.useRealTimers());
 it('coalesces a burst of editing into one calculation',()=>{
  const work=vi.fn(),scheduler=createEditorMetricsScheduler(work,260);
  for(let n=0;n<30;n++)scheduler.schedule();
  vi.advanceTimersByTime(259);
  expect(work).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(work).toHaveBeenCalledOnce();
 });
 it('flushes immediately for publication checks and cancels on chapter change',()=>{
  const work=vi.fn(),scheduler=createEditorMetricsScheduler(work,260);
  scheduler.schedule();scheduler.flush();
  vi.runAllTimers();expect(work).toHaveBeenCalledOnce();
  scheduler.schedule();scheduler.cancel();vi.runAllTimers();
  expect(work).toHaveBeenCalledOnce();
 });
});
