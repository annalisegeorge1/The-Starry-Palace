/** Email consent is independent of in-site notification presets. */
export const EMAIL_ALERT_TOPICS=[
 ['story','New chapters and stories'],
 ['comic','Comic updates'],
 ['comments','Comments and replies'],
 ['message','Palace Letters (no message body in email)'],
 ['invitation','Invitations'],
 ['clubs','Clubs and groups'],
 ['event','Events and celebrations'],
 ['treasury','Royal Treasury'],
 ['council','Palace Council']
];
export const EMAIL_ALERT_DEFAULT_TOPICS=['story','comic','comments','message','invitation','event'];
export const EMAIL_ALERT_FREQUENCIES=['immediate','daily','weekly'];
export function emailAlertFormPatch(form){
 const selected=EMAIL_ALERT_TOPICS.map(([key])=>key).filter(key=>form.has('email_topic_'+key));
 const raw=String(form.get('email_frequency')||'daily');
 const frequency=EMAIL_ALERT_FREQUENCIES.includes(raw)?raw:'daily';
 return {
  email_alerts_enabled:form.has('email_alerts_enabled')&&selected.length>0,
  email_frequency:frequency,
  email_topics:selected
 };
}
