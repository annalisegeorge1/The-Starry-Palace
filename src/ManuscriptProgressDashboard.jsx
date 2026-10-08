import React,{useEffect,useMemo,useState}from'react';
import{getManuscriptProgress,saveManuscriptStoryGoal,saveManuscriptChapterPlan}from'./manuscriptProgressData';
import './manuscript-progress-dashboard.css';
const stages=[['idea','✧','Idea'],['drafting','✎','Drafting'],['revising','◈','Revising'],['proofreading','⌕','Proofreading'],['ready','✦','Ready']];
const initial={target_words:0,target_chapters:0,target_date:'',intention:''};
const stageOf=(ch,p)=>ch.status==='published'?'published':ch.scheduled_for?'scheduled':p?.stage||'drafting';
export default function ManuscriptProgressDashboard({work,chapters=[],onChapter}){
 const[state,setState]=useState(null),[goal,setGoal]=useState(initial),[expanded,setExpanded]=useState(false),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;setState(null);if(work?.id)getManuscriptProgress(work.id).then(x=>{if(active){setState(x);setGoal({...initial,...x.goal})}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[work?.id]);
 const plans=state?.chapters||[];
 const ordered=[...chapters].sort((a,b)=>Number(a.position||0)-Number(b.position||0));
 const totalWords=ordered.reduce((n,x)=>n+Number(x.word_count||0),0);
 const totalPublished=ordered.filter(x=>x.status==='published').length;
 const scheduled=ordered.filter(x=>x.status!=='published'&&!!x.scheduled_for).length;
 const withPlans=ordered.map(x=>({...x,plan:plans.find(p=>p.chapter_id===x.id)}));
 const target=Number(goal.target_words)||0;
 const percent=target?Math.min(100,Math.round(totalWords/target*100)):0;
 const stageCounts=useMemo(()=>withPlans.reduce((o,x)=>{const s=stageOf(x,x.plan);o[s]=(o[s]||0)+1;return o},{}),[chapters,state]);
 const next=withPlans.filter(x=>x.status!=='published').sort((a,b)=>{
  const d=v=>v?.plan?.target_date||v?.scheduled_for||'9999-12-31';
  return d(a).localeCompare(d(b))||a.position-b.position;
 }).slice(0,5);
 async function saveGoal(){if(busy)return;setBusy(true);setError('');setNotice('');try{const x=await saveManuscriptStoryGoal(work.id,goal);setState(x);setNotice('Manuscript milestones saved.') }catch(e){setError(e.message)}finally{setBusy(false)}}
 async function savePlan(id,draft){if(busy)return;setBusy(true);setError('');setNotice('');try{setState(await saveManuscriptChapterPlan(id,draft));setEditing(null);setNotice('Chapter revision plan saved.')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="manuscript-dashboard" aria-label="Private manuscript progress dashboard">
  <header><div><p className="eyebrow">THE MANUSCRIPT COMPASS</p><h2>Your story, from first spark to final page.</h2><p>Private planning space. Nothing here publishes, schedules or changes a chapter's actual text.</p></div><button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Close compass':'Open manuscript compass ✧'}</button></header>
  <div className="manuscript-dashboard-pulse">
   <article><span aria-hidden="true">✎</span><strong>{totalWords.toLocaleString()}</strong><small>Words written</small></article>
   <article><span aria-hidden="true">▤</span><strong>{ordered.length}</strong><small>Chapters</small></article>
   <article><span aria-hidden="true">✦</span><strong>{totalPublished}</strong><small>Published</small></article>
   <article><span aria-hidden="true">◷</span><strong>{scheduled}</strong><small>Scheduled</small></article>
  </div>
  {expanded&&<div className="manuscript-dashboard-body">
   <div className="manuscript-dashboard-goals"><div><h3>Milestones</h3><p>A personal target, never a publishing requirement.</p></div><div className="manuscript-dashboard-goal-grid"><label>Word goal<input type="number" min="0" max="5000000" value={goal.target_words||0} onChange={e=>setGoal(g=>({...g,target_words:e.target.value}))}/></label><label>Planned chapters<input type="number" min="0" max="2000" value={goal.target_chapters||0} onChange={e=>setGoal(g=>({...g,target_chapters:e.target.value}))}/></label><label>Personal target date<input type="date" value={goal.target_date||''} onChange={e=>setGoal(g=>({...g,target_date:e.target.value}))}/></label><label className="manuscript-dashboard-intention">Story intention<input maxLength={280} value={goal.intention||''} onChange={e=>setGoal(g=>({...g,intention:e.target.value}))} placeholder="What do you want this story to become?"/></label></div><div className="manuscript-dashboard-meter"><div><span>Word goal</span><strong>{target?percent+'%':'Set a goal'}</strong></div><div className="manuscript-dashboard-track"><i style={{width:percent+'%'}}/></div><small>{totalWords.toLocaleString()} of {target?target.toLocaleString():'—'} words</small></div><button disabled={busy||!state} onClick={saveGoal} type="button">Save milestones</button></div>
   <div className="manuscript-dashboard-pipeline"><div><h3>Story journey</h3><p>Editorial stages are your private notes; publication status remains separate.</p></div><div className="manuscript-stage-cards">{[...stages,['scheduled','◷','Scheduled'],['published','✦','Published']].map(([id,icon,label])=><article key={id}><span aria-hidden="true">{icon}</span><strong>{stageCounts[id]||0}</strong><small>{label}</small></article>)}</div></div>
   <div className="manuscript-dashboard-chapters"><div><h3>Chapter roadmap</h3><p>Choose an editing stage, target word count, and next revision priority.</p></div><div className="manuscript-dashboard-rows">{withPlans.length?withPlans.map(ch=>{const p=ch.plan||{stage:'drafting',target_words:0,revision_goal:'',target_date:''};return <article key={ch.id}><div className="manuscript-dashboard-chapter-info"><span>{String(ch.position).padStart(2,'0')}</span><div><strong>{ch.title}</strong><small>{Number(ch.word_count||0).toLocaleString()} words · {ch.status==='published'?'Published':ch.scheduled_for?'Scheduled':stages.find(s=>s[0]===p.stage)?.[2]||'Drafting'}{p.target_date?' · target '+p.target_date:''}</small>{p.revision_goal&&<p>↳ {p.revision_goal}</p>}</div></div><div className="manuscript-dashboard-chapter-actions"><button type="button" onClick={()=>onChapter?.(ch.id)}>Open chapter</button><button type="button" aria-expanded={editing?.id===ch.id} onClick={()=>setEditing(editing?.id===ch.id?null:{id:ch.id,plan:{...p}})}>{editing?.id===ch.id?'Close plan':'Plan revision'}</button></div>{editing?.id===ch.id&&<div className="manuscript-dashboard-revision-form"><label>Editing stage<select value={editing.plan.stage} onChange={e=>setEditing(x=>({...x,plan:{...x.plan,stage:e.target.value}}))}>{stages.map(([id,,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Word target<input type="number" min="0" max="200000" value={editing.plan.target_words||0} onChange={e=>setEditing(x=>({...x,plan:{...x.plan,target_words:e.target.value}}))}/></label><label>Target date<input type="date" value={editing.plan.target_date||''} onChange={e=>setEditing(x=>({...x,plan:{...x.plan,target_date:e.target.value}}))}/></label><label className="manuscript-dashboard-revision-note">Next revision goal<input maxLength={280} placeholder="e.g. Tighten dialogue in scene three" value={editing.plan.revision_goal||''} onChange={e=>setEditing(x=>({...x,plan:{...x.plan,revision_goal:e.target.value}}))}/></label><button type="button" disabled={busy} onClick={()=>savePlan(ch.id,editing.plan)}>Save revision plan</button></div>}</article>}):<p className="manuscript-dashboard-empty">Start a chapter to see its progress journey here.</p>}</div></div>
   <div className="manuscript-dashboard-next"><h3>Next steps</h3>{next.length?next.map(ch=><button key={ch.id} type="button" onClick={()=>onChapter?.(ch.id)}><span aria-hidden="true">✧</span><span>{ch.title}</span><small>{ch.plan?.revision_goal||'Continue your chapter'}</small><span>→</span></button>):<p>All existing chapters are published. Your next story chapter is waiting to be imagined.</p>}</div>
   {notice&&<p role="status" className="manuscript-dashboard-notice">{notice}</p>}{error&&<p role="alert" className="manuscript-dashboard-error">{error}</p>}
  </div>}
 </section>
}
