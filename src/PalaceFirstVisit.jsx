import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import './palace-first-visit.css';

const WELCOME_STEPS=[
 {id:'read',symbol:'◈',name:'Find a story',detail:'Explore published stories and save one for later.',url:'/reading'},
 {id:'write',symbol:'✎',name:'Open your writing pad',detail:'Create a private draft. You decide when it becomes public.',url:'/writing'},
 {id:'palace',symbol:'♛',name:'Meet your Grand Palace',detail:'Discover your court, its banner and shared activities.',url:'/grand-palaces'},
 {id:'gather',symbol:'☾',name:'Explore Palace Life',detail:'Find conversations, writers and creative rooms.',url:'/palace-life'}
];
function loadGuide(key){
 try{const parsed=JSON.parse(localStorage.getItem(key)||'{}');return{
  visited:Array.isArray(parsed.visited)?parsed.visited.filter(x=>WELCOME_STEPS.some(s=>s.id===x)):[],
  hidden:parsed.hidden===true
 }}catch{return{visited:[],hidden:false}}
}
export function PalaceStartingPath({memberId}){
 const key='palace-first-visit:v1:'+memberId;
 const[state,setState]=useState(()=>loadGuide(key));
 useEffect(()=>setState(loadGuide(key)),[key]);
 function change(next){
  setState(next);
  try{localStorage.setItem(key,JSON.stringify(next))}catch{}
 }
 if(!memberId||state.hidden)return null;
 const count=state.visited.length;
 return <details className="palace-tour-fold"><summary><span>New here? Take a four-room tour <small>Optional · {"count"} of 4 doorways explored</small></span><span aria-hidden="true">⌄</span></summary><section className="palace-starting-path" aria-label="Optional Palace welcome tour">
  <div className="palace-starting-copy"><p className="eyebrow">A GENTLE FIRST JOURNEY</p>
   <h2>Make yourself at home.</h2>
   <p>No need to learn the entire Palace in a day. Try a room at a time and return whenever you like.</p>
   <div className="palace-starting-meter"><div className="palace-starting-track" role="progressbar" aria-label="Welcome rooms visited" aria-valuenow={count} aria-valuemin={0} aria-valuemax={4}><span style={{width:(count/4*100)+'%'}}/></div><small>{count} of 4 doorways explored</small></div>
  </div>
  <div className="palace-starting-doors">
   {WELCOME_STEPS.map(step=><Link key={step.id} to={step.url}
    onClick={()=>change({...state,visited:state.visited.includes(step.id)?state.visited:[...state.visited,step.id]})}>
    <span className="palace-starting-icon" aria-hidden="true">{step.symbol}</span>
    <span><strong>{step.name}</strong><small>{step.detail}</small></span>
    <b>{state.visited.includes(step.id)?'✓ Visited':'Explore →'}</b>
   </Link>)}
  </div>
  <button type="button" className="palace-tour-dismiss" onClick={()=>change({...state,hidden:true})}>Hide this introduction</button>
 </section></details>;
}

export function PalaceLiveGatherings(){
 const[events,setEvents]=useState([]),[status,setStatus]=useState('loading');
 useEffect(()=>{
  if(!supabase){setStatus('offline');return;}
  let alive=true;
  supabase.from('events')
   .select('id,title,event_type,summary,starts_at')
   .eq('publication_status','published')
   .gte('starts_at',new Date().toISOString())
   .order('starts_at',{ascending:true}).limit(3)
   .then(({data,error})=>{
    if(!alive)return;
    if(error){setStatus('offline');return}
    setEvents(data||[]);setStatus('ready');
   }).catch(()=>{if(alive)setStatus('offline')});
  return()=>{alive=false};
 },[]);
 if(status==='offline')return null;
 return <section className="palace-live-gatherings" aria-label="Upcoming real Palace gatherings">
  <div className="palace-gatherings-header"><div><p className="eyebrow">PALACE LIFE · ON THE CALENDAR</p>
   <h2>What’s gathering beneath the stars?</h2>
   <p>Only published, scheduled gatherings appear here—never invented activity.</p></div>
   <Link to="/events">All events →</Link>
  </div>
  {status==='loading'?<p className="palace-events-empty">Checking the Palace calendar…</p>
   :events.length?<div className="palace-gathering-grid">{events.map(event=><article key={event.id}>
    <span className="palace-gathering-date">{new Date(event.starts_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span>
    <small>{String(event.event_type||'Gathering').replaceAll('_',' ')}</small>
    <h3>{event.title}</h3><p>{event.summary||'Join the Palace gathering.'}</p>
    <Link to="/events?tab=events">See gathering details →</Link>
   </article>)}</div>
   :<div className="palace-events-empty"><strong>Our next gathering is still taking shape.</strong>
     <p>Members can propose events, and new dates will appear here once officially published.</p>
     <Link to="/events?tab=proposals">Explore event proposals →</Link></div>}
 </section>;
}
