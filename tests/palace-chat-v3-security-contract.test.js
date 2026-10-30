import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const data=readFileSync('src/palaceData.js','utf8');
const view=readFileSync('src/PalaceChatDrawer.jsx','utf8');
const schema=readFileSync('database/palace-messenger-v3-staging-review.sql','utf8');
describe('Messenger member safety and future-schema release guard',()=>{
 it('submits direct conversation reports with the actual permitted DB status',()=>{
  expect(data).toContain("reason:text,status:'submitted'");
  expect(data).not.toContain("reason:text,status:'open'");
  expect(view).toContain("reportConversation(userId,roomId,otherUserId");
 });
 it('offers both block and report controls without silently reporting',()=>{
  expect(view).toContain('setMemberBoundary(userId,otherUserId');
  expect(view).toContain('submitCommunityReport(userId,\'member\'');
  expect(view).toContain("if(blocked&&!window.confirm(");
 });
 it('keeps new schema isolated from live and enforces membership-based SQL permissions',()=>{
  expect(schema).toContain('DO NOT EXECUTE AGAINST THE LIVE');
  expect(schema).toContain('enable row level security');
  expect(schema).toContain('private.is_conversation_member');
  expect(schema).toContain('private.is_palace_group_member');
  expect(schema).toContain('foreign key (reply_to_id,conversation_id)');
  expect(schema).not.toContain('security definer');
 });
});
