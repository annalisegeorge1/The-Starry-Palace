import {structureClassicText} from './classicTextStructure';

/** This is a curator-facing progress checklist, NOT a licence decision.
 * Approval and publication must still occur independently.
 */
const RATINGS=new Set(['general','teen','mature','explicit','not_rated']);
const publishedApprovalStates=new Set(['verified']);
function todayIso(){
 return new Date().toISOString().slice(0,10);
}
function activeGrant(grant,today){
 return grant?.status==='verified'&&grant?.permits_hosting===true
  &&(!grant.valid_from||grant.valid_from<=today)
  &&(!grant.valid_until||grant.valid_until>=today);
}
export function fanworkReviewStatus(work={},today=todayIso()){
 const words=Number(work.stagedWords)||0;
 const grants=Array.isArray(work.rightsGrants)?work.rightsGrants:[];
 const verified=grants.some(grant=>activeGrant(grant,today));
 const pending=grants.some(grant=>grant?.status==='review');
 const expired=grants.some(grant=>grant?.status==='expired'
   ||grant?.valid_until&&grant.valid_until<today);
 const rating=String(work.originalRating||'not_rated');
 const issues=[];
 if(words<20)issues.push('Full author-supplied manuscript not staged');
 if(!work.sourceUrl)issues.push('Original edition URL missing');
 if(!work.permissionUrl)issues.push('Source permission statement or contact URL missing');
 if(!RATINGS.has(rating)||rating==='not_rated')issues.push('Age rating needs editorial review');
 if(!String(work.fandom||'').trim())issues.push('Fandom tags need review');
 if(['mature','explicit'].includes(rating))
  issues.push('18+ reader access restrictions must be confirmed before publication');
 if(!verified)issues.push(expired?'Hosting grant expired or withdrawn':'Independent hosting approval not verified');
 const stage=words<20?'awaiting_manuscript':
  !verified?'rights_review':'editorial_review';
 const label=stage==='awaiting_manuscript'?'Awaiting manuscript':
  stage==='rights_review'?(pending?'Permission under review':'Rights review required'):
  'Eligible for final editorial review';
 return {
  stage,label,issues,hasText:words>=20,hasVerifiedGrant:verified,
  hasPendingGrant:pending,hasExpiredGrant:expired,wordCount:words,
  requiresAdultReview:['mature','explicit'].includes(rating)
 };
}
export function fanworkQueueOverview(rows=[]){
 const list=(Array.isArray(rows)?rows:[]).map(row=>fanworkReviewStatus(row));
 return {
  total:list.length,staged:list.filter(item=>item.hasText).length,
  awaitingText:list.filter(item=>!item.hasText).length,
  rightsPending:list.filter(item=>item.hasText&&!item.hasVerifiedGrant).length,
  editorialReview:list.filter(item=>item.stage==='editorial_review').length,
  adultReview:list.filter(item=>item.requiresAdultReview).length
 };
}
export function inspectStagedFanwork(body='',expectedChapters=null){
 const sections=structureClassicText(String(body||''))
  .filter(block=>block.kind==='heading')
  .map(block=>block.text);
 const chapters=sections.filter(title=>/^(?:chapter|ch[.]?)[\s.:–—-]+(?:[ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i.test(title));
 const expected=Number(expectedChapters)>0?Math.min(999,Math.floor(Number(expectedChapters))):null;
 const issues=[];
 if(expected&&expected>1&&chapters.length<expected)
  issues.push('Only '+chapters.length+' chapter headings detected; source lists '+expected+' chapters. Check completeness manually.');
 if(!sections.length&&expected&&expected>1)
  issues.push('No reader-recognized section headings; chapter navigation may be incomplete.');
 return {sections:sections.slice(0,100),detectedChapters:chapters.length,
  expectedChapters:expected,issues,
  note:'Heading detection is advisory; this does not alter the original manuscript.'};
}
export function fanworkAuthorRequest(work={}){
 const title=String(work.title||'your story').trim().slice(0,180);
 const penName=String(work.creator||'').trim().slice(0,100);
 return 'Hello'+(penName?' '+penName:'')+',\n\n'+
  'I’m writing on behalf of The Starry Palace (https://thestarrypalace.com), a reading and writing community. '+
  'We would love to consider featuring your fanfiction “'+title+'” as a complete, readable work on our site, with clear credit to you and a link to your original posting.\n\n'+
  'Would you be comfortable granting permission specifically for The Starry Palace to host your original text? '+
  'If so, could you provide the original manuscript (for example, a plain-text file) or another separately authorized copy, '+
  'along with any conditions you require—such as noncommercial use, attribution, chapter order, ratings and warnings? '+
  'We would preserve your original wording and clearly label it as fanfiction. '+
  'We will also independently review any underlying franchise rights and platform restrictions before publication.\n\n'+
  'There is no obligation, and we would not publish your text without the necessary permissions. Thank you for considering it.';
}
