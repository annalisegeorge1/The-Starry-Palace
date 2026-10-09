// Pure arena rules: keep discovery and prize previews separate from the authoritative RPC.
export const DUEL_PRIZE_REQUIREMENTS={
 one_v_one:{bronze:{entries:2,ballots:3,outside:3},silver:{entries:2,ballots:7,outside:7},gold:{entries:2,ballots:15,outside:15}},
 group:{bronze:{entries:3,ballots:4,outside:2},silver:{entries:5,ballots:8,outside:4},gold:{entries:7,ballots:12,outside:6}},
 open:{bronze:{entries:3,ballots:4,outside:2},silver:{entries:6,ballots:8,outside:4},gold:{entries:10,ballots:15,outside:8}}
};
const TWISTS={
 fiction:['A treasured object must change hands twice.','Begin at the ending; finish with a new beginning.','Make the setting reveal the secret before the narrator does.','The final sentence must change how the first is understood.'],
 poetry:['Write an image of longing without using the word love.','Let the final line reverse the poem’s meaning.','Use a recurring natural image that changes each time.','Give the poem a silent speaker and one unanswered question.'],
 haiku:['Suggest a season without naming it.','Capture a single moment of unexpected kindness.','Let light and shadow disagree.','Include a sound, a natural image, and a surprising turn.'],
 drabble:['Include a locked door and a promise; exactly 100 words.','Start with a discovery; exactly 100 words.','End on a question; exactly 100 words.','Tell the entire scene through one small object; exactly 100 words.'],
 dialogue:['Reveal a secret without either speaker naming it.','Two voices, one misunderstanding, no narrator.','Let a repeated phrase gain a different meaning.','Make the final exchange reverse who holds power.'],
 art:['A single cool-colour palette; let contrast carry the emotion.','A mysterious object must be the focal point.','Use atmosphere and negative space to tell the story.','Interpret the prompt through reflection or silhouette.'],
 comic:['Tell the turn of the story without dialogue bubbles.','Use one repeated visual motif across the panel.','Make the last panel change the first.','Let framing and composition tell the secret.'],
 wildcard:['No proper names; create a vivid sense of place.','Include a hidden message that rewards a second reading.','One repeating object must connect the beginning and end.','Make an ordinary item feel otherworldly.']
};
export function drawDuelTwist(type,index=0){
 const options=TWISTS[type]||TWISTS.wildcard;
 return options[((Math.trunc(index)%options.length)+options.length)%options.length];
}
export function filterInkDuels(duels=[],{view='active',search='',format='all',scope='all'}={}){
 const q=String(search||'').trim().toLocaleLowerCase();
 return duels.filter(duel=>{
  const phase=duel.phase||'';
  const matchesView=view==='all'||view==='active'&&phase!=='results'||view===phase||(view==='results'&&phase==='results');
  const matchesFormat=format==='all'||duel.content_type===format;
  const isMine=Boolean(duel.is_host||duel.my_entry||['accepted','pending'].includes(duel.my_participation));
  const canJudge=phase==='voting'&&!duel.my_vote&&(!duel.my_entry||Number(duel.entry_count||0)>1)&&!(duel.match_type==='one_v_one'&&duel.my_participation==='accepted');
  const matchesScope=scope==='all'||scope==='mine'&&isMine||scope==='judge'&&canJudge;
  const haystack=[duel.title,duel.prompt,duel.rule_note,duel.prompt_family,duel.content_type].filter(Boolean).join(' ').toLocaleLowerCase();
  return matchesView&&matchesFormat&&matchesScope&&(!q||haystack.includes(q));
 });
}
export function duelPrizeProgress(duel={}){
 const match=DUEL_PRIZE_REQUIREMENTS[duel.match_type]||DUEL_PRIZE_REQUIREMENTS.open;
 const current={entries:Number(duel.entry_count||0),ballots:Number(duel.vote_count||0),outside:Number(duel.external_vote_count||0)};
 const tiers=['gold','silver','bronze'];
 const earned=tiers.find(t=>Object.keys(match[t]).every(k=>current[k]>=match[t][k]))||null;
 const gaps=criteria=>Object.entries(criteria).filter(([key,need])=>current[key]<need)
  .map(([key,need])=>({key,need,have:current[key],remaining:need-current[key]}));
 const missing=gaps(match.bronze);
 // Participation status only, not a prediction or a grant of an actual gift.
 // The server still decides winners, ties, ballot eligibility and final rewards.
 const readiness=Object.fromEntries(['bronze','silver','gold'].map(tier=>
  [tier,{ready:gaps(match[tier]).length===0,missing:gaps(match[tier]),criteria:match[tier]}]));
 return{earned,missing,bronze:match.bronze,tiers:match,readiness};
}

