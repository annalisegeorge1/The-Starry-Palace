import {useId,useState} from 'react';
import {localDay,monthDays,eventOnDay,heritageOnDay} from './calendarModel';
import './neon-map.css';

const heritageType=item=>String(item?.observance_type||'heritage').toLowerCase().replace(/[^a-z0-9]+/g,'-');

export default function PalaceCalendar({items=[],kind='writing'}){
 const today=localDay(new Date());
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [selected,setSelected]=useState(today);const id=useId();
 const year=month.getFullYear(),index=month.getMonth();
 const days=monthDays(year,index);const label=month.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const matches=day=>items.filter(item=>kind==='heritage'?heritageOnDay(item,day):eventOnDay(item,day));
 const chosen=matches(selected);
 function move(offset){const next=new Date(year,index+offset,1);setMonth(next);setSelected(localDay(next));}
 function reset(){const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1));setSelected(localDay(now));}
 function keyboard(e,position){const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];let next=offset===undefined?null:position+offset;if(e.key==='Home')next=0;if(e.key==='End')next=days.length-1;if(next===null)return;e.preventDefault();e.currentTarget.parentElement.querySelector('[data-day-index="'+Math.max(0,Math.min(days.length-1,next))+'"]')?.focus();}
 return <section className={'palace-month-calendar '+kind} aria-label={kind==='heritage'?'Heritage calendar':'Writing events calendar'}>
  <header><div><p className="eyebrow">{kind==='heritage'?'HERITAGE & COMMUNITY':'WRITING GATHERINGS'}</p><h2 id={id} aria-live="polite">{label}</h2></div><div className="calendar-month-controls"><button type="button" onClick={()=>move(-1)} aria-label="Previous month">‹</button><button type="button" onClick={reset}>Today</button><button type="button" onClick={()=>move(1)} aria-label="Next month">›</button></div></header>
  {kind==='heritage'&&<div className="calendar-heritage-legend" aria-label="Cultural calendar colour key">{[['festival','Festival'],['heritage','Heritage'],['history','History'],['language','Language'],['awareness','Awareness'],['commemoration','Commemoration']].map(([type,label])=><span key={type} className={'legend-'+type}><i aria-hidden="true"/>{label}</span>)}</div>}
  <div className="calendar-weekdays" aria-hidden="true">{Array.from({length:7},(_,i)=><span key={i}>{new Date(2026,5,7+i).toLocaleDateString(undefined,{weekday:'short'})}</span>)}</div>
  <div className="palace-calendar-days" role="group" aria-labelledby={id}>
   {Array.from({length:month.getDay()},(_,i)=><span key={'blank'+i}/>)}
   {days.map((day,i)=>{const dayItems=matches(day);const count=dayItems.length;const types=kind==='heritage'?[...new Set(dayItems.map(heritageType))]:[];const prism=kind==='heritage'&&dayItems.some(item=>/(lgbtq|lgbt|queer|pride|sapphic|achillean|trans|transgender|nonbinary|non-binary|bisexual|lesbian|gay\b|asexual|aromantic|aroace|intersex|genderfluid|genderqueer|pansexual|two-spirit)/i.test([item.community_key,item.title,item.summary,item.context_notes].filter(Boolean).join(' ')));const lunarNewYear=kind==='heritage'&&dayItems.some(item=>String(item.community_key||'').toLowerCase()==='lunar-new-year'||/(chinese new year|spring festival|seollal|tết|tet nguyen dan)/i.test([item.title,item.summary,item.context_notes].filter(Boolean).join(' ')));return <button type="button" key={day} className={[...types.map(type=>'has-'+type),prism?'has-prism':'',lunarNewYear?'has-lunar-new-year':''].filter(Boolean).join(' ')} data-day-index={i} onKeyDown={e=>keyboard(e,i)} onClick={()=>setSelected(day)} aria-pressed={selected===day} aria-current={day===today?'date':undefined} aria-label={new Date(year,index,i+1).toLocaleDateString(undefined,{dateStyle:'full'})+' · '+count+' '+(kind==='heritage'?'observances':'events')}><span>{i+1}</span>{count>0&&<><small>{count}<span className="calendar-count-word"> {count===1?'entry':'entries'}</span></small>{kind==='heritage'&&<em className="calendar-kind-dots" aria-hidden="true">{types.slice(0,4).map(type=><i className={'dot-'+type} key={type}/>)}</em>}</>}</button>})}
  </div>
  <div className="calendar-selection" aria-live="polite"><h3>{new Date(selected+'T12:00:00').toLocaleDateString(undefined,{dateStyle:'long'})}</h3>{chosen.length?<ul>{chosen.map(item=>{const lunar=kind==='heritage'&&(String(item.community_key||'').toLowerCase()==='lunar-new-year'||/(chinese new year|spring festival|seollal|tết|tet nguyen dan)/i.test([item.title,item.summary,item.context_notes].filter(Boolean).join(' ')));return <li key={item.id} className={kind==='heritage'?('heritage-type-'+heritageType(item)+(lunar?' heritage-lunar-new-year':'')):''}><strong>{item.title}</strong><p>{item.summary}</p>{kind==='writing'&&<time dateTime={item.starts_at}>{new Date(item.starts_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} · your local time</time>}{kind==='heritage'&&<small>{[item.country_code,item.community_key,item.observance_type,item.year].filter(Boolean).join(' · ')}</small>}</li>})}</ul>:<p className="quiet-copy">No {kind==='heritage'?'verified observances':'published writing events'} for this date.</p>}</div>
 </section>;
}
