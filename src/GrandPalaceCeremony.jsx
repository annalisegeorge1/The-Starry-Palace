import PalaceEmblem from './PalaceEmblem';
import React,{useEffect,useState} from 'react';
import{Link}from'react-router-dom';
import{getGrandPalaceCeremonyHall}from'./ceremonyApi';
import{loreForPalace}from'./grandPalaceLore';
import{CEREMONY_STAGES,ceremonyStage,nextCeremonyStage,ceremonyProgress,ceremonyOrnaments,ceremonyQuarterLabel}from'./grandPalaceCeremony';
import './grand-palace-ceremony.css';

function LegacyStandard({court,large=false}){
 const lore=loreForPalace(court),stage=ceremonyStage(court.average_points),
 stageIndex=CEREMONY_STAGES.findIndex(item=>item.name===stage.name);
 return <div className={'legacy-standard '+(large?'large ':'')+'level-'+stageIndex} style={{'--legacy-accent':lore.colour,'--legacy-deep':lore.secondary}} aria-label={court.name+' · '+stage.name+' · '+court.victories+' victories'}>
   <div className="legacy-standard-inner">
     <span className="legacy-standard-stars" aria-hidden="true">{stageIndex>=1?'✦  ·  ✧':'·  ✧  ·'}</span>
     <span className="legacy-standard-symbol"><PalaceEmblem palace={court} size={large?132:67} decorative/></span>
     <span className="legacy-standard-crest-label">{stageIndex>=3?'♛ ':''}{stage.name}</span>
     <div className="legacy-standard-victories" aria-label={court.victories+' past quarterly victories'}>
       {ceremonyOrnaments(court.victories).map(star=><span aria-hidden="true" key={star.id}>{star.glyph}</span>)}
       {Number(court.victories)>7&&<strong>+{Number(court.victories)-7}</strong>}
       {!Number(court.victories)&&<span className="legacy-star-awaiting">First victory awaits</span>}
     </div>
   </div>
 </div>;
}

