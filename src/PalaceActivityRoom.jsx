/* Member activity is intentionally isolated from the huge liveRooms bundle.
 * Keeps notice filters and writes in one page without new data-fetch behaviour.
 */
import React,{useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useAuth} from './auth';
import {State} from './PalaceLivePrimitives';
import PalaceGlowIcon from './PalaceGlowIcon';
import './palace-content-icon-refinement.css';
import {getActivity,markNoticeRead,markAllNoticesRead,setNoticeSaved,dismissNotice} from './palaceData';

export function ActivityLive({Frame}){
 const{session}=useAuth();const navigate=useNavigate();const[data,setData]=useState(null);const[error,setError]=useState('');const[noticeQuery,setNoticeQuery]=useState('');const[noticeView,setNoticeView]=useState('all');const[noticeGroup,setNoticeGroup]=useState('all');const[noticeType,setNoticeType]=useState('all');const[actionError,setActionError]=useState('');const[noticeBusy,setNoticeBusy]=useState('');const noticeOperationRef=useRef(false);
 const load=()=>getActivity(session.user.id).then(setData).catch(e=>setError(e.message));useEffect(()=>{load()},[session.user.id]);
 const items=data?.notifications||[];
 const noticeTypes=[...new Set(items.map(x=>x.notice_type).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
 const categoryOf=item=>{const route=String(item.route_name||'').toLowerCase();const type=String(item.notice_type||'').toLowerCase();if(['writing','work','comic','comic_studio'].includes(route)||/(comic|chapter|draft|publish|collab|permission)/.test(type))return'creative';if(route==='library'||/(reading|saved|subscription)/.test(type))return'reading';if(route==='events'||/(event|ballot|heritage)/.test(type))return'events';if(['treasury','honour'].includes(route)||/(gift|treasure|badge|achievement|rank|trade|honour)/.test(type))return'rewards';if(['letters','member','palace_life','palace-life'].includes(route)||/(letter|message|member|follow|club|forum|chat|community)/.test(type))return'community';return'system'};
 const groupLabels={all:'All',creative:'Creative',reading:'Reading',community:'Community',events:'Events',rewards:'Treasury',system:'System'};
 const groupCounts=Object.fromEntries(Object.keys(groupLabels).map(k=>[k,k==='all'?items.length:items.filter(x=>categoryOf(x)===k).length]));
 const nq=noticeQuery.trim().toLowerCase();const visibleItems=items.filter(x=>(noticeView==='all'||(noticeView==='unread'&&x.unread)||(noticeView==='saved'&&x.saved))&&(noticeGroup==='all'||categoryOf(x)===noticeGroup)&&(noticeType==='all'||x.notice_type===noticeType)&&(!nq||[x.title,x.body,x.notice_type,groupLabels[categoryOf(x)]].filter(Boolean).join(' ').toLowerCase().includes(nq)));
 function timeBucket(iso){const d=new Date(iso);const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();const day=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();const diff=Math.floor((today-day)/86400000);return diff<=0?'Today':diff===1?'Yesterday':diff<7?'This week':'Earlier'}
 const bucketOrder=['Today','Yesterday','This week','Earlier'];
 const bucketed=Object.fromEntries(bucketOrder.map(label=>[label,visibleItems.filter(x=>timeBucket(x.created_at)===label)]));

 function updateHeaderUnread(next){window.dispatchEvent(new CustomEvent('palace:activity-count-changed',{detail:{userId:session.user.id,unread:Math.max(0,next)}}))}
 async function read(id){
  if(noticeOperationRef.current)return false;
  noticeOperationRef.current=true;setNoticeBusy(id);setActionError('');
  try{
   await markNoticeRead(session.user.id,id);
   const target=items.find(x=>x.id===id);
   const next=Math.max(0,(data?.metrics?.unread||0)-(target?.unread?1:0));
   setData(d=>({...d,notifications:d.notifications.map(x=>x.id===id?{...x,unread:false}:x),metrics:{...d.metrics,unread:next}}));
   updateHeaderUnread(next);
   return true;
  }catch(e){setActionError(e.message||'Could not mark this notice as read.');return false}
  finally{noticeOperationRef.current=false;setNoticeBusy('')}
 }
 async function all(){
  if(noticeOperationRef.current)return;
  noticeOperationRef.current=true;setNoticeBusy('all');setActionError('');
  try{await markAllNoticesRead(session.user.id);setData(d=>({...d,notifications:d.notifications.map(x=>({...x,unread:false})),metrics:{...d.metrics,unread:0}}));updateHeaderUnread(0)}
  catch(e){setActionError(e.message||'Could not mark all notices as read.')}
  finally{noticeOperationRef.current=false;setNoticeBusy('')}
 }
 async function saveNotice(item){
  if(noticeOperationRef.current)return;
  noticeOperationRef.current=true;setNoticeBusy(item.id);setActionError('');
  try{const next=!item.saved;await setNoticeSaved(session.user.id,item.id,next);setData(d=>({...d,notifications:d.notifications.map(x=>x.id===item.id?{...x,saved:next}:x),metrics:{...d.metrics,saved:Math.max(0,(d.metrics?.saved||0)+(next?1:-1))}}))}
  catch(e){setActionError(e.message||'Could not update the saved notice.')}
  finally{noticeOperationRef.current=false;setNoticeBusy('')}
 }
 async function removeNotice(item){
  if(noticeOperationRef.current)return;
  noticeOperationRef.current=true;setNoticeBusy(item.id);setActionError('');
  try{
   await dismissNotice(session.user.id,item.id);
   const next=Math.max(0,(data?.metrics?.unread||0)-(item.unread?1:0));
   setData(d=>({...d,notifications:d.notifications.filter(x=>x.id!==item.id),metrics:{...d.metrics,unread:next,saved:item.saved?Math.max(0,(d.metrics?.saved||0)-1):(d.metrics?.saved||0)}}));
   if(item.unread)updateHeaderUnread(next);
  }catch(e){setActionError(e.message||'Could not dismiss this notice.')}
  finally{noticeOperationRef.current=false;setNoticeBusy('')}
 }
 function noticeHref(item){const routes={treasury:'/treasury',letters:'/letters',writing:'/writing',comic_studio:'/comics/studio',events:'/events',library:'/library',activity:'/activity','palace_life':'/palace-life','palace-life':'/palace-life',honour:'/honour',council:'/council'};if(item.route_name==='council'&&item.metadata?.tab)return '/council/governance?tab='+encodeURIComponent(item.metadata.tab);if(item.route_name==='work'&&item.route_param)return '/work/'+encodeURIComponent(item.route_param)+(item.metadata?.chapter_id?'/chapter/'+encodeURIComponent(item.metadata.chapter_id):'');if(item.route_name==='writing'&&item.route_param)return '/writing/'+encodeURIComponent(item.route_param)+(item.metadata?.chapter_id?'?chapter='+encodeURIComponent(item.metadata.chapter_id):'');if(item.route_name==='member'&&item.route_param)return '/member/'+encodeURIComponent(item.route_param);if(item.route_name==='comic'&&item.route_param)return '/comic/'+encodeURIComponent(item.route_param);if(item.route_name==='comic_studio')return '/comics/studio'+(item.metadata?.comic_id?'#comic-'+encodeURIComponent(item.metadata.comic_id):'');if(item.route_name==='library'&&item.metadata?.tab)return '/library?tab='+encodeURIComponent(item.metadata.tab);return routes[item.route_name]||null}
 async function openNotice(item){if(item.unread&&!(await read(item.id)))return;const href=noticeHref(item);if(href)navigate(href)}
 const m=data?.metrics||{};const savedCount=m.saved||0;
 return <Frame privateArea><section className="legacy-activity-page chic-activity-page">
  <section className="room-title activity-head chic-activity-head"><p className="eyebrow">SMALL STEPS, BRIGHT CONSTELLATIONS</p><h1>Moonlight Activity Room</h1><p className="lede">Your private notification centre gathers reading continuity, creative work, community and Palace notices without turning your attention into a public score.</p></section>
  <section className="activity-private-banner restored chic-activity-private"><PalaceGlowIcon name="crescent-moon" tone="home" size="small" className="activity-private-sigil"/><div><strong>Your activity room is private.</strong><p>Reading continuity and personal activity remain account-level unless you explicitly choose to share something elsewhere.</p></div></section>
  <section className="activity-overview restored chic-activity-overview">
   <article><PalaceGlowIcon name="celestial-star" tone="home" size="mini" className="activity-metric-sigil"/><strong>{m.unread||0}</strong><small>unread notices</small></article>
   <article><PalaceGlowIcon name="bookmark" tone="courts" size="mini" className="activity-metric-sigil"/><strong>{savedCount}</strong><small>saved notices</small></article>
   <article><PalaceGlowIcon name="book-open" tone="poetry" size="mini" className="activity-metric-sigil"/><strong>{m.readingStops||0}</strong><small>reading stops</small></article>
   <article><PalaceGlowIcon name="feather" tone="fiction" size="mini" className="activity-metric-sigil"/><strong>{m.publishedWorks||0}</strong><small>published works</small></article>
  </section>
  <section className="activity-notice-panel chic-activity-panel">{actionError&&<div className="save-note life-action-error" role="alert">{actionError}<button type="button" className="quiet-button" onClick={()=>setActionError('')}>Dismiss</button></div>}
   <div className="section-heading"><div><p className="eyebrow">PALACE BELLS</p><h2>What needs your attention.</h2><p>{m.unread||0} unread notice{m.unread===1?'':'s'} across your private Palace activity.</p></div>{items.some(x=>x.unread)&&<button type="button" className="outline-button" disabled={!!noticeBusy} onClick={all}>{noticeBusy==='all'?'Marking read…':'Mark all read'}</button>}</div>
   <nav className="activity-category-tabs chic-activity-categories" aria-label="Activity categories">{Object.entries(groupLabels).map(([k,label])=><button key={k} className={noticeGroup===k?'active':''} aria-pressed={noticeGroup===k} onClick={()=>setNoticeGroup(k)}><span>{label}</span><b>{groupCounts[k]||0}</b></button>)}</nav>
   <section className="activity-lenses refined chic-activity-lenses" aria-label="Activity notice controls"><div className="activity-search" role="search"><span aria-hidden="true">⌕</span><input aria-label="Search notifications" value={noticeQuery} onChange={e=>setNoticeQuery(e.target.value)} placeholder="Search notifications…"/>{noticeQuery&&<button aria-label="Clear notification search" onClick={()=>setNoticeQuery('')}>×</button>}</div><div className="activity-view-pills">{[['all','All'],['unread','Unread'],['saved','Saved']].map(([k,l])=><button key={k} className={noticeView===k?'active':''} aria-pressed={noticeView===k} onClick={()=>setNoticeView(k)}>{l}{k==='unread'&&m.unread?' · '+m.unread:k==='saved'&&savedCount?' · '+savedCount:''}</button>)}</div><select value={noticeType} onChange={e=>setNoticeType(e.target.value)} aria-label="Filter activity by exact notice type"><option value="all">All notice types</option>{noticeTypes.map(t=><option key={t} value={t}>{String(t).replaceAll('_',' ')}</option>)}</select><div className="activity-filter-status"><span role="status" aria-live="polite">{visibleItems.length} of {items.length} notice{items.length===1?'':'s'} shown</span>{(noticeQuery.trim()||noticeView!=='all'||noticeGroup!=='all'||noticeType!=='all')&&<button type="button" className="quiet-button activity-filter-reset" onClick={()=>{setNoticeQuery('');setNoticeView('all');setNoticeGroup('all');setNoticeType('all')}}>Clear filters ×</button>}</div></section>
   <State loading={!data&&!error} error={error} empty={items.length===0?<div className="activity-empty-state"><span className="activity-empty-sigil" aria-hidden="true">☾<b>✦</b></span><div><strong>Your Palace is quiet.</strong><p>Nothing needs your attention right now. Return to a story, continue writing, or visit the Commons.</p><nav><Link to="/library">Open My Library</Link><Link to="/writing">Continue writing</Link><Link to="/palace-life">Visit Palace Life</Link></nav></div></div>:''}>{items.length>0&&(visibleItems.length?<div className="activity-timeline chic-activity-timeline">{bucketOrder.map(label=>bucketed[label].length?<section className="activity-time-group" key={label}><header><h3>{label}</h3><span>{bucketed[label].length} notice{bucketed[label].length===1?'':'s'}</span></header><div className="activity-list restored chic-activity-list">{bucketed[label].map(n=>{const href=noticeHref(n);return <article key={n.id} className={(n.unread?'unread ':'')+(n.saved?'saved':'')}><span className="notice-star">{n.unread?'✦':n.saved?'☆':'·'}</span><button type="button" className="activity-notice-copy" disabled={!!noticeBusy} onClick={()=>href?openNotice(n):n.unread&&read(n.id)}><small>{groupLabels[categoryOf(n)].toUpperCase()} · {n.notice_type?.replaceAll('_',' ')||'PALACE'}</small><h3>{n.title}</h3>{n.body&&<p>{n.body}</p>}<time>{new Date(n.created_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></button><div className="activity-notice-actions">{href&&<button type="button" disabled={!!noticeBusy} onClick={()=>openNotice(n)}>{n.action_label||'Open →'}</button>}{n.unread&&<button type="button" className="quiet-button" disabled={!!noticeBusy} onClick={()=>read(n.id)}>Mark read</button>}<button type="button" disabled={!!noticeBusy} className={n.saved?'active':''} onClick={()=>saveNotice(n)}>{n.saved?'Saved ✓':'Save'}</button><button type="button" disabled={!!noticeBusy} className="quiet-button" onClick={()=>removeNotice(n)}>Dismiss</button></div></article>})}</div></section>:null)}</div>:<div className="life-empty"><span>⌕</span><h3>No notices in this view.</h3><p>Try another category, All notices, or clear the exact notice type.</p>{(noticeQuery||noticeView!=='all'||noticeGroup!=='all'||noticeType!=='all')&&<button className="outline-button" onClick={()=>{setNoticeQuery('');setNoticeView('all');setNoticeGroup('all');setNoticeType('all')}}>Clear filters</button>}</div>)}</State>
  </section>
 </section></Frame>
}
