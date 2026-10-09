import React,{useEffect,useState} from 'react';
import {Link,NavLink} from 'react-router-dom';
import './palace-calm-layout.css';

const PRIMARY_IDS=new Set(['palace','reading','writing','life']);

export function dividePalaceRooms(rooms=[]){
 return {
  primary:rooms.filter(room=>PRIMARY_IDS.has(room.id)),
  additional:rooms.filter(room=>!PRIMARY_IDS.has(room.id))
 };
}
function PalaceNavRoom({room,active,currentHref,profilePath,renderIcon}){
 const sections=room.sections||[];
 const extra=sections.slice(3);
 const resolve=path=>path==='/member'?profilePath:path;
 const matches=path=>currentHref===path||(path==='/chamber'&&currentHref==='/chamber');
 const currentInExtra=extra.some(([,path])=>matches(resolve(path)));
 const[moreSections,setMoreSections]=useState(currentInExtra);
 useEffect(()=>{if(currentInExtra)setMoreSections(true)},[currentInExtra,room.id]);
 function sectionLink([label,path]){
  const destination=resolve(path);
  const isCurrent=matches(destination);
  return <Link key={label+'-'+path} to={destination} aria-current={isCurrent?'page':undefined} className={isCurrent?'active':''}><span>{label}</span></Link>;
 }
 return <div className="full-nav-room palace-calm-room">
   <NavLink to={room.path} className={active?'active':''}><i className={'room-sigil room-sigil-'+room.id}>{renderIcon(room.id)}</i><span>{room.label}</span></NavLink>
   {active&&sections.length>0&&<div className="full-subnav palace-calm-subnav">
    <small>IN THIS ROOM</small>
    {sections.slice(0,3).map(sectionLink)}
    {extra.length>0&&<div className="palace-subnav-extra">
      <button type="button" aria-expanded={moreSections} onClick={()=>setMoreSections(v=>!v)}>
       <span>{moreSections?'Fewer sections':'All sections'}</span>
       <small>{moreSections?'−':'+'+extra.length}</small>
      </button>
      {moreSections&&<div className="palace-subnav-extra-links">{extra.map(sectionLink)}</div>}
     </div>}
   </div>}
  </div>;
}
function PalaceNavGroup({label,description,open,setOpen,children,className='' }){
 return <details className={'palace-nav-fold '+className} open={open}>
  <summary onClick={e=>{e.preventDefault();setOpen(v=>!v)}} aria-label={label}>
   <span className="palace-nav-fold-copy"><strong>{label}</strong><small>{description}</small></span>
   <span className="palace-nav-fold-chevron" aria-hidden="true">{open?'−':'+'}</span>
  </summary>
  {children}
 </details>;
}
export default function PalaceSidebarNavigation({rooms=[],activeRoom,currentHref,currentPath,profilePath='/chamber',renderIcon}){
 const {primary,additional}=dividePalaceRooms(rooms);
 const[moreOpen,setMoreOpen]=useState(()=>additional.some(r=>r.id===activeRoom?.id));
 const[stewardshipOpen,setStewardshipOpen]=useState(()=>currentPath?.startsWith('/council')||currentPath?.startsWith('/code'));
 useEffect(()=>{if(additional.some(r=>r.id===activeRoom?.id))setMoreOpen(true)},[activeRoom?.id]);
 useEffect(()=>{if(currentPath?.startsWith('/council')||currentPath?.startsWith('/code'))setStewardshipOpen(true)},[currentPath]);
 const renderRoom=room=><PalaceNavRoom key={room.id} room={room} active={activeRoom?.id===room.id}
   currentHref={currentHref} profilePath={profilePath} renderIcon={renderIcon}/>;
 return <>
  <p className="nav-section-label palace-calm-label">YOUR MAIN ROOMS</p>
  <nav className="full-room-nav palace-calm-primary" aria-label="Main Palace rooms">{primary.map(renderRoom)}</nav>
  {additional.length>0&&<PalaceNavGroup label="More Palace rooms" description="Library, calendars, Treasury and settings" open={moreOpen} setOpen={setMoreOpen} className="palace-nav-more">
   <nav className="full-room-nav palace-calm-additional" aria-label="Other Palace rooms">{additional.map(renderRoom)}</nav>
  </PalaceNavGroup>}
  <PalaceNavGroup label="Stewardship & safety" description="Council, voting and the Palace Code" open={stewardshipOpen} setOpen={setStewardshipOpen} className="palace-nav-stewardship">
   <nav className="full-room-nav secondary" aria-label="Palace stewardship">
    <div className="full-nav-room"><NavLink to="/council/governance"><i className="room-sigil room-sigil-council">{renderIcon('council')}</i><span>Palace Council</span></NavLink>
     {currentPath?.startsWith('/council')&&<div className="full-subnav"><small>SECTIONS</small>
      <Link to="/council/governance?tab=overview">Council overview</Link><Link to="/council/governance?tab=ballots">Voting Chamber</Link>
      <Link to="/council/governance?tab=petitions">Member petitions</Link><Link to="/council/governance?tab=elections">Council elections</Link>
      <Link to="/council/governance?tab=notices">Palace Tidings</Link><Link to="/council/governance?tab=appeals">My appeals</Link><Link to="/council">Review desk</Link>
     </div>}
    </div>
    <div className="full-nav-room"><NavLink to="/code"><i>§</i><span>The Palace Code</span></NavLink>
     {currentPath?.startsWith('/code')&&<div className="full-subnav"><small>SECTIONS</small>
      <span className="restored-static">Community conduct</span><span className="restored-static">Safety & privacy</span>
      <span className="restored-static">Member rights</span><span className="restored-static">Appeals</span>
     </div>}
    </div>
   </nav>
  </PalaceNavGroup>
 </>;
}