export default function GrandPalaceCeremony({myPalaceId=null}){
 const[data,setData]=useState(null),[error,setError]=useState(''),[selected,setSelected]=useState(null);
 useEffect(()=>{let active=true;getGrandPalaceCeremonyHall().then(d=>{if(active){setData(d);setError('')}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[]);
 const courts=data?.courts||[];
 const court=courts.find(p=>Number(p.id)===Number(selected||myPalaceId||data?.my_palace_id))||courts[0];
 const level=court?ceremonyStage(court.average_points):CEREMONY_STAGES[0];
 const next=court?nextCeremonyStage(court.average_points):null;
 const laurels=data?.new_laurels||[];
 const chronicle=data?.chronicle||[];
 return <section id="grand-legacy" className="grand-ceremony" aria-labelledby="grand-ceremony-title">
   <header className="grand-ceremony-head"><div><p className="eyebrow">THE ROYAL ARCHIVES · A LIVING LEGACY</p><h2 id="grand-ceremony-title">The Hall of Celestial Standards</h2>
   <p>Each Palace earns its regalia through verified creation. Every quarterly victory leaves a permanent star around its crest—even when a new season begins.</p></div>
   <span className="grand-ceremony-seal" aria-hidden="true">✧ ♛ ☾</span></header>
   {error&&<p role="alert" className="grand-notice error">{error}</p>}
   {!data&&!error&&<p className="grand-ceremony-loading" role="status">Opening the royal archives…</p>}
   {data&&<><div className="grand-ceremony-gallery" role="group" aria-label="Choose a Grand Palace's historic banner">
     {courts.map(p=><button type="button" key={p.id} className={'grand-standard-choice '+(court?.id===p.id?'selected':'')}
      aria-pressed={court?.id===p.id} onClick={()=>setSelected(p.id)}>
      <LegacyStandard court={p}/>
      <strong>{p.name}</strong><small>{p.victories===1?'1 historic victory':p.victories+' historic victories'}</small>
      </button>)}
   </div>
   {court&&<section className="grand-ceremony-feature" aria-label={'Living banner of '+court.name}>
      <LegacyStandard court={court} large/>
      <div className="grand-ceremony-feature-copy">
       <p className="eyebrow">THE LIVING STANDARD · {loreForPalace(court).emblem}</p>
       <h3>{court.name}</h3><p className="grand-ceremony-epithet">{loreForPalace(court).epithet}</p>
       <strong className="grand-ceremony-earned">{level.glyph} {level.name}</strong>
       <p>{level.description}</p>
       <div className="grand-ceremony-metrics">
         <span><strong>{Number(court.average_points).toLocaleString()}</strong><small>Verified points per member</small></span>
         <span><strong>{court.ritual_count}</strong><small>Creative rituals this quarter</small></span>
         <span><strong>{court.victories}</strong><small>Permanent victory stars</small></span>
       </div>
       <div className="grand-banner-progress" role="group" aria-label="Current ceremony stage progress">
         <div><small>{next?'NEXT: '+next.name.toUpperCase():'HIGHEST STANDARD UNLOCKED'}</small><b>{next?Math.max(0,Number(next.min)-Number(court.average_points)).toLocaleString()+' more per member':'Complete'}</b></div>
         <div className="grand-banner-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ceremonyProgress(court.average_points)}><span style={{width:ceremonyProgress(court.average_points)+'%'}}/></div>
       </div>
      </div>
    </section>}
   <div className="grand-ceremony-path">{CEREMONY_STAGES.map((stage,i)=><article key={stage.name} className={'grand-ceremony-tier '+(level.min>=stage.min?'achieved':'')}>
     <span aria-hidden="true">{stage.glyph}</span><strong>{stage.name}</strong><small>{stage.min.toLocaleString()} points per member</small>
   </article>)}</div>
   <section className="grand-legacy-chronicle"><div className="section-heading"><div><p className="eyebrow">THE BOOK OF SEASONS</p><h2>Hall of Champions</h2><p>Archived titles, winning courts and awarded top-ten placements. Recorded victories never reset.</p></div></div>
      {chronicle.length?<div className="grand-legacy-seasons">{chronicle.map(record=><article key={record.quarter_start}>
       <header><span aria-hidden="true">{record.winner_sigil}</span><div><small>{ceremonyQuarterLabel(record.quarter_start)} · THE VICTORIOUS COURT</small><h3>{record.winner_name}</h3><p>{Number(record.verified_points).toLocaleString()} verified season points</p></div></header>
       {(record.champions||[]).length>0&&<div className="grand-legacy-champions">{record.champions.map(champ=><Link to={'/member/'+encodeURIComponent(champ.username)} key={champ.username}>
         {champ.avatar_url?<img src={champ.avatar_url} alt="" loading="lazy"/>:<span aria-hidden="true">♛</span>}
         <strong>{champ.display_name||champ.username}</strong><small>Rank {champ.rank} · {champ.box_tier} box</small>
       </Link>)}</div>}
       </article>)}</div>:<div className="grand-legacy-empty"><span aria-hidden="true">☾</span><h3>The first star has not yet been set.</h3><p>The inaugural quarterly race is still underway. At settlement, its real winning court and qualifying champions will take their places in the archive.</p></div>}
   </section>
   {laurels.length>0&&<section className="grand-legacy-laurels"><div className="section-heading"><div><p className="eyebrow">THE CONSTELLATION OF ACHIEVEMENT</p><h2>New Laurels</h2><p>Verified Platinum and Emerald achievements this season.</p></div></div>
    <div>{laurels.map((x,i)=><Link to={'/member/'+encodeURIComponent(x.username)} key={x.username+'-'+x.achievement_name+'-'+i}><span aria-hidden="true">✦</span><strong>{x.display_name||x.username}</strong><small>{x.achievement_name} · {x.tier}</small></Link>)}</div>
   </section>}
   </>}
 </section>;
}
