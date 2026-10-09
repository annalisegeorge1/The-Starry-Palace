import React from 'react';
import {Link,NavLink} from 'react-router-dom';
import './palace-calm-layout.css';

// Familiar Palace navigation: every room is immediately visible. Its own
// sections appear while visiting it, rather than crowding every other room.
const PRIMARY_IDS=new Set(['palace','reading','writing','life']);
export function dividePalaceRooms(rooms=[]){
 return {
  primary:rooms.filter(room=>PRIMARY_IDS.has(room.id)),
  additional:rooms.filter(room=>!PRIMARY_IDS.has(room.id))
 };
}
function PalaceNavRoom({room,active,currentHref,profilePath,renderIcon}){
 const resolve=path=>path==='/member'?profilePath:path;
 return <div className="full-nav-room palace-calm-room">
  <NavLink to={room.path} className={active?'active':''}>
   <i className={'room-sigil room-sigil-'+room.id}>{renderIcon(room.id)}</i>
   <span>{room.label}</span>
  </NavLink>
  {active&&(room.sections||[]).length>0&&<div className="full-subnav palace-calm-subnav">
   <small>IN THIS ROOM</small>
   {room.sections.map(([label,path])=>{
    const url=resolve(path),selected=currentHref===url;
    return <Link key={label+'-'+path} to={url} className={selected?'active':''}
     aria-current={selected?'page':undefined}><span>{label}</span></Link>;
   })}
  </div>}
 </div>;
}
export default function PalaceSidebarNavigation({rooms=[],activeRoom,currentHref,currentPath,profilePath='/chamber',renderIcon}){
 const {primary,additional}=dividePalaceRooms(rooms);
 const renderRoom=room=><PalaceNavRoom key={room.id} room={room}
  active={activeRoom?.id===room.id} currentHref={currentHref}
  profilePath={profilePath} renderIcon={renderIcon}/>;
 const councilRoutes=[
  ['Council overview','/council/governance?tab=overview'],
  ['Voting Chamber','/council/governance?tab=ballots'],
  ['Member petitions','/council/governance?tab=petitions'],
  ['Council elections','/council/governance?tab=elections'],
  ['Palace Tidings','/council/governance?tab=notices'],
  ['My appeals','/council/governance?tab=appeals'],
  ['Review desk','/council']
 ];
 const inCouncil=Boolean(currentPath?.startsWith('/council'));
 const inCode=Boolean(currentPath?.startsWith('/code'));
 return <>
  <p className="nav-section-label palace-calm-label">EXPLORE THE PALACE</p>
  <nav className="full-room-nav palace-calm-primary" aria-label="Main Palace rooms">
   {primary.map(renderRoom)}
  </nav>
  {additional.length>0&&<>
   <p className="nav-section-label palace-calm-label palace-all-rooms-label">MORE PALACE ROOMS</p>
   <nav className="full-room-nav palace-calm-additional" aria-label="Other Palace rooms">
    {additional.map(renderRoom)}
   </nav>
  </>}
  <p className="nav-section-label palace-calm-label palace-all-rooms-label">STEWARDSHIP & SAFETY</p>
  <nav className="full-room-nav secondary" aria-label="Palace stewardship">
   <div className="full-nav-room">
    <NavLink to="/council/governance">
     <i className="room-sigil room-sigil-council">{renderIcon('council')}</i><span>Palace Council</span>
    </NavLink>
    {inCouncil&&<div className="full-subnav">
     <small>COUNCIL SECTIONS</small>
     {councilRoutes.map(([label,path])=><Link key={path} to={path} className={currentHref===path?'active':''}
      aria-current={currentHref===path?'page':undefined}>{label}</Link>)}
    </div>}
   </div>
   <div className="full-nav-room">
    <NavLink to="/code"><i className="room-sigil room-sigil-council">§</i><span>The Palace Code</span></NavLink>
    {inCode&&<div className="full-subnav">
     <small>SECTIONS</small>
     <span className="restored-static">Community conduct</span><span className="restored-static">Safety & privacy</span>
     <span className="restored-static">Member rights</span><span className="restored-static">Appeals</span>
    </div>}
   </div>
  </nav>
 </>;
}
