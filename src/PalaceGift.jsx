import { useId } from 'react';
import './treasury.css';
import {PaintedGiftArtwork,paintedFamilyForKind} from './MoonlitTea';

const tiers=['bronze','silver','gold','platinum','emerald'];
const editions=[
 ['nocturne',1,60],['starlit',61,120],['moonwashed',121,180],['celestial',181,240],
 ['cloudglass',241,300],['silverleaf',301,360],['dreaming',361,420],['blue-hour',421,480],['midnight',481,520]
];
const courts=[
 {name:'Moon Garden',slug:'moon-garden',sigil:'☾',motto:'Moonlit petals',accent:'#8396b8',glow:'#6f6597'},
 {name:'Celestial Library',slug:'celestial-library',sigil:'▤',motto:'Stars between pages',accent:'#8495bc',glow:'#65769d'},
 {name:'Lantern Court',slug:'lantern-court',sigil:'◇',motto:'Light carried home',accent:'#8b91b9',glow:'#71659d'},
 {name:'Sapphire Observatory',slug:'sapphire-observatory',sigil:'✦',motto:'Maps of the night',accent:'#7191b7',glow:'#526d9d'},
 {name:'Ink Pavilion',slug:'ink-pavilion',sigil:'✒',motto:'Brush, rain and paper',accent:'#788aa9',glow:'#5b647f'},
 {name:'Jade Conservatory',slug:'jade-conservatory',sigil:'❧',motto:'Leaves under glass',accent:'#7fa7a2',glow:'#5e847f'},
 {name:'Silver Archive',slug:'silver-archive',sigil:'⌑',motto:'Seals and old records',accent:'#9ca8b6',glow:'#6f7987'},
 {name:'Starfall Salon',slug:'starfall-salon',sigil:'✧',motto:'A room of falling stars',accent:'#8c83b7',glow:'#6d6298'},
 {name:'Lotus Chamber',slug:'lotus-chamber',sigil:'❀',motto:'Still water, open bloom',accent:'#86a5ad',glow:'#6c8296'},
 {name:'Midnight Gallery',slug:'midnight-gallery',sigil:'◈',motto:'Frames after dusk',accent:'#787fa8',glow:'#565c82'},
 {name:'Dreaming Terrace',slug:'dreaming-terrace',sigil:'〰',motto:'Clouds beyond the rail',accent:'#9588b1',glow:'#746793'},
 {name:'Crescent Atelier',slug:'crescent-atelier',sigil:'◔',motto:'Paint beneath the moon',accent:'#8e89b3',glow:'#6b6694'},
 {name:'Cloud Pavilion',slug:'cloud-pavilion',sigil:'☁',motto:'Mist, silk and sky',accent:'#8ba6b7',glow:'#647f94'},
 {name:"Poet's Alcove",slug:'poets-alcove',sigil:'❦',motto:'A quiet line of verse',accent:'#9690b1',glow:'#736e92'},
 {name:'Aurora Hall',slug:'aurora-hall',sigil:'⌁',motto:'Curtains of northern light',accent:'#7ca1b3',glow:'#607b96'},
 {name:'Tea Moon Court',slug:'tea-moon-court',sigil:'◡',motto:'Steam beneath a crescent',accent:'#8da0ad',glow:'#687986'},
 {name:'Astral Music Room',slug:'astral-music-room',sigil:'♪',motto:'Constellations in tempo',accent:'#8587b5',glow:'#62658f'},
 {name:'Compass Court',slug:'compass-court',sigil:'✥',motto:'Every road returns',accent:'#819aae',glow:'#60798a'},
 {name:"Storyteller's Garden",slug:'storytellers-garden',sigil:'♧',motto:'Branches full of tales',accent:'#839e9c',glow:'#637c7c'},
 {name:'Royal Post',slug:'royal-post',sigil:'✉',motto:'Letters across the Palace',accent:'#8791ac',glow:'#636d89'}
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
export const giftCourts=courts;
export function giftCourt(gift){
 const name=gift?.court_name||'';
 return courts.find(c=>c.name===name)||{name:name||'The Starry Palace',slug:'starry-palace',sigil:'✦',motto:'A Palace collection',accent:'#8993b8',glow:'#666f94'};
}

function CourtMotif({court}){
 const common={fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round',vectorEffect:'non-scaling-stroke'};
 switch(court){
  case'moon-garden':return <g {...common}><path d="M24 43c20 3 33 15 42 33M31 56c12-9 22-11 31-7M45 78c-7 6-11 15-12 26"/><path d="M177 28c-19 6-27 28-17 45 9 15 27 21 42 13-21-2-35-20-32-40 1-7 3-13 7-18Z"/><circle cx="48" cy="48" r="3"/><circle cx="58" cy="64" r="3"/><circle cx="36" cy="75" r="3"/></g>;
  case'celestial-library':return <g {...common}><path d="M21 38h49v74H21Zm8 10h33M29 59h24M29 70h29"/><path d="M154 26h44v68h-44Zm8 12h27M162 50h22M162 62h25"/><path d="m105 26 4 11 12 1-9 7 3 12-10-7-10 7 3-12-9-7 12-1Z"/></g>;
  case'lantern-court':return <g {...common}><path d="M29 22v23m-11 0h22l4 25H14Zm11 25v27m154-72v23m-11 0h22l4 25h-30Zm11 25v27"/><path d="M42 116c34-14 103-15 137 0"/></g>;
  case'sapphire-observatory':return <g {...common}><path d="M16 112c26-66 162-66 188 0"/><path d="M39 95 63 73l28 8 25-35 29 21 31-28"/><circle cx="63" cy="73" r="2.5"/><circle cx="91" cy="81" r="2.5"/><circle cx="116" cy="46" r="2.5"/><circle cx="145" cy="67" r="2.5"/><circle cx="176" cy="39" r="2.5"/></g>;
  case'ink-pavilion':return <g {...common}><path d="M18 48c31-23 60-17 73 5 10 17 1 33-18 40-18 7-37 4-49 18"/><path d="M153 30c-12 30-11 60 12 85M144 52c21-8 37-6 51 4M150 84c17-3 31 0 43 8"/></g>;
  case'jade-conservatory':return <g {...common}><path d="M42 130c11-49 15-77 9-108m13 111c7-44 21-75 40-103m-50 36c-15-6-26-14-34-25m40 7c11-8 20-18 25-30m6 57c-15-3-28-9-39-18m53-2c12-7 22-16 29-27"/><path d="M168 134c0-45 5-78 16-103m-17 44-20-17m25-6 18-18"/></g>;
  case'silver-archive':return <g {...common}><rect x="21" y="36" width="52" height="79" rx="3"/><path d="M31 51h31M31 63h25M31 75h30M31 87h20"/><circle cx="176" cy="68" r="25"/><path d="M176 43v50m-25-25h50"/><path d="M151 116h51"/></g>;
  case'starfall-salon':return <g {...common}><path d="m35 26 4 12 13 1-10 8 3 13-10-7-11 7 4-13-11-8 13-1Zm70 2 3 9 10 1-8 6 3 10-8-6-9 6 3-10-8-6 10-1Zm76 18 4 12 13 1-10 8 3 13-10-7-11 7 4-13-11-8 13-1Z"/><path d="M24 112c42-22 128-22 173 1"/></g>;
  case'lotus-chamber':return <g {...common}><path d="M20 118c45 5 76 6 104 0m-92-17c14-24 31-27 46-3 14-27 34-30 51-4-5 22-23 34-51 35-25-2-40-11-46-28Z"/><path d="M161 86c8-15 19-17 30-2 10-16 22-17 31-2-4 13-13 20-30 21-16-1-27-7-31-17Z"/></g>;
  case'midnight-gallery':return <g {...common}><rect x="19" y="28" width="55" height="77"/><rect x="147" y="38" width="55" height="67"/><path d="M27 36h39v61H27Zm128 10h39v51h-39Z"/><path d="M90 25h40v18H90m-13 82h66"/></g>;
  case'dreaming-terrace':return <g {...common}><path d="M14 102c18-19 38-18 51 0 13-25 43-26 58-4 15-19 39-19 53 1 10-12 22-14 34-7"/><path d="M25 126h170M39 126V98m35 28V98m72 28V98m35 28V98"/></g>;
  case'crescent-atelier':return <g {...common}><path d="M26 31c-15 5-22 21-15 34 6 12 21 17 33 11-16-1-26-14-24-29 1-7 3-12 6-16Z"/><path d="m170 30 20 20-54 54-28 9 9-28Z"/><path d="M34 119c26-13 51-13 72 0"/></g>;
  case'cloud-pavilion':return <g {...common}><path d="M18 63c10-18 35-20 46-3 8-20 40-24 54-5 11-12 32-11 42 4 21-6 40 4 44 20H20"/><path d="M34 109c21-15 43-15 62 0 15-18 43-18 57 0 14-11 31-11 45 0"/></g>;
  case'poets-alcove':return <g {...common}><path d="M29 104c33-31 54-50 82-71-2 26-13 48-35 68-14 13-29 20-47 22 11-8 23-14 35-20"/><path d="M104 39c19-6 39-7 58-2m-54 14c22-5 44-4 66 2m-73 14c29-2 55 3 78 14"/></g>;
  case'aurora-hall':return <g {...common}><path d="M16 47c34-19 52 19 86-1s50-12 68 0 29 5 38-3M14 68c31-14 50 15 82-1 33-17 52-8 72 4 16 10 29 7 40 2M18 89c31-11 48 10 75-1 33-14 50-6 72 5 17 8 30 7 43 2"/></g>;
  case'tea-moon-court':return <g {...common}><path d="M35 95h52v18c0 18-10 28-26 28s-26-10-26-28Z"/><path d="M87 100h8c12 0 12 23 0 25h-10"/><path d="M48 85c-6-10 5-14 0-23m18 23c-6-10 5-14 0-23"/><path d="M171 31c-17 5-24 24-15 39 8 13 24 18 37 11-18-1-30-17-27-34 1-6 2-11 5-16Z"/></g>;
  case'astral-music-room':return <g {...common}><path d="M25 54h146M25 68h146M25 82h146M25 96h146"/><path d="M73 45v55c0 13-20 18-25 7-5-10 7-18 25-16m55-56v54c0 13-21 18-26 7-4-10 8-18 26-16l24-7V27Z"/><circle cx="190" cy="48" r="3"/></g>;
  case'compass-court':return <g {...common}><circle cx="110" cy="81" r="58"/><circle cx="110" cy="81" r="40"/><path d="m110 22 12 47 45 12-45 12-12 47-12-47-45-12 45-12Z"/><path d="M110 13v15m0 105v15M42 81H27m166 0h-15"/></g>;
  case'storytellers-garden':return <g {...common}><path d="M31 133c3-42 12-72 31-99m-8 43c-15-4-26-11-35-21m40 0c14-8 24-17 30-29m69 104c-5-39-14-69-29-91m9 43c13-5 23-13 31-24m-37 2c-11-8-19-18-23-30"/><circle cx="70" cy="30" r="3"/><circle cx="145" cy="30" r="3"/><circle cx="177" cy="57" r="3"/></g>;
  case'royal-post':return <g {...common}><rect x="22" y="49" width="62" height="45" rx="3"/><path d="m25 54 28 23 28-23"/><circle cx="166" cy="83" r="24"/><path d="m154 84 8 8 17-22"/><path d="M105 44h89M105 58h69M105 112h84M105 126h55"/></g>;
  default:return <g {...common}><path d="M22 116c44-19 132-19 176 0"/><circle cx="39" cy="39" r="3"/><circle cx="181" cy="45" r="3"/></g>;
 }
}

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
 const courtMeta=giftCourt(gift);
 const painting=paintedFamilyForKind(kind);
 if(painting)return <figure className={`palace-gift-art painted-tea tier-${rank}${compact?' compact':''}${locked?' is-locked':''}`} aria-label={`${name}, ${rank} Palace collectible from ${courtMeta.name}`}><PaintedGiftArtwork key={painting.id+'-'+rank} family={painting.id} tier={rank} compact={compact}/>{!compact&&<figcaption><strong>{courtMeta.sigil} {court}</strong><span>{painting.name} watercolour · {rank}</span></figcaption>}</figure>;
 const filterId=`gift-brush-${id}`;
 return <figure className={`palace-gift-art tier-${rank} edition-${edition} court-${courtMeta.slug} seed-${seed}${compact?' compact':''}${locked?' is-locked':''}`} style={{'--court-accent':courtMeta.accent,'--court-glow':courtMeta.glow}} aria-label={`${name}, ${rank} Palace collectible from ${courtMeta.name}`}>
  <svg className="gift-painted-object" viewBox="0 0 220 160" aria-hidden="true" focusable="false">
   <defs>
    <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%">
     <feTurbulence type="fractalNoise" baseFrequency=".014 .04" numOctaves="2" seed={Math.max(1,seed*11)} result="noise"/>
     <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
   </defs>
   <g className="gift-court-motif"><CourtMotif court={courtMeta.slug}/></g>
   <g className="gift-landscape-wash">
    <path d="M18 132c28-24 48-24 71-5 18-17 38-27 58-17 22 11 35 8 56-2"/>
    <path d="M20 140c45-7 91-5 180 1"/>
   </g>
   <g className="gift-brush-object" filter={`url(#${filterId})`}><ObjectDrawing kind={kind}/></g>
  </svg>
  <span className="gift-watercolour wash-a" aria-hidden="true"/>
  <span className="gift-watercolour wash-b" aria-hidden="true"/>
  <span className="gift-court-sigil" aria-hidden="true">{courtMeta.sigil}</span>
  <span className="gift-edition-mark" aria-hidden="true">{edition.replace('-',' ')}</span>
  <span className="gift-catalogue-mark" aria-hidden="true">{number?String(number).padStart(3,'0'):'✦'}</span>
  {!compact&&<figcaption><strong>{courtMeta.sigil} {court}</strong><span>{courtMeta.motto} · {rank}</span></figcaption>}
 </figure>;
}

