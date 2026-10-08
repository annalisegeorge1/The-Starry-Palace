import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {getPalaceGovernance,togglePalaceBallot,createPalaceBallot,publishPalaceNotice} from './palaceGovernanceApi';
import './palace-governance.css';
import './palace-council-next.css';
import {CouncilElections,CouncilReviewChecklist} from './PalaceCouncilNext';
import {CouncilResults,MyCouncilAppeals} from './PalaceCouncilResults';
import {CouncilService,MyCouncilRestoration,CouncilRestorationDesk} from './PalaceCouncilAccountability';
import PalacePetitions from './PalacePetitions';
import {getPalaceVisitProgress,checkCouncilDeadlines} from './palaceGovernanceApi';
const formatDate=value=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
export default function PalaceGovernance({Frame}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [streak,setStreak]=useState(null);useEffect(()=>{getPalaceVisitProgress().then(setStreak).catch(()=>{})},[]);
 const [params,setParams]=useSearchParams();
 const viewNames=['overview','ballots','petitions','elections','results','service','notices-private','appeals','notices','checklists','accountability','manage'];
 const [view,setView]=useState(()=>viewNames.includes(params.get('tab'))?params.get('tab'):'overview');
 const [filter,setFilter]=useState('open'),[ballotScope,setBallotScope]=useState('all'),[ballotQuery,setBallotQuery]=useState('');
 const goView=next=>{setView(next);setParams(previous=>{const updated=new URLSearchParams(previous);updated.set('tab',next);return updated},{replace:true})};
 useEffect(()=>{const next=params.get('tab');if(viewNames.includes(next)&&next!==view)setView(next)},[params]);
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[choices,setChoices]=useState('Yes\nNo'),[hours,setHours]=useState(72),[visibility,setVisibility]=useState('after_close');
 const [noticeTitle,setNoticeTitle]=useState(''),[noticeBody,setNoticeBody]=useState(''),[category,setCategory]=useState('tidings');
 async function load(){setData(await getPalaceGovernance())}
 useEffect(()=>{load().catch(e=>setError(e.message));checkCouncilDeadlines().catch(()=>{})},[]);
 async function action(fn,success){if(busy)return;setBusy(true);setError('');setNotice('');try{await fn();await load();setNotice(success)}catch(e){setError(e.message)}finally{setBusy(false)}}
 const allBallots=data?.ballots||[];
 const ballotIsOpen=b=>b.status==='open'&&new Date(b.opens_at)<=new Date()&&new Date(b.closes_at)>new Date();
 const openCount=allBallots.filter(ballotIsOpen).length;
 const votedCount=allBallots.filter(b=>(b.my_votes||[]).length>0).length;
 const ballots=allBallots.filter(b=>
  (filter==='all'||(filter==='open'?ballotIsOpen(b):!ballotIsOpen(b)))&&
  (ballotScope==='all'||b.ballot_scope===ballotScope)&&
  (!ballotQuery.trim()||[b.title,b.description,b.ballot_scope].filter(Boolean).join(' ').toLowerCase().includes(ballotQuery.trim().toLowerCase()))
 );
 return <Frame privateArea><main className="palace-governance"><header className="governance-hero"><span>♛ THE PALACE COUNCIL · VOICES OF THE COURT</span><h1>The Council & Voting Hall</h1><p>Every member has a voice. Each ballot has clear rules, a closing time, and a documented outcome. Crowns and points never buy additional votes.</p><Link to="/council">Visit the Council review desk →</Link></header>
 <div className="governance-pills"><span>✧ One member, one ballot</span><span>☾ Private individual choices</span><span>✦ Results follow ballot rules</span></div>
 <section className="governance-streak"><div><strong>☾ Your Starwatch Streak</strong><p>{streak?.today_logged?`Day ${streak.streak_days||7} logged · Next reward: 175 points after 7 days`:"Visit the Palace daily to light your seven stars."}</p><small>{streak?.completed_weeks??0} seven-day milestones · {streak?.weeks_until_prize??4} more until your next Golden Treasury gift · {streak?.prizes_earned??0} gifts earned</small></div><div className="governance-streak-dots">{Array.from({length:7},(_,i)=><span key={i} className={i<(streak?.streak_days||0)?"lit":""}>✦</span>)}</div></section>
 <nav className="governance-tab-groups" aria-label="Council and voting areas">
 <div className="governance-tab-group"><small>MEMBER VOICE</small><div className="governance-tabs">
 {[
 ['overview','✧ Welcome'],['ballots','🗳 Voting'],['petitions','✍ Petitions'],['notices','📜 Tidings']
 ].map(([key,label])=><button type="button" key={key} className={view===key?'active':''} aria-pressed={view===key} onClick={()=>goView(key)}>{label}</button>)}
 </div></div>
 <div className="governance-tab-group"><small>REPRESENTATION</small><div className="governance-tabs">
 {[
 ['service','✦ Representatives'],['elections','♜ Elections'],['results','♛ Council of Ten']
 ].map(([key,label])=><button type="button" key={key} className={view===key?'active':''} aria-pressed={view===key} onClick={()=>goView(key)}>{label}</button>)}
 </div></div>
 <div className="governance-tab-group"><small>FAIRNESS & CARE</small><div className="governance-tabs">
 {[
 ['appeals','⚖ My Appeals'],['notices-private','☾ My Notices'],
 ...(data?.is_council?[['checklists','⚖ Case Review'],['accountability','✧ Restoration'],['manage','♛ Steward Tools']]:[])
 ].map(([key,label])=><button type="button" key={key} className={view===key?'active':''} aria-pressed={view===key} onClick={()=>goView(key)}>{label}</button>)}
 </div></div>
 </nav>
 {error&&<p className="governance-error" role="alert">{error}</p>}{notice&&<p className="governance-notice" role="status">{notice}</p>}
 {!data&&!error&&<p>Gathering the Council records…</p>}
 {view==='overview'&&<section className="governance-overview" aria-label="Your Palace Council at a glance">
 <div className="governance-heading"><div><span>GOVERNANCE, MADE HUMAN</span><h2>Welcome to your Council</h2>
 <p>Choose where you want to participate. The Council protects the community; Grand Palace representatives listen to its people.</p></div></div>
 <div className="governance-pulse">
 <div><strong>{openCount}</strong><span>member votes open</span></div>
 <div><strong>{votedCount}</strong><span>ballots you joined</span></div>
 <div><strong>{data?.notices?.length||0}</strong><span>published Council tidings</span></div>
 </div>
 <div className="governance-entry-grid">
 <button type="button" onClick={()=>goView('ballots')}><span aria-hidden="true">🗳</span><strong>Cast your vote</strong><small>Open ballots, results, and deadlines</small><b>Enter →</b></button>
 <button type="button" onClick={()=>goView('petitions')}><span aria-hidden="true">✍</span><strong>Make a proposal</strong><small>Put a community idea before the Council</small><b>Enter →</b></button>
 <button type="button" onClick={()=>goView('elections')}><span aria-hidden="true">♜</span><strong>Meet your elections</strong><small>Representatives chosen by the ten Palaces</small><b>Enter →</b></button>
 <button type="button" onClick={()=>goView('appeals')}><span aria-hidden="true">⚖</span><strong>Fairness & appeals</strong><small>Understand reviews and your available remedies</small><b>Enter →</b></button>
 </div>
 <div className="governance-recent"><div><h3>From the Council Noticeboard</h3>
 <p>Public notices stay separate from confidential moderation files.</p></div>
 {(data?.notices||[]).slice(0,2).map(n=><article key={n.id}><small>{n.category} · {formatDate(n.published_at)}</small><strong>{n.title}</strong><p>{n.body}</p></article>)}
 <button type="button" onClick={()=>goView('notices')}>Read all Council tidings →</button></div>
 </section>}
 {view==='petitions'&&<PalacePetitions/>}{view==='service'&&<CouncilService/>}{view==='notices-private'&&<MyCouncilRestoration/>}{view==='accountability'&&data?.is_council&&<CouncilRestorationDesk/>}{view==='results'&&<CouncilResults/>}{view==='appeals'&&<MyCouncilAppeals/>}{view==='elections'&&<CouncilElections/>}{view==='checklists'&&data?.is_council&&<CouncilReviewChecklist/>}
 {view==='ballots'&&<section><div className="governance-heading"><div><span>YOUR VOICE MATTERS</span><h2>Ballots of the Palace</h2>
 <p>Choose carefully. Change your choice before the ballot closes. Participation is free; tokens cannot buy votes.</p>
 <small>{openCount} open · {votedCount} you participated in</small></div><div className="governance-filter"><button className={filter==='open'?'active':''} onClick={()=>setFilter('open')}>Open</button><button className={filter==='closed'?'active':''} onClick={()=>setFilter('closed')}>Closed</button><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button></div></div><div className="governance-ballot-controls"><label>Find a vote
 <input type="search" value={ballotQuery} onChange={e=>setBallotQuery(e.target.value)} placeholder="Search by topic or question…" /></label>
 <label>Ballot type<select value={ballotScope} onChange={e=>setBallotScope(e.target.value)}>
 <option value="all">All ballot types</option><option value="community">Palace-wide</option><option value="event">Event ballots</option>
 </select></label></div><div className="governance-ballots">{ballots.length?ballots.map(b=>{const open=b.status==='open'&&new Date(b.opens_at)<=new Date()&&new Date(b.closes_at)>new Date();const votes=b.my_votes||[];const total=(b.options||[]).reduce((a,o)=>a+Number(o.votes||0),0);return <article key={b.id} className="governance-ballot"><header><span className={'governance-status '+(open?'live':'finished')}>{open?'✦ VOTING OPEN':'☾ BALLOT CLOSED'}</span><small>{b.ballot_scope==='event'?'Event decision':'Palace decision'}</small><h3>{b.title}</h3><p>{b.description}</p><div className="governance-ballot-meta"><span>Closes {formatDate(b.closes_at)}</span><span>{votes.length}/{b.max_selections} choices</span></div></header><div className="governance-choices">{(b.options||[]).map(o=>{const chosen=votes.includes(o.id);const percent=total?Math.round(Number(o.votes||0)/total*100):0;return <button type="button" disabled={busy||!open||(!chosen&&votes.length>=b.max_selections)} onClick={()=>action(()=>togglePalaceBallot(b.id,o.id),chosen?'Choice withdrawn.':'Your vote is recorded.')} className={'governance-choice '+(chosen?'selected':'')} key={o.id} aria-pressed={chosen}><span><strong>{o.label}</strong>{o.description&&<small>{o.description}</small>}</span><b>{chosen?'✓ Your choice':open?'Select':'—'}</b>{b.results_revealed&&<span className="governance-result"><i style={{width:percent+'%'}}/><em>{o.votes} vote{Number(o.votes)===1?'':'s'} · {percent}%</em></span>}</button>})}</div><footer>{b.results_revealed?<span>{b.voter_count} member{Number(b.voter_count)===1?'':'s'} participated · percentages are by selection</span>:<span>Results {b.results_visibility==='after_vote'?'unlock after you vote':b.results_visibility==='after_close'?'unlock once voting closes':'are hidden'}</span>}<small>Votes cannot be purchased or multiplied with Palace points.</small></footer></article>}):<div className="governance-empty"><strong>✧ The Voting Chamber is peaceful.</strong><p>No ballots match this search or filter. Try All, clear the search, or return for the next Palace decision.</p></div>}</div></section>}
 {view==='notices'&&<section className="governance-notices"><div className="governance-heading"><div><span>SEALED AND PUBLISHED</span><h2>The Council Noticeboard</h2><p>Public-facing news and decisions. Personal reports and evidence are never published here.</p></div></div>{(data?.notices||[]).length?(data.notices||[]).map(n=><article key={n.id}><span>{n.category==='decision'?'⚖ Decision':n.category==='invitation'?'✉ Invitation':'✦ Tidings'}</span><h3>{n.title}</h3><p>{n.body}</p><small>Published {formatDate(n.published_at)}</small></article>):<div className="governance-empty">No Council notices have been published yet.</div>}</section>}
 {view==='manage'&&data?.is_council&&<section className="governance-manage"><div className="governance-heading"><div><span>AUTHORISED STEWARDS ONLY</span><h2>Convene the Council</h2><p>Public ballots and announcements do not replace confidential case reviews.</p></div></div><div className="governance-manage-grid"><form onSubmit={e=>{e.preventDefault();action(()=>createPalaceBallot(title,description,choices.split('\n').map(x=>x.trim()).filter(Boolean),Number(hours),visibility),'A new ballot is open.');}}><h3>🗳 Call a member vote</h3><label>Ballot question<input required minLength={8} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Background and context<textarea required minLength={15} maxLength={1200} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Choices · one per line<textarea required rows={5} value={choices} onChange={e=>setChoices(e.target.value)}/></label><label>Voting period<select value={hours} onChange={e=>setHours(e.target.value)}><option value={24}>24 hours</option><option value={72}>3 days</option><option value={168}>7 days</option><option value={336}>14 days</option></select></label><label>Results visible<select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="after_close">After voting closes</option><option value="after_vote">After each member votes</option><option value="public">Throughout voting</option></select></label><button disabled={busy||choices.split('\n').filter(x=>x.trim()).length<2}>Open Palace ballot ✦</button></form><form onSubmit={e=>{e.preventDefault();action(()=>publishPalaceNotice(noticeTitle,noticeBody,category),'The Council notice is published.');}}><h3>📜 Publish Council tidings</h3><label>Notice title<input required minLength={6} maxLength={160} value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)}/></label><label>Type<select value={category} onChange={e=>setCategory(e.target.value)}><option value="tidings">Council tidings</option><option value="decision">Public decision</option><option value="invitation">Invitation to participate</option></select></label><label>Public wording<textarea required minLength={20} maxLength={2000} rows={7} value={noticeBody} onChange={e=>setNoticeBody(e.target.value)}/></label><p>Never paste private reports, personal data or confidential evidence into a public notice.</p><button disabled={busy}>Publish to the Palace ✧</button></form></div></section>}
 </main></Frame>;
}