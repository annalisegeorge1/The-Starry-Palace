/** Existing RLS-protected in-Palace categories and separate email consent.
 * This module never sends email or implies that a sender is deployed.
 */
export const IN_APP_NOTIFICATION_CATEGORIES=[
 ['stories','Story and chapter updates'],
 ['comments','Comments and replies'],
 ['messages','Palace Letters'],
 ['invitations','Invitations'],
 ['clubs','Clubs and groups'],
 ['events','Events and celebrations'],
 ['treasury','Royal Treasury'],
 ['council','Palace Council'],
 ['follows','New followers'],
 ['forum','Palace Commons'],
 ['archive','Lost Works archive'],
 ['digest','In-Palace roundups']
];
const selections={
 all:IN_APP_NOTIFICATION_CATEGORIES.map(([key])=>key),
 focused:['stories','comments','messages','invitations','events','council'],
 quiet:['messages','invitations','council']
};
export function notificationPreset(kind,current={}){
 if(!Object.prototype.hasOwnProperty.call(selections,kind))throw new Error('Unknown notification preset.');
 const chosen=new Set(selections[kind]);
 const patch=Object.fromEntries(IN_APP_NOTIFICATION_CATEGORIES.map(([key])=>[key,chosen.has(key)]));
 // Never opt users into email via a general in-Palace preset.
 return {...patch,quiet_hours_enabled:!!current.quiet_hours_enabled,
  quiet_hours_start:current.quiet_hours_start||null,
  quiet_hours_end:current.quiet_hours_end||null};
}
export function notificationFormPatch(form){
 const quiet=form.has('quiet_hours_enabled');
 const start=String(form.get('quiet_hours_start')||'').trim();
 const end=String(form.get('quiet_hours_end')||'').trim();
 if(quiet&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)))
  throw new Error('Choose both start and end times for quiet hours.');
 return {
  ...Object.fromEntries(IN_APP_NOTIFICATION_CATEGORIES.map(([key])=>[key,form.has(key)])),
  email_digest:form.has('email_digest'),
  quiet_hours_enabled:quiet,
  quiet_hours_start:quiet?start:null,
  quiet_hours_end:quiet?end:null
 };
}
