import { useId } from 'react';
import './treasury.css';

const tiers=['bronze','silver','gold','platinum','emerald'];
const editions=[
 ['nocturne',1,60],['starlit',61,120],['moonwashed',121,180],['celestial',181,240],
 ['cloudglass',241,300],['silverleaf',301,360],['dreaming',361,420],['blue-hour',421,480],['midnight',481,520]
];
const kinds=[
 ['porcelain moon','porcelain-moon'],['paired moons','paired-moons'],['flowering tree','flowering-tree'],
 ['music box','music-box'],['tea caddy','tea-caddy'],['celestial bell','celestial-bell'],['ballot box','ballot-box'],
 ['lighthouse','lighthouse'],['telescope','telescope'],['bookmark','bookmark'],['compass','compass'],
 ['teacup','teacup'],['scroll','scroll'],['book','book'],['banner','banner'],['ticket','ticket'],
 ['chest','chest'],['crown','crown'],['inkwell','inkwell'],['palace','palace'],['palette','palette'],
 ['lantern','lantern'],['star','star'],['lotus','lotus'],['envelope','envelope'],['mask','mask'],
 ['gazebo','gazebo'],['wreath','wreath'],['fan','fan'],['key','key']
];

export function giftEdition(gift){
 const number=Number(gift?.catalogue_number||0);
 return editions.find(([,start,end])=>number>=start&&number<=end)?.[0]||'palace';
}
export function giftKind(gift){
 const text=`${gift?.name||''} ${gift?.description||''}`.toLowerCase();
 return kinds.find(([word])=>text.includes(word))?.[1]||'star';
}
export const giftEditions=editions.map(([slug])=>slug);

