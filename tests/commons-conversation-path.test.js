import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const source=readFileSync(resolve(process.cwd(),'src/liveRooms.jsx'),'utf8');
const life=source.split('export function PalaceLifeLive(')[1]?.split('export function ')[0]||'';
const main=readFileSync(resolve(process.cwd(),'src/main.jsx'),'utf8');
const styles=readFileSync(resolve(process.cwd(),'src/commons-conversation-path.css'),'utf8');

describe('Commons is easier to join without synthetic activity',()=>{
 it('filters only actual threads and allows every matching result to be revealed',()=>{
  expect(life).toContain('const commonsThreads=visibleThreads.filter(t=>matchesCommonsMoment(t,threadMoment))');
  expect(life).toContain('const displayedCommonsThreads=commonsVisiblePage(commonsThreads,threadPage,12)');
  expect(life).toContain('COMMONS_MOMENTS.map(moment=>');
  expect(life).toContain('aria-pressed={threadMoment===moment.id}');
  expect(life).toContain('Reveal more conversations');
  expect(life).toContain('setThreadPage(page=>page+1)');
  expect(life).not.toContain('visibleThreads.slice(0,18)');
  expect(life).toContain("return viewOk&&queryOk&&!t.muted");
 });
 it('takes members straight to the specific reply thread in the Forum',()=>{
  expect(life).toContain('function openForumConversation(id)');
  expect(life).toContain("chooseRoom('forum')");
  expect(life).toContain("document.getElementById('palace-forum-thread-'+forumOpen)");
  expect(life).toContain("id={'palace-forum-thread-'+t.id}");
  expect(life).toContain('el.focus({preventScroll:true})');
  expect(life).toContain('onClick={()=>openForumConversation(t.id)}');
 });
 it('keeps a saved draft visible while allowing the composer to fold when empty',()=>{
  expect(life).toContain('ref={composePanelRef}');
  expect(life).toContain("defaultOpen={!!(thread.title||thread.body||thread.source||thread.kind!=='discussion')}");
  expect(life).toContain('function openCommonsComposer()');
  expect(life).toContain('openCommonsComposer();setThread(current=>');
  expect(life).toContain('threadComposeRef.current');
  expect(life).toContain("localStorage.setItem('palace-commons-compose'");
  expect(life).toContain("localStorage.removeItem('palace-commons-compose')");
  expect(life).toContain('salonPromptBank');
 });
 it('prevents duplicate posts and leaves the draft in place after failure',()=>{
  expect(life).toContain('if(postingThreadRef.current)return');
  expect(life).toContain('postingThreadRef.current=true;setPostingThread(true)');
  expect(life).toContain('finally{postingThreadRef.current=false;setPostingThread(false)}');
  expect(life).toContain('disabled={postingThread}');
  expect(life).toContain("postingThread?'Opening conversation…':composerCopy.action");
  expect(life).toContain('setThreadView(\'mine\')');
  expect(life).toContain('await createForumPoll(');
 });
 it('keeps the invite legible on small screens and in daylight',()=>{
  expect(styles).toContain('.commons-conversation-path');
  expect(styles).toContain('.commons-compose-fold');
  expect(styles).toContain('.commons-load-more');
  expect(styles).toContain('.palace-shell.daylight');
  expect(styles).toContain('@media(max-width:650px)');
  expect(styles).toContain('prefers-reduced-motion:reduce');
  expect(styles).toContain('focus-visible');
  expect(main).toContain("import './commons-conversation-path.css'");
 });
});
