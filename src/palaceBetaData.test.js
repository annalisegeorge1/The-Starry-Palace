import {describe,it,expect} from 'vitest';
import {PALACE_BETA_CHECKS,betaChecksFor,betaCounts,buildBetaReport,cleanBetaIssue,betaIssueHasContent} from './palaceBetaData';
describe('volunteer testing model',()=>{
 it('offers a focused reader and writer track rather than requiring every task',()=>{
  const reader=betaChecksFor('reader');
  const writer=betaChecksFor('writer');
  expect(reader.length).toBeLessThan(PALACE_BETA_CHECKS.length);
  expect(writer.length).toBeLessThan(PALACE_BETA_CHECKS.length);
  expect(reader.some(x=>x.id==='progress')).toBe(true);
  expect(writer.some(x=>x.id==='autosave')).toBe(true);
  expect(writer.every(x=>x.roles.includes('writer'))).toBe(true);
  expect(betaChecksFor('reader',true).length).toBe(PALACE_BETA_CHECKS.length);
 });
 it('separates success, trouble, and skipped tasks instead of counting them all as passed',()=>{
  const checks=betaChecksFor('reader').slice(0,4);
  const checked={[checks[0].id]:'passed',[checks[1].id]:'stuck',[checks[2].id]:'skipped'};
  expect(betaCounts(checks,checked)).toEqual({explored:3,passed:1,stuck:1});
 });
 it('builds a usable report with multiple problems but no private account data',()=>{
  const state={role:'writer',device:'Android Chrome',results:{draft:'passed',autosave:'stuck',tags:'skipped'},
   issues:[{page:'/writing',steps:'Reopened a draft',expected:'Text stays',actual:'Page was blank',severity:'blocker',frequency:'always'}],
   notes:'The headings felt hard to find.'};
  const report=buildBetaReport(state);
  for(const fragment of ['Android Chrome','[TROUBLE] Save, close and reopen','[SKIPPED] Add several tags','ISSUE 1','Page was blank','Blocking']) {
   if(fragment==='Blocking')continue;
   expect(report).toContain(fragment);
  }
  expect(report).toContain('Impact: blocker');
  expect(report).toContain('It was NOT automatically submitted');
  expect(report).not.toContain('password:');
 });
 it('handles partially entered issues and caps very long fields',()=>{
  expect(betaIssueHasContent({page:'/reading'})).toBe(true);
  expect(betaIssueHasContent({severity:'major'})).toBe(false);
  const issue=cleanBetaIssue({steps:'x'.repeat(2000)});
  expect(issue.steps.length).toBe(1800);
 });
});