// Shared theme/word challenges: drawn before the duel opens and stored in its
// existing published prompt so every participant receives the same constraint.
// Hosts can still type their own prompt; these suggestions are never a paid draw.
export const DUEL_RANDOM_WORDS=[
 'harbour','mercy','ember','reckoning','tide','courage','ribbon','silence','orchid','disguise',
 'inheritance','threshold','starlight','homecoming','mischief','echo','lighthouse','promise',
 'memory','rainfall','labyrinth','solstice','betrayal','wonder','exile','lantern',
 'afterglow','rivalry','belonging','tempest','gravity','wildflower','map','lastlight',
 'forgiveness','reunion','mask','legacy','reflection','crossroads','rebellion','tea',
 'feather','horizon','secret','mirror','anchor','midnight','revelation','garden',
 'arrival','comet','bloom','shadow','cinnamon','festival','oath','departure','hush','moonrise'
];
export const DUEL_RANDOM_TOPICS=[
 'The price of keeping a promise','A celebration interrupted by a secret','A stranger who remembers you',
 'A town with one impossible law','A goodbye mistaken for an invitation','Two enemies trapped on the same journey',
 'An inheritance nobody wants','A family dinner at the end of the world','A lost message that arrives at last',
 'The last train through a sleeping city','A royal decree nobody understands','What the ocean refuses to return',
 'A quiet act of rebellion','The day the stars went silent','A home that remembers its residents',
 'An apology without an explanation','The first hour after a great victory','A borrowed identity',
 'The most important thing not said','A forgotten birthday','A community that must choose its future',
 'An ordinary person asked to judge a miracle','The consequences of one small kindness',
 'The letter under the floorboards','A map to the wrong destination','An ancient rivalry ending at dawn',
 'A spell that only works in the rain','A choice between truth and belonging','The secret life of a lighthouse',
 'A musician who has lost one sound','The witness who will not speak','A haunting at a seaside hotel',
 'The first step through a forbidden door','A festival of impossible guests','A new ruler who wants to resign',
 'The last surviving photograph','A time traveller at a wedding','A childhood friendship under strain',
 'A poem found inside a library book','The cost of a second chance'
];
export const DUEL_TYPES_WITH_SUGGESTED_BASIS=new Set(['poetry','haiku','drabble','dialogue','wildcard']);
export function drawDuelBasis(kind='word',index=0){
 const values=kind==='topic'?DUEL_RANDOM_TOPICS:DUEL_RANDOM_WORDS;
 const position=((Math.trunc(Number(index)||0)%values.length)+values.length)%values.length;
 return {kind:kind==='topic'?'topic':'word',value:values[position]};
}
export function duelBasisPrompt(basis,contentType='fiction'){
 if(!basis?.value)return '';
 const lead=basis.kind==='topic'?'Random topic':'Random word';
 const guidance=['art','comic'].includes(contentType)
  ?'Interpret this through your original artwork; it must be recognisable in your piece.'
  :'Make this the central idea of your entry. Every duelist receives the same basis.';
 return lead+': '+basis.value+'. '+guidance;
}
export function suggestedDuelBasis(contentType,index=0){
 if(!DUEL_TYPES_WITH_SUGGESTED_BASIS.has(contentType))return null;
 return drawDuelBasis(contentType==='haiku'||contentType==='drabble'?'word':'topic',index);
}
