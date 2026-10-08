import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import './palace-beta.css';

export const PALACE_BETA_CHECKS=[
 {id:'start',group:'First arrival',name:'Locate Reading Rooms and Writing Chamber without help',url:'/',hint:'Find both main doors from the homepage.'},
 {id:'mobile',group:'First arrival',name:'Use the sidebar and back navigation on your phone',url:'/',hint:'No chopped labels, blank screens or sideways scrolling.'},
 {id:'reading',group:'Reading & discovery',name:'Find a story with search and filters',url:'/reading',hint:'Try a genre and tag. Reset the filter.'},
 {id:'progress',group:'Reading & discovery',name:'Open a chapter, leave and resume reading',url:'/reading',hint:'Confirm progress persists after reloading.'},
 {id:'following',group:'Reading & discovery',name:'Save or follow a story',url:'/reading',hint:'Verify it appears in your library.'},
 {id:'draft',group:'Writing & publishing',name:'Create a private story and chapter',url:'/writing',hint:'Confirm you can type naturally in the manuscript pad.'},
 {id:'autosave',group:'Writing & publishing',name:'Type, wait for cloud save, reopen your draft',url:'/writing',hint:'Check no words disappear and your caret stays in place.'},
 {id:'network',group:'Writing & publishing',name:'Test temporary network loss while drafting',url:'/writing',hint:'Keep a separate copy; confirm device recovery is offered.'},
 {id:'tags',group:'Writing & publishing',name:'Add several tags and save work settings',url:'/writing',hint:'Confirm tags and settings are retained after navigation.'},
 {id:'palace',group:'Community & accessibility',name:'Visit your Grand Palace and one creative room',url:'/grand-palaces',hint:'Find the Palace crest, activities and community rules.'},
 {id:'vote',group:'Community & accessibility',name:'Find Council, member voting and appeals',url:'/council/governance',hint:'Confirm your choices cannot exceed ballot limits.'},
 {id:'contrast',group:'Community & accessibility',name:'Check light/dark mode, keyboard focus and mobile readability',url:'/settings',hint:'Look for legible text, visible focus and touch-sized controls.'}
];
const groups=[...new Set(PALACE_BETA_CHECKS.map(x=>x.group))];
function stored(){
 try{const raw=JSON.parse(localStorage.getItem('palace-beta-checks-v1')||'{}');return{
  checked:typeof raw.checked==='object'&&raw.checked?raw.checked:{},
  notes:typeof raw.notes==='string'?raw.notes:'',
  device:typeof raw.device==='string'?raw.device:'',
  role:typeof raw.role==='string'?raw.role:'reader'
 }}catch{return{checked:{},notes:'',device:'',role:'reader'}}
}
export default function PalaceBetaGuide({Frame}){
 const[state,setState]=useState(stored);
 const[message,setMessage]=useState('');
 function update(patch){
  const next={...state,...patch};setState(next);
  try{localStorage.setItem('palace-beta-checks-v1',JSON.stringify(next))}catch{}
 }
 const done=PALACE_BETA_CHECKS.filter(x=>state.checked[x.id]).length;
 async function copyReport(){
  const text=[
   'THE STARRY PALACE — BETA FEEDBACK',
   'Tester role: '+state.role,'Device/browser: '+(state.device||'Not specified'),
   'Checks explored: '+done+'/'+PALACE_BETA_CHECKS.length,'',
   ...PALACE_BETA_CHECKS.map(check=>(state.checked[check.id]?'[x] ':'[ ] ')+check.name),
   '', 'Issues, screenshots to reference, and suggestions:',
   state.notes||'(No notes entered)',
   '', 'Please share this report privately with the site owner. Do not include passwords, private stories, or other members’ personal information.'
  ].join('\n');
  try{await navigator.clipboard.writeText(text);setMessage('Feedback copied. You can paste it into a private message to the site owner.')}
  catch{setMessage('Copy was blocked by your browser. Select the notes below and copy them manually.');}
 }
 return <Frame><main className="palace-beta-guide">
  <header className="palace-beta-hero"><p className="eyebrow">THE PALACE TEST KITCHEN · OPTIONAL PREVIEW</p>
   <h1>Help make the Palace feel effortless.</h1>
   <p>Try real tasks, tell us what feels confusing and note anything that fails. Nothing you type here is automatically sent to anyone.</p>
   <div className="palace-beta-progress"><strong>{done}/{PALACE_BETA_CHECKS.length}</strong><span>checkpoints explored</span><div role="progressbar" aria-valuemin={0} aria-valuemax={PALACE_BETA_CHECKS.length} aria-valuenow={done} aria-label="Beta checklist progress"><i style={{width:done/PALACE_BETA_CHECKS.length*100+'%'}}/></div></div>
  </header>
  <section className="palace-beta-controls">
   <label>I'm testing as<select value={state.role} onChange={e=>update({role:e.target.value})}><option value="reader">A reader</option><option value="writer">A writer</option><option value="artist">An artist / comic creator</option><option value="moderator">A Council member / moderator</option></select></label>
   <label>Device and browser<input value={state.device} maxLength={120} placeholder="e.g. Android · Chrome" onChange={e=>update({device:e.target.value})}/></label>
  </section>
  {groups.map(group=><section className="palace-beta-group" key={group}><h2>{group}</h2><div className="palace-beta-checks">
   {PALACE_BETA_CHECKS.filter(x=>x.group===group).map(item=><article key={item.id}>
    <label className="palace-beta-task"><input type="checkbox" checked={!!state.checked[item.id]} onChange={e=>update({checked:{...state.checked,[item.id]:e.target.checked}})}/>
     <strong>{item.name}</strong></label>
    <p>{item.hint}</p><Link to={item.url}>Open this part of the Palace →</Link>
   </article>)}
   </div></section>)}
  <section className="palace-beta-report"><h2>What needs improvement?</h2>
   <p>Describe the page, what you tried, what you expected, what happened and whether the problem repeats. Do not include secrets or private drafts.</p>
   <label htmlFor="palace-beta-notes">Feedback and problems</label>
   <textarea id="palace-beta-notes" value={state.notes} rows={7} maxLength={7000} placeholder="Page: Writing Pad\nWhat I did: Typed and changed chapters\nExpected: All words saved\nActual: ...\nDevice: ..." onChange={e=>update({notes:e.target.value})}/>
   <div className="palace-beta-actions"><button type="button" onClick={copyReport}>Copy my feedback report</button>
    <button type="button" className="quiet" onClick={()=>{if(window.confirm('Clear your local checklist and notes?')){update({checked:{},notes:'',device:'',role:'reader'});setMessage('Local checklist cleared.')}}}>Reset checklist</button></div>
   {message&&<p role="status">{message}</p>}
   <small>Checklist progress is saved only in this browser. Copying the report does not submit it; the site owner must receive it through a channel you choose.</small>
  </section>
 </main></Frame>;
}