function ObjectDrawing({kind}){
 const common={fill:'none',stroke:'currentColor',strokeWidth:3.1,strokeLinecap:'round',strokeLinejoin:'round',vectorEffect:'non-scaling-stroke'};
 switch(kind){
  case'teacup':return <g {...common}><path d="M63 65h78v24c0 28-15 42-39 42S63 117 63 89Z"/><path d="M141 73h9c19 0 19 32 1 35h-14"/><path d="M54 136c28 8 73 9 101 0"/><path d="M86 56c-8-14 7-17-1-31M108 55c-8-13 8-17 0-31M128 55c-7-11 6-16 1-27"/></g>;
  case'key':return <g {...common}><circle cx="73" cy="68" r="24"/><circle cx="73" cy="68" r="9"/><path d="M91 86l63 56m-20-18 13-14m-1 27 12-13"/></g>;
  case'bookmark':return <g {...common}><path d="M78 28h65v112l-33-23-32 23Z"/><path d="M91 47h39M91 59h29"/></g>;
  case'scroll':return <g {...common}><path d="M66 42c0-13 12-17 23-13h65v93H84c-13 2-24-5-24-16s10-17 23-14V42c-7-6-17-4-17 5"/><path d="M84 92h65M101 53h33M101 67h40"/></g>;
  case'book':return <g {...common}><path d="M47 44c30-8 49-1 63 12v82c-17-14-39-18-63-11Z"/><path d="M173 44c-30-8-49-1-63 12v82c17-14 39-18 63-11Z"/><path d="M110 56v82"/></g>;
  case'banner':return <g {...common}><path d="M70 25v119"/><path d="M73 35c41-15 65 14 93-2v62c-30 18-54-13-93 3Z"/><path d="M91 58c18-7 35 6 52 0M91 74c18-7 35 6 52 0"/></g>;
  case'ticket':return <g {...common}><path d="M49 54h122v23c-16 2-16 25 0 27v23H49v-23c16-2 16-25 0-27Z"/><path d="M79 61v58" strokeDasharray="5 7"/><path d="M96 75h52M96 91h38"/></g>;
  case'chest':return <g {...common}><path d="M52 72h116v67H52Z"/><path d="M58 72c3-30 28-48 52-48s49 18 52 48"/><path d="M105 75h18v30h-18Z"/><path d="M51 94h117"/></g>;
  case'crown':return <g {...common}><path d="M47 117 58 57l35 30 18-49 20 49 34-30 9 60Z"/><path d="M51 117h119l-8 23H59Z"/><circle cx="58" cy="54" r="4"/><circle cx="111" cy="35" r="4"/><circle cx="166" cy="54" r="4"/></g>;
  case'inkwell':return <g {...common}><path d="M70 129h83l-8-54H79Z"/><path d="M88 75 96 52h32l9 23"/><path d="M104 52 144 20"/><path d="m139 21 19-6-8 19Z"/><path d="M86 104h50"/></g>;
  case'palace':return <g {...common}><path d="M38 136h144M54 136V80h112v56M72 80V56h76v24M92 56V38h36v18"/><path d="m47 80 63-43 63 43M71 103h24v33m30-33h24v33M104 104h14v32"/><path d="M63 80h94"/></g>;
  case'palette':return <g {...common}><path d="M154 119c-17 25-62 24-85-4-25-31-5-72 27-84 36-14 78 5 83 36 3 18-13 21-27 15-14-7-25 4-17 18 5 10 26 4 19 19Z"/><circle cx="96" cy="55" r="7"/><circle cx="124" cy="49" r="7"/><circle cx="148" cy="65" r="7"/><circle cx="83" cy="81" r="7"/></g>;
  case'lantern':return <g {...common}><path d="M82 49h57l9 80H72Z"/><path d="M91 49c0-18 39-18 39 0"/><path d="M82 72h57M79 108h64M110 49v80"/><path d="M100 29h20"/></g>;
  case'paired-moons':return <g {...common}><path d="M102 31c-29 6-44 39-32 65 13 28 48 38 72 19-29 3-53-19-53-48 0-15 5-27 13-36Z"/><path d="M139 55c-17 4-26 23-19 39 8 17 28 22 43 12-17 1-31-12-31-29 0-9 3-16 7-22Z"/></g>;
  case'porcelain-moon':return <g {...common}><circle cx="110" cy="82" r="54"/><path d="M126 36c-22 9-33 34-24 56 9 24 36 36 59 25-30-2-52-28-49-57 1-10 6-19 14-24Z"/><path d="M72 117c20-7 54-6 76 4"/></g>;
  case'lighthouse':return <g {...common}><path d="M84 138h55l-7-79H91Z"/><path d="M86 59h51l-9-20H96Z"/><path d="M105 39V23h15v16M79 59h64M95 86h34M91 116h45"/><path d="m72 42-33-14m110 14 33-14"/></g>;
  case'lotus':return <g {...common}><path d="M109 126c-30-17-48-39-39-59 17 2 31 11 39 27 7-27 24-43 48-46 8 24-8 53-48 78Z"/><path d="M109 126c-4-34-1-67 1-97 21 15 29 38 19 61"/><path d="M61 132c28 8 69 9 99 0"/></g>;
  case'envelope':return <g {...common}><rect x="45" y="48" width="130" height="84" rx="4"/><path d="m48 54 62 49 62-49M48 128l45-42m79 42-45-42"/></g>;
  case'mask':return <g {...common}><path d="M58 54c30-19 75-19 104 0-3 49-23 80-52 91-29-11-49-42-52-91Z"/><path d="M75 78c11-9 25-9 35 0-10 13-24 14-35 0Zm35 0c11-9 25-9 35 0-10 13-24 14-35 0Z"/><path d="M110 94v22m-14 8c9 8 21 8 29 0"/></g>;
  case'ballot-box':return <g {...common}><path d="M55 75h110v64H55Z"/><path d="M69 75 82 48h56l13 27"/><path d="M91 91h38"/><path d="m102 26 42 18-16 38-42-18Z"/><path d="m101 54 9 9 18-21"/></g>;
  case'gazebo':return <g {...common}><path d="M44 76h132M58 76l52-42 52 42M68 76v60m28-60v60m28-60v60m28-60v60M48 136h124"/><path d="M79 58h62"/></g>;
  case'flowering-tree':return <g {...common}><path d="M111 137c-7-37 0-66 16-93M112 93c-20-8-33-20-43-36m49 11c16-12 28-24 35-38M108 111c18-3 36-10 48-23"/><circle cx="66" cy="53" r="12"/><circle cx="82" cy="47" r="10"/><circle cx="153" cy="28" r="12"/><circle cx="162" cy="43" r="9"/><circle cx="158" cy="85" r="12"/></g>;
  case'wreath':return <g {...common}><path d="M109 31c-40 0-65 28-65 55s22 49 48 50M111 31c40 0 65 28 65 55s-22 49-48 50"/><path d="m67 49-18-8m9 25-20-1m19 20-18 7m27 10-17 12m45-70-12-16m45 16 12-16m15 22 18-9m-9 25 20-1m-19 20 18 7m-27 10 17 12"/><path d="m93 136 17-15 18 15"/></g>;
  case'fan':return <g {...common}><path d="M110 135 49 71c34-22 88-22 122 0Z"/><path d="M110 135 70 61m40 74-10-86m10 86 22-84m-22 84 51-67"/><path d="M101 136h18"/></g>;
  case'compass':return <g {...common}><circle cx="110" cy="82" r="56"/><circle cx="110" cy="82" r="39"/><path d="m110 38 11 34 32 10-32 10-11 34-11-34-32-10 32-10Z"/><circle cx="110" cy="82" r="5"/></g>;
  case'music-box':return <g {...common}><path d="M55 77h110v58H55Z"/><path d="M62 77c4-27 26-44 48-44s44 17 48 44"/><path d="M82 77c4-14 14-23 28-23s24 9 28 23"/><path d="M93 104h34M110 77v58"/></g>;
  case'telescope':return <g {...common}><path d="m54 56 93 31-11 31-93-31Z"/><path d="m145 86 26 9-11 31-26-9M88 104l-17 39m38-31 15 31"/><path d="m46 58-13 36"/></g>;
  case'tea-caddy':return <g {...common}><path d="M72 50h76l8 87H64Z"/><path d="M82 50V34h56v16M77 75h67M86 98c16-9 33-9 48 0-15 12-32 13-48 0Z"/></g>;
  case'celestial-bell':return <g {...common}><path d="M66 114h88c-13-10-17-26-17-47 0-20-11-35-27-35S83 47 83 67c0 21-4 37-17 47Z"/><path d="M57 114h106M102 119c1 15 15 15 16 0M105 32V20h10v12"/></g>;
  default:return <g {...common}><path d="m110 24 13 40 42 1-34 24 13 40-34-24-34 24 13-40-34-24 42-1Z"/></g>;
 }
}

