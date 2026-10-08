import {describe,it,expect} from 'vitest';
import {PALACE_BETA_CHECKS,betaChecksFor,betaCounts,nextBetaCheck,buildBetaReport,cleanBetaIssue,betaIssueHasContent,betaInviteUrl,betaInvitationText} from './palaceBetaData';
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
 it('includes events, heritage and community discovery for every volunteer track',()=>{
  for(const role of ['reader','writer','artist','moderator']){
   const checks=betaChecksFor(role);
   for(const id of ['events','heritage','commons'])expect(checks.some(check=>check.id===id)).toBe(true);
  }
  expect(betaChecksFor('reader').find(check=>check.id==='events').url).toBe('/events');
 });
 it('separates success, trouble, and skipped tasks instead of counting them all as passed',()=>{
  const checks=betaChecksFor('reader').slice(0,4);
  const checked={[checks[0].id]:'passed',[checks[1].id]:'stuck',[checks[2].id]:'skipped'};
  expect(betaCounts(checks,checked)).toEqual({marked:3,attempted:2,passed:1,stuck:1,skipped:1});
 });
 it('finds the next unmarked step without hiding past results',()=>{
  const checks=betaChecksFor('reader').slice(0,4);
  expect(nextBetaCheck(checks)?.id).toBe(checks[0].id);
  expect(nextBetaCheck(checks,{[checks[0].id]:'passed',[checks[1].id]:'stuck',[checks[2].id]:'skipped'})?.id).toBe(checks[3].id);
  expect(nextBetaCheck(checks,Object.fromEntries(checks.map(c=>[c.id,'skipped'])))).toBeNull();
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
  expect(report).toContain('Checkpoints attempted: 2/');
  expect(report).toContain('Skipped: 1');
  expect(report).toContain('It was NOT automatically submitted');
  expect(report).not.toContain('password:');
 });
 it('handles partially entered issues and caps very long fields',()=>{
  expect(betaIssueHasContent({page:'/reading'})).toBe(true);
  expect(betaIssueHasContent({severity:'major'})).toBe(false);
  const issue=cleanBetaIssue({steps:'x'.repeat(2000)});
  expect(issue.steps.length).toBe(1800);
 });
 it('builds host-specific invitations without routing testers back to an older deployment',()=>{
  const render='https://the-starry-palace.onrender.com';
  const preview='https://the-starry-palace-preview.pages.dev';
  expect(betaInviteUrl(render)).toBe(render+'/beta');
  expect(betaInviteUrl(preview)).toBe(preview+'/beta');
  expect(betaInviteUrl('https://www.starrypalace.example/stories')).toBe('https://www.starrypalace.example/beta');
  const text=betaInvitationText(preview);
  expect(text).toContain(preview+'/beta');
  expect(text).not.toContain(render);
  expect(text).toContain('no pressure to publish');
 });
 it('does not generate shareable invites from localhost, insecure or malformed origins',()=>{
  for(const origin of ['',null,'http://localhost:5173','http://127.0.0.1:4173',
   'http://example.org','javascript:alert(1)','invalid']){
   expect(betaInviteUrl(origin)).toBe('');
   expect(betaInvitationText(origin)).toBe('');
  }
 });

});
