import React,{useEffect,useState}from'react';
import{Link}from'react-router-dom';
import{getPalaceGatherings,submitPalaceExhibit,openPalaceCollaboration,addPalaceCollaborationLine,closePalaceCollaboration}from'./grandPalaceGatheringsData';
import './grand-palace-gatherings.css';
const FORMATS=[['poetry','Poetry'],['flash_fiction','Flash fiction'],['art_description','Art / illustration description'],['worldbuilding','Worldbuilding'],['recommendation','Literary recommendation'],['collaboration','Collaborative creation']];
export default function GrandPalaceGatherings(){
 const[data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState('festival');
 const[kind,setKind]=useState('poetry'),[title,setTitle]=useState(''),[body,setBody]=useState('');
 const[questTitle,setQuestTitle]=useState(''),[premise,setPremise]=useState('');
 const[lineText,setLineText]=useState({}),[openComposer,setOpenComposer]=useState(false);
 const load=async()=>{setData(await getPalaceGatherings());setError('')};
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 const act=async(label,fn,done)=>{if(busy)return;setBusy(true);setError('');setNotice('');try{await fn();await load();done?.();setNotice(label+' added to the Palace.')}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <section id="grand-gatherings" className="grand-gatherings"><header><div><p className="eyebrow">THE PALACE ARTS · GATHER TO CREATE</p><h2>Our stories belong to the stars.</h2><p>Celebrate writers, poets, artists and readers across all ten Palaces. Create with your own court and share your imagination across the constellation.</p></div></header>
 <div className="grand-gathering-tabs" role="group" aria-label="Choose a Palace gathering"><button aria-pressed={tab==='festival'} onClick={()=>setTab('festival')}>✧ Grand Festival</button><button aria-pressed={tab==='quests'} onClick={()=>setTab('quests')}>☾ Collaborative Quests</button></div>
 {error&&<p role="alert" className="grand-notice error">{error}</p>}{notice&&<p role="status" className="grand-notice">{notice}</p>}
 {tab==='festival'&&<div className="grand-exhibition"><div className="grand-gathering-intro"><div><small>THE CONSTELLATION EXHIBITION · {data?.festival_key||'THIS MONTH'}</small><h3>Ten courts. One exhibition.</h3><p>Share an original poem, a short story, a visual-art concept, invented lore or a recommendation. Entries from every Grand Palace are displayed together.</p></div><span aria-hidden="true">✧</span></div>
 <button type="button" className="grand-gathering-primary" onClick={()=>setOpenComposer(v=>!v)}>{openComposer?'Close submission':'Contribute to the exhibition ✦'}</button>
 {openComposer&&<form className="grand-gathering-form" onSubmit={e=>{e.preventDefault();act('Exhibition piece',()=>submitPalaceExhibit(kind,title,body),()=>{setBody('');setTitle('');setOpenComposer(false)})}}>
 <label>Creative form <select value={kind} onChange={e=>setKind(e.target.value)}>{FORMATS.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
 <label>Title <input value={title} maxLength={100} onChange={e=>setTitle(e.target.value)} placeholder="Name your creation" required/></label>
 <label>Your creative work <textarea rows={6} maxLength={2000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Share an original piece or an invitation to read..." required/></label>
 <footer><small>{body.length}/2000 · up to 3 submissions daily · no extra points awarded</small><button disabled={busy||title.trim().length<4||body.trim().length<25}>Publish to the exhibition</button></footer></form>}
 <div className="grand-exhibit-grid">{(data?.exhibits||[]).length?data.exhibits.map(item=><article key={item.id}><span>{FORMATS.find(f=>f[0]===item.kind)?.[1]||'Creative work'}</span><h4>{item.title}</h4><p>{item.body}</p><footer><strong>{item.display_name||item.username}</strong><small>{item.palace_name} · {new Date(item.created_at).toLocaleDateString()}</small></footer></article>):<p className="grand-gathering-empty">The gallery doors are open. The first exhibit has yet to arrive.</p>}</div>
 </div>}
 {tab==='quests'&&<div className="grand-quest-gathering"><div className="grand-gathering-intro"><div><small>THE SHARED INKWELL · YOUR PERMANENT COURT</small><h3>Pass the quill.</h3><p>Open a creative quest and build a story, poem or lore together. One member contributes, then passes the quill to someone else. Your court can host three open quests at a time.</p></div><span aria-hidden="true">☾</span></div>
 <form className="grand-gathering-form" onSubmit={e=>{e.preventDefault();act('New collaborative quest',()=>openPalaceCollaboration(questTitle,premise),()=>{setQuestTitle('');setPremise('')})}}>
 <label>Quest title <input value={questTitle} onChange={e=>setQuestTitle(e.target.value)} maxLength={100} placeholder="The Lost Constellation..." required/></label>
 <label>Opening premise <textarea rows={3} maxLength={600} value={premise} onChange={e=>setPremise(e.target.value)} placeholder="Give your court an imaginative beginning (20 characters minimum)." required/></label>
 <footer><small>Your Palace's collaborative space · no entry fee</small><button disabled={busy||questTitle.trim().length<8||premise.trim().length<20}>Open a Palace quest ✦</button></footer></form>
 <div className="grand-quest-collection">{(data?.collaborations||[]).length?data.collaborations.map(quest=><article key={quest.id}><header><h4>{quest.title}</h4><span>{quest.status==='open'?'Open for contributions':'Completed'}</span></header><p>{quest.prompt}</p><div className="grand-quest-lines">{(quest.lines||[]).map(line=><blockquote key={line.id}><p>{line.body}</p><small>— {line.display_name||line.username}</small></blockquote>)}</div>{quest.status==='open'&&<form onSubmit={e=>{e.preventDefault();act('Your contribution',()=>addPalaceCollaborationLine(quest.id,lineText[quest.id]||''),()=>setLineText(prev=>({...prev,[quest.id]:''})))}}><label>Continue the tale<textarea rows={3} maxLength={500} placeholder="Continue the story in 40–500 characters, then pass the quill..." value={lineText[quest.id]||''} onChange={e=>setLineText(prev=>({...prev,[quest.id]:e.target.value}))}/></label><button disabled={busy||(lineText[quest.id]||'').trim().length<40}>Pass my quill ✧</button></form>}</article>):<p className="grand-gathering-empty">No collaborations yet. Invite your Palace to write something unforgettable together.</p>}</div>
 </div>}
 </section>;
}
