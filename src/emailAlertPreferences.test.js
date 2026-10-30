import {describe,it,expect} from 'vitest';
import {emailAlertFormPatch,EMAIL_ALERT_DEFAULT_TOPICS} from './emailAlertPreferences.js';
describe('explicit email alerts choices',()=>{
 it('defaults to fully off regardless of previous digest interest',()=>{
  const f=new FormData();f.set('email_digest','on');
  expect(emailAlertFormPatch(f)).toEqual({email_alerts_enabled:false,email_frequency:'daily',email_topics:[]});
 });
 it('only enables requested kinds and validates frequency',()=>{
  const f=new FormData();
  f.set('email_alerts_enabled','on');f.set('email_frequency','weekly');
  f.set('email_topic_story','on');f.set('email_topic_message','on');
  expect(emailAlertFormPatch(f)).toEqual({email_alerts_enabled:true,email_frequency:'weekly',email_topics:['story','message']});
  f.set('email_frequency','whenever');expect(emailAlertFormPatch(f).email_frequency).toBe('daily');
 });
 it('cannot enable email with zero categories',()=>{
  const f=new FormData();f.set('email_alerts_enabled','on');
  expect(emailAlertFormPatch(f).email_alerts_enabled).toBe(false);
  expect(EMAIL_ALERT_DEFAULT_TOPICS).toContain('invitation');
 });
});