export default function PalaceGift({gift,tier='bronze',compact=false,locked=false}){
 const id=useId().replace(/:/g,'');
 const rank=tiers.includes(tier)?tier:'bronze';
 const number=Number(gift?.catalogue_number||0);
 const seed=Math.abs(number)%12;
 const edition=giftEdition(gift);
 const kind=giftKind(gift);
 const name=gift?.name||'Palace collectible';
 const court=gift?.court_name||'The Starry Palace';
 const filterId=`gift-brush-${id}`;
 return <figure className={`palace-gift-art tier-${rank} edition-${edition} seed-${seed}${compact?' compact':''}${locked?' is-locked':''}`} aria-label={`${name}, ${rank} Palace collectible`}>
  <svg className="gift-painted-object" viewBox="0 0 220 160" aria-hidden="true" focusable="false">
   <defs>
    <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%">
     <feTurbulence type="fractalNoise" baseFrequency=".014 .04" numOctaves="2" seed={Math.max(1,seed*11)} result="noise"/>
     <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
   </defs>
   <g className="gift-landscape-wash">
    <path d="M18 132c28-24 48-24 71-5 18-17 38-27 58-17 22 11 35 8 56-2"/>
    <path d="M20 140c45-7 91-5 180 1"/>
   </g>
   <g className="gift-brush-object" filter={`url(#${filterId})`}><ObjectDrawing kind={kind}/></g>
  </svg>
  <span className="gift-watercolour wash-a" aria-hidden="true"/>
  <span className="gift-watercolour wash-b" aria-hidden="true"/>
  <span className="gift-moon-line" aria-hidden="true">☾</span>
  <span className="gift-edition-mark" aria-hidden="true">{edition.replace('-',' ')}</span>
  <span className="gift-catalogue-mark" aria-hidden="true">{number?String(number).padStart(3,'0'):'✦'}</span>
  {!compact&&<figcaption><strong>{court}</strong><span>{rank}</span></figcaption>}
 </figure>;
}
