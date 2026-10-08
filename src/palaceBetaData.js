/**
 * Anonymous, voluntary beta-test reporting. Nothing in this module transmits
 * data or reads manuscripts, accounts, messages, or analytics.
 */
export const PALACE_BETA_CHECKS=[
 {id:'start',group:'First arrival',name:'Find reading and writing from the home page',url:'/',hint:'Try this without instructions. Were the main doors clear?',roles:['reader','writer','artist','moderator']},
 {id:'mobile',group:'First arrival',name:'Navigate between sections and go back',url:'/',hint:'Look for clipped tabs, blank screens, off-screen menus, or lost navigation.',roles:['reader','writer','artist','moderator']},
 {id:'reading',group:'Reading & discovery',name:'Find a story using search or a filter',url:'/reading',hint:'Try a genre or tag, then clear the filter.',roles:['reader','artist','moderator']},
 {id:'progress',group:'Reading & discovery',name:'Open a chapter, leave and resume reading',url:'/reading',hint:'For a signed-in account, does your place return correctly?',roles:['reader','artist']},
 {id:'following',group:'Reading & discovery',name:'Save or follow a story',url:'/reading',hint:'For a signed-in account, check the work appears in your library.',roles:['reader']},
 {id:'comics',group:'Reading & discovery',name:'Explore a comic on your device',url:'/comics',hint:'Can you read panels and move between pages without fighting the controls?',roles:['artist','reader']},
 {id:'draft',group:'Writing & publishing',name:'Create a private story and chapter',url:'/writing',hint:'Use a disposable test paragraph, never a valuable unpublished manuscript.',roles:['writer','artist']},
 {id:'autosave',group:'Writing & publishing',name:'Save, close and reopen a test draft',url:'/writing',hint:'Check typing responsiveness, the save message, and whether test text remains.',roles:['writer','artist']},
 {id:'network',group:'Writing & publishing',name:'Optional: try a brief network interruption',url:'/writing',hint:'Advanced test: use disposable text and keep a separate backup; verify recovery is explained.',roles:['writer']},
 {id:'tags',group:'Writing & publishing',name:'Add several tags and save settings',url:'/writing',hint:'Can you add multiple tags without losing your place or earlier selections?',roles:['writer']},
 {id:'events',group:'Events & heritage',name:'Find an upcoming gathering or event proposal',url:'/events',hint:'Check the calendar, event details and proposals. Is it clear which events are confirmed and which are only ideas?',roles:['reader','writer','artist','moderator']},
 {id:'heritage',group:'Events & heritage',name:'Explore a cultural celebration or literary tradition',url:'/events?tab=calendar',hint:'Look for traditions and holidays from different communities. Are descriptions welcoming, accurate and easy to explore?',roles:['reader','writer','artist','moderator']},
 {id:'commons',group:'Community & accessibility',name:'Find a conversation or creative community activity',url:'/palace-life',hint:'Can you understand how to participate, even without posting your own work?',roles:['reader','writer','artist','moderator']},
 {id:'palace',group:'Community & accessibility',name:'Explore a Grand Palace and creative room',url:'/grand-palaces',hint:'This may require an account. Can you understand the banners, activities and rules?',roles:['moderator','writer']},
 {id:'vote',group:'Community & accessibility',name:'Find the Council and read its voting rules',url:'/council/governance',hint:'Do not cast a consequential vote just to test. Check that limits and consent are clear.',roles:['moderator']},
 {id:'contrast',group:'Community & accessibility',name:'Check light mode, dark mode and readable controls',url:'/',hint:'Try keyboard navigation, mobile zoom and both themes if practical.',roles:['reader','writer','artist','moderator']}
];
export const PALACE_BETA_TRACKS={
 reader:{label:'Reader',description:'Find, open and return to stories; check the reading experience.'},
 writer:{label:'Writer',description:'Create a disposable chapter, save it, and test how the writing desk feels.'},
 artist:{label:'Comic or visual creator',description:'Explore comics and the creative experience on your device.'},
 moderator:{label:'Community and accessibility',description:'Check navigation, rules, community rooms and reading comfort.'}
};
export const BETA_SEVERITY=[
 {value:'blocker',label:'Blocking — cannot complete task or work is at risk'},
 {value:'major',label:'Major — works poorly or requires repeated retries'},
 {value:'minor',label:'Minor — confusing, awkward or visually incorrect'},
 {value:'idea',label:'Suggestion — would make the Palace better'}
];
export const BETA_RESULTS=[
 {value:'passed',label:'Worked'},
 {value:'stuck',label:'Had trouble'},
 {value:'skipped',label:'Skipped'}
];
export function betaChecksFor(role,showAll=false){
 return showAll?PALACE_BETA_CHECKS:PALACE_BETA_CHECKS.filter(item=>item.roles.includes(role));
}
export function nextBetaCheck(checks,results={}){
 return checks.find(item=>!['passed','stuck','skipped'].includes(results?.[item.id]))||null;
}
export function betaCounts(checks,results={}){
 return checks.reduce((acc,item)=>{
  const status=results[item.id];
  if(status==='passed'||status==='stuck'||status==='skipped')acc.marked++;
  if(status==='passed'||status==='stuck')acc.attempted++;
  if(status==='passed')acc.passed++;
  if(status==='stuck')acc.stuck++;
  if(status==='skipped')acc.skipped++;
  return acc;
 },{marked:0,attempted:0,passed:0,stuck:0,skipped:0});
}
export function cleanBetaIssue(issue={}){
 const fields=['page','steps','expected','actual','frequency','severity'];
 return Object.fromEntries(fields.map(key=>[key,typeof issue[key]==='string'?issue[key].trim().slice(0,1800):'']));
}
export function betaIssueHasContent(issue){
 const i=cleanBetaIssue(issue);return !!(i.page||i.steps||i.expected||i.actual);
}
export function buildBetaReport(state,checks=betaChecksFor(state.role,state.showAll)){
 const results=state.results||{};
 const counts=betaCounts(checks,results);
 const issues=Array.isArray(state.issues)?state.issues:[];
 const lines=[
  'THE STARRY PALACE — VOLUNTARY BETA FEEDBACK',
  'Track: '+(PALACE_BETA_TRACKS[state.role]?.label||'General'),
  'Device and browser: '+(state.device?.trim()||'Not specified'),
  'Checkpoints attempted: '+counts.attempted+'/'+checks.length+' · Skipped: '+counts.skipped,
  'Worked: '+counts.passed+' · Trouble: '+counts.stuck,
  '',
  'CHECKPOINTS',
  ...checks.map(item=>{
   const label=results[item.id]==='passed'?'WORKED':results[item.id]==='stuck'?'TROUBLE':results[item.id]==='skipped'?'SKIPPED':'NOT TRIED';
   return '['+label+'] '+item.name;
  }),
  '',
  'PROBLEMS REPORTED: '+issues.length
 ];
 issues.forEach((entry,index)=>{
  const item=cleanBetaIssue(entry);
  lines.push('','ISSUE '+(index+1),'Impact: '+(item.severity||'Not specified'),
   'Where: '+(item.page||'Not specified'),
   'Steps: '+(item.steps||'Not specified'),
   'Expected: '+(item.expected||'Not specified'),
   'Actual: '+(item.actual||'Not specified'),
   'Frequency: '+(item.frequency||'Not specified'));
 });
 lines.push('','OTHER NOTES',state.notes?.trim()||'(No additional notes)','',
  'This report was prepared by a volunteer. It was NOT automatically submitted.',
  'Do not attach passwords, private manuscripts, private messages, or other people\'s personal data.');
 return lines.join('\n');
}


/**
 * Invitations must point to the host where the tester is currently standing.
 * A localhost or insecure development address is not a shareable public beta.
 */
export function betaInviteUrl(origin){
 try{
  const address=new URL(String(origin||''));
  if(address.protocol!=='https:'||!address.hostname||address.username||address.password)return '';
  if(address.hostname==='localhost'||address.hostname==='127.0.0.1'||address.hostname==='[::1]')return '';
  return new URL('/beta',address.origin).href;
 }catch{return ''}
}
export function betaInvitationText(origin){
 const url=betaInviteUrl(origin);
 if(!url)return '';
 return 'Would you like to help test The Starry Palace, a creative home for readers, writers and artists? Explore stories, community events and cultural celebrations, then try a few simple tasks at '+url+'. No experience needed, no pressure to publish, and please use disposable text when testing drafts. Your notes stay on your device until you choose to share them.';
}
