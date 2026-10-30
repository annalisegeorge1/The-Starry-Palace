/** Generic notices only. Never put private message text or drafts in email. */
export const TOPIC_LABELS = {
 story: 'Story and chapter updates',
 comic: 'Comic updates',
 comments: 'Comments and replies',
 message: 'Palace Letters',
 invitation: 'Invitations',
 clubs: 'Club invitations',
 event: 'Palace events',
 treasury: 'Royal Treasury',
 council: 'Palace Council'
};
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function preparePalaceEmail(batch) {
 const token=String(batch?.unsubscribe_token||'');
 if(!UUID.test(token)) throw new Error('Missing unsubscribe token');
 const topics={};
 for(const item of (Array.isArray(batch?.items)?batch.items:[])){
  const kind=String(item?.type||'');
  if(Object.prototype.hasOwnProperty.call(TOPIC_LABELS,kind)) topics[kind]=(topics[kind]||0)+1;
 }
 const count=Object.values(topics).reduce((a,b)=>a+b,0);
 if(!count)throw new Error('No supported email topics');
 const frequency=['daily','weekly'].includes(batch.frequency)?batch.frequency:'new';
 const title=frequency==='new'?'A new Palace notification awaits':'Your '+frequency+' Palace digest';
 const unsubscribe='https://thestarrypalace.com/email/unsubscribe#token='+token;
 const destination='https://thestarrypalace.com/activity';
 const list=Object.entries(topics).map(([key,n])=>n+' '+TOPIC_LABELS[key]);
 const text=title+'\n\n'+list.join('\n')+'\n\nOpen your notifications: '+destination+'\n\nUnsubscribe: '+unsubscribe+'\nPreferences: https://thestarrypalace.com/settings?tab=notifications';
 const html='<!doctype html><html lang="en"><body style="background:#161123;color:#f2e8ff;padding:28px;font-family:Georgia,serif">'+
 '<main style="max-width:560px;margin:auto;background:#29203a;border:1px solid #8b6bab;border-radius:16px;padding:26px">'+
 '<p style="color:#e6c98c">✦ THE STARRY PALACE</p><h1>'+title+'</h1>'+
 '<p>You have '+count+' new Palace '+(count===1?'notice':'notices')+'.</p>'+
 '<ul>'+list.map(s=>'<li>'+s+'</li>').join('')+'</ul>'+
 '<p><a style="color:#aff0e4" href="'+destination+'">Open notifications</a></p>'+
 '<p style="font-size:12px">You opted into Palace activity mail. <a style="color:#aff0e4" href="'+unsubscribe+'">Unsubscribe</a> or <a style="color:#aff0e4" href="https://thestarrypalace.com/settings?tab=notifications">change settings</a>.</p>'+
 '</main></body></html>';
 return {subject:title,text,html,count,unsubscribe};
}
