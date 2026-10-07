import React,{useEffect,useState} from 'react';
import{Link}from'react-router-dom';
import{getCelestialVaultStatus,enterCelestialVault,claimCelestialBadgeGrandmaster,getGrandPalaceCommonRoom,postGrandPalaceCommonMessage,removeGrandPalaceCommonMessage}from'./grandPalaceData';
export default function GrandPalaceExpansion(){
 const[vault,setVault]=useState(null),[room,setRoom]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(''),[kind,setKind]=useState('message'),[body,setBody]=useState(''),[lastDraw,setLastDraw]=useState(null);
 const refresh=async()=>{const[v,r]=await Promise.all([getCelestialVaultStatus(),getGrandPalaceCommonRoom()]);setVault(v);setRoom(r)};
 useEffect(()=>{refresh().catch(e=>setError(e.message))},[]);
 const action=async(label,fn)=>{if(busy)return;setBusy(label);setError('');setNotice('');try{const result=await fn();await refresh();setNotice(label+' complete.');return result}catch(e){setError(e.message)}finally{setBusy('')}};
 async function draw(){
  if(busy||Number(vault?.entries_today||0)>=3||Number(vault?.balance||0)<1)return;
  const key=crypto.randomUUID();
  const result=await action('Celestial Vault entry',()=>enterCelestialVault(key));
  if(result)setLastDraw(result);
 }
 async function submit(e){e.preventDefault();if(body.trim().length<10)return;
  const r=await action('Palace post',()=>postGrandPalaceCommonMessage(body,kind));if(r)setBody('');
 }
 return <div className="grand-expansion">
  {error&&<p role="alert" className="grand-notice error">{error}</p>}{notice&&<p role="status" className="grand-notice">{notice}</p>}
  <section className="grand-celestial-vault" id="celestial-vault">
   <div className="grand-vault-sigil" aria-hidden="true"><span>✧</span>♛<span>☾</span></div>
   <p className="eyebrow">BEYOND EMERALD · THE CELESTIAL SOVEREIGN BOX</p><h2>Almost impossible. Never unobtainable.</h2>
   <p className="grand-vault-lede">A celestial rarity reserved for extraordinary luck—or completing every founding badge family at Emerald tier. No money can purchase entries or improve the odds.</p>
   <div className="grand-vault-odds"><div><small>ODDS PER ENTRY</small><strong>1 in 1,000,000</strong></div><div><small>ENTRY COST</small><strong>1 point</strong></div><div><small>DAILY LIMIT</small><strong>{Math.max(0,3-Number(vault?.entries_today||0))}/3 remaining</strong></div></div>
   <p className="grand-fairness">Every entry is an independent secure draw. There is no pity guarantee, and entering repeatedly does not change the odds. Three entries maximum per UTC day.</p>
   <button className="grand-vault-draw" type="button" disabled={!!busy||!vault||Number(vault.balance)<1||Number(vault.entries_today)>=3} onClick={draw}>{busy==='Celestial Vault entry'?'Opening the stars…':'Spend 1 point · Enter the Vault ✦'}</button>
   {lastDraw&&<p className={'grand-vault-result '+(lastDraw.won?'won':'')} role="status">{lastDraw.won?'✦ THE CELESTIAL SOVEREIGN BOX IS YOURS!':'The stars remained quiet this time.'}<small>{lastDraw.won?'Your rewards were deposited in your Treasury.':'Entry '+lastDraw.roll?.toLocaleString()+' / 1,000,000 · Each entry has the same odds.'}</small></p>}
   <div className="grand-badge-grandmaster"><div><p className="eyebrow">THE GUARANTEED PATH</p><h3>Badge Grandmaster</h3><p>Earn Emerald on all {vault?.badge_required??'…'} founding badge families. Complete the collection and claim one guaranteed Celestial Sovereign Box.</p>
   <div className="grand-badge-meter"><span style={{width:(Math.min(100,(Number(vault?.badge_completed||0)/Math.max(1,Number(vault?.badge_required||1)))*100))+'%'}}/></div>
   <small>{vault?.badge_completed??0} / {vault?.badge_required??'…'} completed{vault?.badge_claimed?' · REWARD CLAIMED':''}</small>
   {(vault?.missing_badges||[]).length>0&&<p className="grand-missing">Next collection goals: {vault.missing_badges.slice(0,4).join(' · ')}</p>}
   </div><button type="button" className="grand-vault-master-button" disabled={!!busy||!vault||vault.badge_claimed||!vault.badge_required||vault.badge_completed<vault.badge_required} onClick={()=>action('Grandmaster claim',claimCelestialBadgeGrandmaster)}>{vault?.badge_claimed?'Celestial reward already claimed':'Claim completed collection reward ♛'}</button>
   </div>
   <div className="grand-vault-prize-list"><strong>What a Celestial Sovereign Box contains</strong><span>500 Celestial Points</span><span>One Emerald Treasury treasure</span><span>30 hearts · 12 stars · 3 moons · 1 crown</span><span>Exclusive Celestial Sovereign profile theme</span></div>
  </section>
  <section className="grand-common-room" id="grand-common-room"><header><p className="eyebrow">YOUR GRAND PALACE · INNER COURT</p><h2>The common room</h2><p>A shared home for the members of your permanent Grand Palace. Introduce yourself, encourage your court, and create together.</p></header>
   <div className="grand-quest-card"><small>✦ TODAY'S CREATIVE QUEST · UTC</small><h3>{room?.quest||'A new creative spark is gathering…'}</h3><p>Share your response with your Palace. You can also earn verified participation points through regular Palace activities; posting here alone does not generate points.</p><button type="button" onClick={()=>{setKind('quest');document.getElementById('grand-common-composer')?.focus()}}>Answer today's quest →</button></div>
   <form className="grand-common-composer" onSubmit={submit}><div className="grand-common-compose-bar"><label>Post type <select value={kind} onChange={e=>setKind(e.target.value)}><option value="message">Court conversation</option><option value="introduction">Introduction</option><option value="quest">Creative quest response</option></select></label><small>{room?.message_count_today??0}/5 daily posts</small></div>
    <textarea id="grand-common-composer" value={body} maxLength={1000} onChange={e=>setBody(e.target.value)} rows={4} placeholder="Share a thoughtful message with your Grand Palace…"/>
    <div className="grand-common-compose-foot"><small>{body.length}/1000 · 10 characters minimum</small><button type="submit" disabled={!!busy||body.trim().length<10||Number(room?.message_count_today||0)>=5}>Post to my Palace ✦</button></div>
   </form>
   <div className="grand-court-posts">{(room?.messages||[]).length?room.messages.slice().reverse().map(p=><article key={p.id}><header><div className="grand-common-author"><span>{p.avatar_url?<img src={p.avatar_url} alt=""/>:'☾'}</span><div><strong>{p.author_name||p.author_handle}</strong><small>@{p.author_handle} · {p.kind==='quest'?'Quest response':p.kind==='introduction'?'Introduction':'Court conversation'}</small></div></div><time>{new Date(p.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time></header><p>{p.body}</p>{p.is_mine&&<button type="button" onClick={()=>action('Message removal',()=>removeGrandPalaceCommonMessage(p.id))}>Remove my post</button>}</article>):<div className="grand-empty-court"><span>☾</span><strong>Your Palace's first words are still waiting.</strong><p>Be the one to welcome the next member into the court.</p></div>}</div>
  </section>
 </div>;
}
