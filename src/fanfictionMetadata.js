/**
 * Curated discovery metadata, separate from the works themselves.
 * Source ratings are translated into the Palace's age classes:
 * FFN K/K+ -> general, FFN T / AO3 Teen -> teen, FFN M -> mature.
 * Absence of a documented rating stays "not_rated", never inferred.
 * Tags and warnings are descriptive editorial metadata, not author claims.
 */
const entry=(rating,sourceRating,tags,warnings=[],basis='source')=>Object.freeze({
 rating,sourceRating,ratingBasis:basis,contentWarnings:warnings,
 tags:Object.entries(tags).flatMap(([category,names])=>names.map(name=>({category,name})))
});
export const MODERN_FANFICTION_GUIDES=Object.freeze({
 'dawn-yule-lights':entry('not_rated',null,{fandom:['The Silmarillion'],genre:['Fantasy','Drama'],trope:['Winter Holidays','Family Memories'],character:['Celebrimbor','Annatar']}),
 'dawn-home-alone':entry('not_rated',null,{fandom:['The Silmarillion','Home Alone'],genre:['Fantasy','Humour'],trope:['Crossover','Family','Winter Holidays'],character:['Amrod','Amras']}),
 'dawn-ordinary-woman':entry('not_rated',null,{fandom:['The Silmarillion'],genre:['Fantasy','Drama'],trope:['Canon Divergence','Family'],character:['Lúthien','Finrod']}),
 'blackwidower-twilights-endgame':entry('teen','Fimfiction Teen',{fandom:['My Little Pony','Marvel Avengers'],genre:['Sci-Fi','Adventure'],trope:['Crossover','Post-Apocalypse'],character:['Twilight Sparkle'],warning:['Violence','Death']},['Violence','Death','Grief']),
 'morganaw-cunning-and-compromise':entry('general','FanFiction.net K+',{fandom:['Pride and Prejudice'],genre:['Romance','Historical'],trope:['Alternate Universe','Canon Divergence','Intrigue'],character:['Elizabeth Bennet','Fitzwilliam Darcy','George Wickham']}),
 'morganaw-more-justified-in-acting':entry('teen','AO3 Teen',{fandom:['Persuasion'],genre:['Romance','Drama'],trope:['Canon Divergence','Second Chances'],character:['Anne Elliot','Captain Wentworth']}),
 'squibstress-sweep':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Drama'],trope:['Post-War','Character Study'],character:['Argus Filch'],warning:['War Aftermath','Blood','Death']},['War aftermath','Blood','Death references']),
 'squibstress-perils-of-eavesdropping':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Humour'],trope:['One-Shot','Pranks'],character:['Fred Weasley','George Weasley']}),
 'squibstress-not-so-rough-wooing':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Romance','Humour'],trope:['One-Shot','Valentine’s Day'],character:['Albus Dumbledore','Minerva McGonagall']}),
 'simplynia-irresistible':entry('teen','FanFiction.net T',{fandom:['The Vampire Diaries'],genre:['Romance','Angst'],trope:['Human AU','Power Dynamics'],character:['Bonnie Bennett','Elijah Mikaelson'],relationship:['Bonnie/Elijah'],warning:['Dom/Sub Undertones']},['Dom/sub undertones','Angst']),
 'blackwidower-my-little-destiny':entry('teen','FanFiction.net T',{fandom:['My Little Pony','Stargate Universe'],genre:['Adventure','Sci-Fi'],trope:['Crossover','Space Travel']}),
 'blackwidower-a-waking-dragon':entry('teen','FanFiction.net T',{fandom:['My Little Pony','Awake'],genre:['Romance','Fantasy'],trope:['Crossover','Alternate Realities'],character:['Spike'],warning:['Grief','Loss']},['Grief','Loss']),
 'alixe-les-survivants':entry('not_rated',null,{fandom:['Harry Potter'],genre:['Fantasy','Drama'],trope:['Post-War','Future Fic'],language:['French']}),
 'starholder-song-of-lost-heart':entry('general','FanFiction.net K',{fandom:['Yu-Gi-Oh!'],genre:['Poetry'],trope:['Fan Poem','Hope'],character:['Atem','Yugi']}),
 'morganaw-depravity-comparison':entry('teen','FanFiction.net T',{fandom:['Pride and Prejudice','Sense and Sensibility'],genre:['Drama','Romance'],trope:['Crossover','Social Justice'],character:['Elizabeth Darcy','Margaret Dashwood']}),
 'morganaw-paws-and-prejudice':entry('general','FanFiction.net K+',{fandom:['Pride and Prejudice'],genre:['Romance','Humour'],trope:['Modern AU','Pets','Meet-Cute'],character:['Elizabeth Bennet','Fitzwilliam Darcy']}),
 'cateliot-inner-demons':entry('teen','FanFiction.net T',{fandom:['Percy Jackson and the Olympians'],genre:['Angst','Hurt/Comfort'],trope:['One-Shot','Pre-Canon','Found Family'],character:['Annabeth Chase','Thalia Grace','Luke Castellan'],warning:['Past Trauma','Scars']},['Trauma and scarring']),
 'what-contented-men-desire-last-adventure':entry('teen','FanFiction.net T',{fandom:['Harry Potter'],genre:['Adventure','Romance'],trope:['Post-War','Alternate Ending'],character:['Harry Potter','Hermione Granger','Ron Weasley'],warning:['War Aftermath','Violence']},['War aftermath','Violence']),
 'mjware-american-muggle':entry('general','FanFiction.net K',{fandom:['Harry Potter'],genre:['Adventure','Romance'],trope:['Original Character','Magic School','Slytherin']}),
 'greame-nevernever-story':entry('teen','FanFiction.net T',{fandom:['The Dresden Files'],genre:['Adventure','Supernatural'],trope:['Original Character','Quest'],warning:['Violence']},['Violence']),
 'jrush-v-for-vengeance':entry('teen','FanFiction.net T',{fandom:['The Dresden Files'],genre:['Horror','Supernatural'],trope:['Vampires','Danger'],character:['Harry Dresden'],warning:['Violence','Horror']},['Supernatural violence','Horror']),
 'ken1245632-naruto-dragon-chronicles':entry('mature','FanFiction.net M',{fandom:['Naruto','Dark Souls'],genre:['Adventure','Sci-Fi'],trope:['Crossover','Alternate Universe'],character:['Naruto Uzumaki','Priscilla'],warning:['Dark Themes','Violence']},['Violence','Dark fantasy'])
});
export const HISTORICAL_FANFICTION_GUIDES=Object.freeze({
 'the-adventure-of-the-two-collaborators-j-m-barrie':entry('general','Palace editorial guide',{fandom:['Sherlock Holmes'],genre:['Parody','Humour'],trope:['Literary Satire','One-Shot'],character:['Sherlock Holmes','John Watson']},[],'editorial'),
 'old-friends-and-new-fancies-sybil-g-brinton':entry('not_rated',null,{fandom:['Jane Austen','Pride and Prejudice','Emma','Mansfield Park'],genre:['Romance','Historical'],trope:['Sequel','Shared Universe','Ensemble Cast'],character:['Elizabeth Darcy','Georgiana Darcy']},[],'unrated')
});
export const FANFICTION_RATINGS=Object.freeze([
 {id:'all',label:'All ratings'},
 {id:'general',label:'General'},
 {id:'teen',label:'Teen (13+)'},
 {id:'mature',label:'Mature (18+)'},
 {id:'explicit',label:'Explicit (18+)'},
 {id:'not_rated',label:'Not rated'}
]);
const fallback=entry('not_rated',null,{},[],'unrated');
export function modernFanfictionGuide(work){return MODERN_FANFICTION_GUIDES[work?.id]||fallback}
export function historicFanfictionGuide(work){return HISTORICAL_FANFICTION_GUIDES[work?.slug]||fallback}
export function fanfictionRatingLabel(guide){
 const title={general:'General',teen:'Teen',mature:'Mature',explicit:'Explicit',not_rated:'Not rated'}[guide?.rating]||'Not rated';
 return guide?.ratingBasis==='editorial'?title+' · Palace guide':title;
}
export function archiveFanfictionTags(work){
 const info=historicFanfictionGuide(work);
 return info.tags.map((tag,index)=>({tags:{
  id:'archive-ff-'+String(work.slug||'unknown')+'-'+index,
  name:tag.name,category:tag.category,status:'canonical'
 }}));
}
export function fanfictionSearchText(work){
 const info=modernFanfictionGuide(work);
 return [work?.title,work?.creator,work?.fandom,work?.description,
  ...info.tags.map(t=>t.name),...info.contentWarnings].filter(Boolean).join(' ').toLowerCase();
}
export function filterModernFanfiction(works=[],{rating='all',query=''}={}){
 const needle=String(query||'').trim().toLowerCase();
 return works.filter(work=>(rating==='all'||modernFanfictionGuide(work).rating===rating)
   &&(!needle||fanfictionSearchText(work).includes(needle)));
}
