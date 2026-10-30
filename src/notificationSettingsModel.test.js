import {describe,it,expect} from 'vitest';
import {IN_APP_NOTIFICATION_CATEGORIES,notificationPreset,notificationFormPatch} from './notificationSettingsModel';

describe('notification settings and explicit email consent',()=>{
 it('never changes email preference through a general preset',()=>{
  for(const mode of ['all','focused','quiet']){
   const patch=notificationPreset(mode,{email_digest:true,quiet_hours_enabled:true,quiet_hours_start:'21:00',quiet_hours_end:'07:00'});
   expect('email_digest' in patch).toBe(false);
   expect(patch.quiet_hours_start).toBe('21:00');
   expect(patch.quiet_hours_end).toBe('07:00');
   expect(Object.keys(patch).length).toBe(IN_APP_NOTIFICATION_CATEGORIES.length+3);
  }
  expect(notificationPreset('all').stories).toBe(true);
  expect(notificationPreset('quiet').stories).toBe(false);
  expect(notificationPreset('quiet').messages).toBe(true);
  expect(()=>notificationPreset('missing')).toThrow();
 });
 it('stores in-Palace roundups separately from email opt-in',()=>{
  expect(notificationFormPatch(new FormData())).toMatchObject({digest:false,email_digest:false,quiet_hours_enabled:false,quiet_hours_start:null});
  const picked=new FormData();picked.set('email_digest','on');picked.set('digest','on');picked.set('stories','on');
  expect(notificationFormPatch(picked)).toMatchObject({email_digest:true,digest:true,stories:true,messages:false});
 });
 it('rejects unfinished quiet hours but accepts an overnight range',()=>{
  const form=new FormData();form.set('quiet_hours_enabled','on');form.set('quiet_hours_start','23:30');
  expect(()=>notificationFormPatch(form)).toThrow(/both start and end/);
  form.set('quiet_hours_end','06:00');
  expect(notificationFormPatch(form)).toMatchObject({quiet_hours_enabled:true,quiet_hours_start:'23:30',quiet_hours_end:'06:00'});
 });
});
