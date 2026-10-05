import './treasury.css';

const tiers=['bronze','silver','gold','platinum','emerald'];
const glyphs=[
 ['teacup','☕'],['key','◇'],['bookmark','▮'],['scroll','≋'],['book','▤'],
 ['banner','⚑'],['ticket','◫'],['chest','▣'],['crown','♛'],['inkwell','✒'],
 ['palace','♜'],['palette','◔'],['lantern','◇'],['star','✦'],['moon','☾'],
 ['lighthouse','♢'],['lotus','❀'],['envelope','✉'],['mask','◐'],['ballot','▧'],
 ['fan','〰'],['mirror','◈'],['bell','◌'],['ring','◉'],['vase','♧'],
 ['comb','⋔'],['bottle','♢'],['map','⌑'],['flower','✿'],['feather','❧']
];

function symbolFor(gift){
 const text=`${gift?.name||''} ${gift?.description||''}`.toLowerCase();
 return glyphs.find(([word])=>text.includes(word))?.[1]||'✦';
}

export default function PalaceGift({gift,tier='bronze',compact=false,locked=false}){
 const rank=tiers.includes(tier)?tier:'bronze';
 const number=Number(gift?.catalogue_number||0);
 const seed=Math.abs(number)%12;
 const name=gift?.name||'Palace collectible';
 const court=gift?.court_name||'The Starry Palace';
 return <figure className={`palace-gift-art tier-${rank} seed-${seed}${compact?' compact':''}${locked?' is-locked':''}`} aria-label={`${name}, ${rank} Palace collectible`}>
  <span className="gift-watercolour wash-a" aria-hidden="true"/>
  <span className="gift-watercolour wash-b" aria-hidden="true"/>
  <span className="gift-moon-line" aria-hidden="true">☾</span>
  <span className="gift-object-glyph" aria-hidden="true">{symbolFor(gift)}</span>
  <span className="gift-catalogue-mark" aria-hidden="true">{number?String(number).padStart(3,'0'):'✦'}</span>
  {!compact&&<figcaption><strong>{court}</strong><span>{rank}</span></figcaption>}
 </figure>;
}
