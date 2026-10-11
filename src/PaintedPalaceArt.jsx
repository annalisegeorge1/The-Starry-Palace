import React,{useId} from 'react';
import {PAINTED_PALACES,PAINTED_TIERS,CHAMBER_FRAMES} from './paintedCollection';
import './painted-palace-art.css';
const root='/assets/palace-watercolours/';
const protect={onContextMenu:e=>e.preventDefault(),onDragStart:e=>e.preventDefault(),onCopy:e=>e.preventDefault()};
// Keep the approved raster paintings intact. View boxes isolate one artwork;
// alpha cleanup removes near-transparent export haze without losing brush edges.
export function PaintedSprite({sheet,box,sheetSize,size=64,label='',className='',shape='none',decorative=false}){
 const uid=useId().replace(/:/g,''),[x,y,w,h]=box;
 return <svg {...protect} className={'painted-art '+className} width={size} height={size} viewBox={box.join(' ')} preserveAspectRatio="xMidYMid meet" role={decorative?undefined:'img'} aria-label={decorative?undefined:label} aria-hidden={decorative||undefined} focusable="false">
  <defs><filter id={uid+'-alpha'} colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="1.04" intercept="-0.035"/></feComponentTransfer></filter><clipPath id={uid+'-clip'}>{shape==='circle'?<ellipse cx={x+w/2} cy={y+h/2} rx={w/2} ry={h/2}/>:shape==='banner'?<path d={`M${x} ${y}H${x+w*.83}L${x+w} ${y+h/2}L${x+w*.83} ${y+h}H${x}Z`}/>:<rect x={x} y={y} width={w} height={h}/>}</clipPath></defs>
  <g clipPath={`url(#${uid}-clip)`}><image href={root+sheet+'.webp'} width={sheetSize[0]} height={sheetSize[1]} filter={`url(#${uid}-alpha)`}/></g>
 </svg>;
}
export function PaintedSigil({palace,size=64,decorative=false,className=''}){
 const slug=typeof palace==='string'?palace:palace?.slug,index=PAINTED_PALACES.indexOf(slug);if(index<0)return null;
 return <PaintedSprite sheet="sigils" sheetSize={[1983,793]} box={[22+(index%5)*396,18+Math.floor(index/5)*386,355,355]} size={size} shape="circle" className={'palace-emblem '+className} label={(palace?.name||slug.replaceAll('-',' '))+' sigil'} decorative={decorative}/>;
}
export function PalaceBanner({palace,className=''}){
 const slug=typeof palace==='string'?palace:palace?.slug,index=PAINTED_PALACES.indexOf(slug);if(index<0)return null;
 return <PaintedSprite sheet="banners" sheetSize={[1536,1024]} box={[100+(index%2)*702,55+Math.floor(index/2)*186,643,158]} size="100%" shape="banner" className={'painted-palace-banner '+className} label={(palace?.name||slug.replaceAll('-',' '))+' banner'}/>;
}
export function WriterAward({kind,size=26,decorative=true}){
 const boxes={crown:[35,115,540,450],heart:[620,145,465,420],moon:[1170,110,478,485],star:[1650,110,500,480]};if(!boxes[kind])return null;
 return <PaintedSprite sheet="awards" sheetSize={[2172,724]} box={boxes[kind]} size={size} className="writer-award" label={kind+' writer award'} decorative={decorative}/>;
}
export function TierFrame({tier='bronze',style=0}){
 const i=Math.max(0,PAINTED_TIERS.indexOf(tier)),xs=[10,325,620,917,1210],ws=[313,293,295,291,325],ys=[25,338,651];
 return <PaintedSprite sheet="tier-frames" sheetSize={[1536,1024]} box={[xs[i],ys[style%3],ws[i],312]} size="100%" className="painted-tier-frame" decorative/>;
}
export function PaintedBadge({family,tier='bronze'}){
 const i=family.index;
 return <span className="painted-round-badge"><span className="painted-round-picture">{i===14?<PaintedSprite sheet="comic-constellation" sheetSize={[1254,1254]} box={[80,85,1096,1080]} shape="circle" size="100%" label={family.name}/>:<PaintedSprite sheet="badges" sheetSize={[1122,1402]} box={[23+(i%4)*274,20+Math.floor(i/4)*266,252,252]} shape="circle" size="100%" label={family.name}/>}</span><TierFrame tier={tier} style={family.frameStyle}/></span>;
}
export function ChamberFrameArt({slug,size='100%',className=''}){
 const frame=CHAMBER_FRAMES.find(x=>x.slug===slug);if(!frame)return null;
 return <PaintedSprite sheet="chamber-frames" sheetSize={[1254,1254]} box={[frame.index%5*249,Math.floor(frame.index/5)*242,249,249]} size={size} className={'painted-chamber-frame '+className} label={frame.name+' chamber frame'}/>;
}
