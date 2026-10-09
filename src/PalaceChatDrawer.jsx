import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import {watchPalaceChatRoom} from './palaceChatRealtime';
import {getLetters,sendLetter,searchMembers,setConversationPreference} from './palaceData';
import {createPalaceGroupChat,getPalaceGroupChatOverview,getPalaceGroupMessages,sendPalaceGroupMessage,respondPalaceGroupInvite,invitePalaceGroupMember,removePalaceGroupMember,leavePalaceGroupChat,setPalaceGroupMuted,markPalaceGroupRead,PALACE_GROUP_COLOURS,setPalaceGroupIdentity,pinPalaceGroupMessage,getPinnedPalaceGroupMessage,searchShareablePalaceStories} from './palaceGroupChatData';
import './palace-chat-drawer.css';
import './palace-chat-groups.css';

const draftKey=(user,kind,id)=>'palace-chat-draft:'+user+':'+kind+':'+id;
const nameOf=p=>p?.display_name||p?.username||'Palace member';
const dateOf=d=>d?new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
const errorText=e=>e?.message||'The Palace could not complete that action. Please try again.';

export default function PalaceChatDrawer({userId}){
 const[open,setOpen]=useState(false);
 const[tab,setTab]=useState('direct');
 const[direct,setDirect]=useState(null);
 const[dataOwner,setDataOwner]=useState(userId);
 const[groupData,setGroupData]=useState({groups:[],invitations:[]});
 const[groupAvailable,setGroupAvailable]=useState(true);
 const[selectedDirect,setSelectedDirect]=useState('');
 const[selectedGroup,setSelectedGroup]=useState('');
 const[groupMessages,setGroupMessages]=useState({chatId:'',items:[]});
 const[drafts,setDrafts]=useState({});
 const[busy,setBusy]=useState(false);
 const[liveStatus,setLiveStatus]=useState('polling');
 const[newWhileAway,setNewWhileAway]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');
 const[search,setSearch]=useState('');
 const[quiet,setQuiet]=useState(false);
 const[chatPaused,setChatPaused]=useState(false);
 const[creating,setCreating]=useState(false);
 const[managing,setManaging]=useState(false);
 const[groupTitle,setGroupTitle]=useState('');
 const[memberSearch,setMemberSearch]=useState('');
 const[memberResults,setMemberResults]=useState([]);
 const[invitees,setInvitees]=useState([]);
 const[identity,setIdentity]=useState({title:'',description:'',colorKey:'moonlit'});
 const[replyTarget,setReplyTarget]=useState(null);
 const[storySharing,setStorySharing]=useState(false);
 const[storyQuery,setStoryQuery]=useState('');
 const[storyResults,setStoryResults]=useState([]);
 const[pinnedPreview,setPinnedPreview]=useState({chatId:'',messageId:'',message:null});
 const messageRef=useRef(null);
 const scrollPinned=useRef(true);
 const lastAcknowledgedRef=useRef({roomId:'',messageId:''});
 const activeDirect=direct?.conversations?.find(c=>c.conversation_id===selectedDirect&&!c.preference?.archived&&c.conversations?.kind==='direct');
 const activeGroup=groupData.groups.find(g=>g.id===selectedGroup);
 const active=tab==='direct'?activeDirect:activeGroup;
 const roomId=tab==='direct'?activeDirect?.conversation_id:activeGroup?.id;
 const messages=tab==='direct'?(direct?.messages||[]).filter(m=>m.conversation_id===roomId).slice().reverse():groupMessages.chatId===roomId?groupMessages.items:[];
 const latestMessage=messages[messages.length-1]||null;
 const latestMessageId=latestMessage?.id||'';
 const pinnedMessage=tab==='groups'&&activeGroup?.pinnedMessageId?(messages.find(m=>m.id===activeGroup.pinnedMessageId)||((pinnedPreview.chatId===roomId&&pinnedPreview.messageId===activeGroup.pinnedMessageId)?pinnedPreview.message:null)):null;
 const draftsKey=roomId?draftKey(userId,tab,roomId):'';
 const currentDraft=roomId?(drafts[draftsKey]??(()=>{try{return localStorage.getItem(draftsKey)||''}catch{return ''}})()):'';
 const directRows=(direct?.conversations||[]).filter(c=>!c.preference?.archived&&c.conversations?.kind==='direct');
 const groupRows=groupData.groups.filter(g=>g.title.toLowerCase().includes(search.toLowerCase()));
 const visibleDirect=directRows.filter(c=>[c.correspondent?.username,c.correspondent?.display_name].join(' ').toLowerCase().includes(search.toLowerCase()));
 const directUnread=directRows.filter(c=>c.unread&&!c.preference?.muted).length;
 const groupUnread=groupData.groups.filter(g=>!g.muted&&g.lastMessageAt&&(!g.lastReadAt||Date.parse(g.lastMessageAt)>Date.parse(g.lastReadAt))).length;
 const unread=directUnread+groupUnread+groupData.invitations.length;
 const openedRoomName=tab==='direct'?nameOf(activeDirect?.correspondent):activeGroup?.title;

 useEffect(()=>{setOpen(false);setTab('direct');setDirect(null);setGroupData({groups:[],invitations:[]});setSelectedDirect('');setSelectedGroup('');setGroupMessages({chatId:'',items:[]});setNewWhileAway(false);setLiveStatus('polling');lastAcknowledgedRef.current={roomId:'',messageId:''};setReplyTarget(null);setStorySharing(false);setPinnedPreview({chatId:'',messageId:'',message:null});setDrafts({});setError('');setNotice('');setCreating(false);setManaging(false)},[userId]);
 useEffect(()=>{
  if(!userId)return;
  let alive=true;
  const refresh=async()=>{
   const [letters,groups]=await Promise.allSettled([getLetters(userId),getPalaceGroupChatOverview(userId)]);
   if(!alive)return;
   if(letters.status==='fulfilled'){
    setDirect(letters.value);
    setSelectedDirect(previous=>letters.value.conversations.some(c=>c.conversation_id===previous&&!c.preference?.archived&&c.conversations?.kind==='direct')?previous:(letters.value.conversations.find(c=>!c.preference?.archived&&c.conversations?.kind==='direct')?.conversation_id||''));
   }else{setDirect(null);setError(errorText(letters.reason))}
   if(groups.status==='fulfilled'){
    setGroupAvailable(true);setGroupData(groups.value);
    setSelectedGroup(previous=>groups.value.groups.some(g=>g.id===previous)?previous:(groups.value.groups[0]?.id||''));
   }else{setGroupAvailable(false);setGroupData({groups:[],invitations:[]})}
   setDataOwner(userId);
  };
  refresh();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')refresh()},open?16000:60000);
  return()=>{alive=false;window.clearInterval(timer)};
 },[open,userId]);
 useEffect(()=>{
  if(!open||tab!=='groups'||!selectedGroup)return;
  let alive=true;
  const refresh=()=>getPalaceGroupMessages(selectedGroup).then(rows=>{if(alive)setGroupMessages({chatId:selectedGroup,items:rows})}).catch(e=>{if(alive)setError(errorText(e))});
  setGroupMessages({chatId:selectedGroup,items:[]});refresh();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')refresh()},12000);
  return()=>{alive=false;window.clearInterval(timer)};
 },[open,tab,selectedGroup]);
 // RLS-protected live events wake a fresh fetch. Polling remains a fallback
 // when a connection is lost or an older client cannot subscribe.
 useEffect(()=>{
  if(!open||!roomId||!userId){setLiveStatus('polling');return}
  let active=true;
  let fetching=false;
  let repeat=false;
  setLiveStatus('connecting');
  const refresh=async()=>{
   if(!active||document.visibilityState==='hidden')return;
   if(fetching){repeat=true;return}
   fetching=true;
   try{
    if(tab==='groups'){
     const [rows,overview]=await Promise.all([getPalaceGroupMessages(roomId),getPalaceGroupChatOverview(userId)]);
     if(active){setGroupMessages({chatId:roomId,items:rows});setGroupData(overview)}
    }else{
     const letters=await getLetters(userId);
     if(active)setDirect(letters);
    }
   }catch{if(active)setLiveStatus('polling')}
   finally{
    fetching=false;
    if(active&&repeat){repeat=false;refresh()}
   }
  };
  const unsubscribe=watchPalaceChatRoom(supabase,{
   userId,kind:tab,roomId,onChange:refresh,
   onStatus:status=>{
    if(!active)return;
    if(status==='SUBSCRIBED'){setLiveStatus('live');refresh()}
    else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setLiveStatus('polling');
   }
  });
  const onVisibility=()=>{if(document.visibilityState==='visible')refresh()};
  document.addEventListener('visibilitychange',onVisibility);
  return()=>{active=false;unsubscribe();document.removeEventListener('visibilitychange',onVisibility)};
 },[open,tab,roomId,userId]);
 useEffect(()=>{
  const g=groupData.groups.find(item=>item.id===selectedGroup);
  setIdentity({title:g?.title||'',description:g?.description||'',colorKey:g?.colorKey||'moonlit'});
  setReplyTarget(null);setStorySharing(false);setStoryResults([]);setStoryQuery('');
 },[selectedGroup]);
 useEffect(()=>{
  const id=activeGroup?.pinnedMessageId;
  if(!open||tab!=='groups'||!selectedGroup||!id){setPinnedPreview({chatId:'',messageId:'',message:null});return}
  let live=true;
  getPinnedPalaceGroupMessage(selectedGroup,id).then(message=>{
   if(live)setPinnedPreview({chatId:selectedGroup,messageId:id,message});
  }).catch(()=>{if(live)setPinnedPreview({chatId:selectedGroup,messageId:id,message:null})});
  return()=>{live=false};
 },[open,tab,selectedGroup,activeGroup?.pinnedMessageId]);
 useEffect(()=>{
  if(!open||!roomId)return;
  scrollPinned.current=true;setNewWhileAway(false);
  if(tab==='direct'&&activeDirect?.unread){
   setConversationPreference(userId,roomId,{...{starred:!!activeDirect.preference?.starred,archived:false,muted:!!activeDirect.preference?.muted},last_read_at:new Date().toISOString()}).then(()=>setDirect(d=>d?({...d,conversations:d.conversations.map(c=>c.conversation_id===roomId?{...c,unread:false}:c)}):d)).catch(()=>{});
  }
 },[open,tab,roomId,userId]);
 useEffect(()=>{
  const el=messageRef.current;
  if(!el||!open||!roomId)return;
  if(scrollPinned.current){
   el.scrollTop=el.scrollHeight;
   setNewWhileAway(false);
   if(tab==='groups'&&latestMessageId)acknowledgeVisibleGroupMessage();
   else if(tab==='direct'&&activeDirect?.unread&&latestMessageId)acknowledgeVisibleDirectMessage();
  }else if(latestMessageId)setNewWhileAway(true);
 },[latestMessageId,roomId,tab,open]);
 useEffect(()=>{const update=()=>setQuiet(document.body.classList.contains('reader-focus-mode')||document.body.classList.contains('writer-focus-mode'));update();const obs=new MutationObserver(update);obs.observe(document.body,{attributes:true,attributeFilter:['class']});return()=>obs.disconnect()},[]);
 useEffect(()=>{const handle=e=>{if(e.key==='Escape'&&open){if(creating){setCreating(false)}else if(managing)setManaging(false);else setOpen(false)}};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle)},[open,creating,managing]);
 if(!userId||dataOwner!==userId)return null;

 function acknowledgeVisibleGroupMessage(){
  if(tab!=='groups'||!roomId||!latestMessageId)return;
  const previous=lastAcknowledgedRef.current;
  if(previous.roomId===roomId&&previous.messageId===latestMessageId)return;
  lastAcknowledgedRef.current={roomId,messageId:latestMessageId};
  markPalaceGroupRead(roomId,userId).then(()=>{
   const readAt=new Date().toISOString();
   setGroupData(d=>({...d,groups:d.groups.map(g=>g.id===roomId?{...g,lastReadAt:readAt}:g)}));
  }).catch(()=>{if(lastAcknowledgedRef.current.messageId===latestMessageId)lastAcknowledgedRef.current={roomId:'',messageId:''}});
 }
 function acknowledgeVisibleDirectMessage(){
  if(tab!=='direct'||!roomId||!activeDirect?.unread)return;
  const preference=activeDirect.preference||{};
  setConversationPreference(userId,roomId,{
   starred:!!preference.starred,archived:false,muted:!!preference.muted,last_read_at:new Date().toISOString()
  }).then(()=>setDirect(d=>d?({...d,conversations:d.conversations.map(c=>c.conversation_id===roomId?{...c,unread:false}:c)}):d)).catch(()=>{});
 }
 function jumpToLatest(){
  const el=messageRef.current;
  if(el)el.scrollTop=el.scrollHeight;
  scrollPinned.current=true;setNewWhileAway(false);
  if(tab==='groups')acknowledgeVisibleGroupMessage();
  if(tab==='direct')acknowledgeVisibleDirectMessage();
 }
 function setDraft(value){
  if(!roomId)return;
  setDrafts(p=>({...p,[draftsKey]:value}));
  try{value?localStorage.setItem(draftsKey,value):localStorage.removeItem(draftsKey)}catch{}
 }
 async function send(e){
  e.preventDefault();
  const text=currentDraft.trim();if(!roomId||!text||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(tab==='groups'){
    await sendPalaceGroupMessage(roomId,userId,text,replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{});
    await markPalaceGroupRead(roomId,userId);
    setGroupMessages({chatId:roomId,items:await getPalaceGroupMessages(roomId)});
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else{
    await sendLetter(userId,roomId,text);
    setDirect(await getLetters(userId));
   }
   scrollPinned.current=true;setDraft('');setReplyTarget(null);
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function searchForMembers(e){
  e.preventDefault();if(!memberSearch.trim())return;
  setBusy(true);setError('');
  try{setMemberResults((await searchMembers(memberSearch)).filter(p=>p.id!==userId))}
  catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 function toggleInvite(person){
  setInvitees(list=>list.some(p=>p.id===person.id)?list.filter(p=>p.id!==person.id):list.length<11?[...list,person]:list);
 }
 async function createGroup(e){
  e.preventDefault();if(busy||invitees.length===0)return;
  setBusy(true);setError('');
  try{
   const id=await createPalaceGroupChat(groupTitle,invitees.map(p=>p.id));
   setGroupData(await getPalaceGroupChatOverview(userId));
   setSelectedGroup(id);setTab('groups');setCreating(false);setInvitees([]);setMemberResults([]);setMemberSearch('');setGroupTitle('');
   setNotice('Group created. Your invitations are waiting for acceptance.');
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function respondToInvite(invite,accept){
  setBusy(true);setError('');
  try{
   await respondPalaceGroupInvite(invite.id,accept);
   setGroupData(await getPalaceGroupChatOverview(userId));
   if(accept){setSelectedGroup(invite.id);setNotice('You joined '+invite.title+'.')}
   else setNotice('Invitation declined.');
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function mutate(action,success){
  if(busy)return;setBusy(true);setError('');
  try{await action();setGroupData(await getPalaceGroupChatOverview(userId));setNotice(success||'Saved.')}
  catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function findStories(e){
  e.preventDefault();setBusy(true);setError('');
  try{setStoryResults(await searchShareablePalaceStories(storyQuery))}
  catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function shareStory(work){
  if(!activeGroup||busy)return;
  const chatId=activeGroup.id;setBusy(true);setError('');
  try{
   await sendPalaceGroupMessage(chatId,userId,'✧ A Palace story to read: '+work.title,{sharedWorkId:work.id});
   setGroupMessages({chatId,items:await getPalaceGroupMessages(chatId)});
   setGroupData(await getPalaceGroupChatOverview(userId));
   setStorySharing(false);setStoryQuery('');setStoryResults([]);
   scrollPinned.current=true;setNotice('Story shared with your circle.');
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function saveIdentity(e){
  e.preventDefault();if(!activeGroup||busy)return;
  await mutate(()=>setPalaceGroupIdentity(activeGroup.id,identity),'Group appearance and description saved.');
 }
 async function togglePin(message){
  if(!activeGroup||!owner||busy)return;
  const next=activeGroup.pinnedMessageId===message.id?null:message.id;
  await mutate(()=>pinPalaceGroupMessage(activeGroup.id,next),next?'Message pinned for your circle.':'Pin removed.');
 }
 async function inviteNew(person){
  if(!activeGroup)return;
  await mutate(()=>invitePalaceGroupMember(activeGroup.id,person.id),'Invitation sent to '+nameOf(person)+'.');
  setMemberSearch('');setMemberResults([]);
 }
 const owner=activeGroup?.ownerId===userId;
 if(quiet&&!open)return null;
 return <div data-circle-colour={tab==='groups'?(activeGroup?.colorKey||'moonlit'):'moonlit'} className={'palace-chat-dock palace-chat-v2'+(open?' is-open':'')+(chatPaused?' is-quiet':'')}>
  {!open?<button type="button" className="palace-chat-launch" aria-label={'Open Palace chat'+(unread?' · '+unread+' new items':'')} aria-expanded={false} onClick={()=>setOpen(true)}><span aria-hidden="true">✉</span><span>Chat</span>{unread>0&&<b>{unread>99?'99+':unread}</b>}</button>:
  <section className="palace-chat-panel" aria-label="Palace Chat" role="region">
   <header className="palace-chat-heading"><div><small>THE PALACE · PRIVATE CHATS</small><strong>Palace Chat <span aria-hidden="true">✦</span></strong></div><div className="palace-chat-header-actions"><button type="button" onClick={()=>setChatPaused(v=>!v)} aria-pressed={chatPaused} title="Smaller launcher when minimized" aria-label={chatPaused?'Turn off quiet launcher':'Use quiet launcher'}>◌</button><button type="button" onClick={()=>setOpen(false)} aria-label="Minimize Palace chat">−</button></div></header>
   <nav className="palace-chat-tabs" aria-label="Chat type">
    <button type="button" aria-pressed={tab==='direct'} onClick={()=>{setTab('direct');setCreating(false);setManaging(false);setError('')}}>✉ Direct {directUnread>0&&<span>{directUnread}</span>}</button>
    <button type="button" aria-pressed={tab==='groups'} onClick={()=>{setTab('groups');setCreating(false);setManaging(false);setError('')}}>♧ Groups {(groupUnread+groupData.invitations.length)>0&&<span>{groupUnread+groupData.invitations.length}</span>}</button>
   </nav>
   <div className="palace-chat-tools"><input aria-label="Find a conversation" placeholder={tab==='groups'?'Search groups…':'Find a member…'} value={search} onChange={e=>setSearch(e.target.value)}/>
    {tab==='direct'?<Link to="/letters" onClick={()=>setOpen(false)}>All letters ↗</Link>:<button type="button" onClick={()=>{setCreating(v=>!v);setManaging(false);setMemberResults([]);setMemberSearch('');setError('')}}>{creating?'Cancel':'＋ Group'}</button>}
   </div>
   {notice&&<p className="palace-chat-notice" role="status">{notice}</p>}
   {error&&<p className="palace-chat-error" role="alert">{error}</p>}
   {tab==='groups'&&!groupAvailable&&<p className="palace-chat-empty">Group chats are not available on this Palace connection yet. Private letters still work.</p>}
   {tab==='groups'&&groupAvailable&&groupData.invitations.length>0&&!creating&&<div className="palace-chat-invitations"><small>AT YOUR DOOR · GROUP INVITATIONS</small>{groupData.invitations.map(i=><div key={i.id}><strong>{i.title}</strong><div><button type="button" disabled={busy} onClick={()=>respondToInvite(i,true)}>Join</button><button type="button" disabled={busy} onClick={()=>respondToInvite(i,false)}>Decline</button></div></div>)}</div>}
   {tab==='groups'&&creating?<form className="palace-chat-group-form" onSubmit={createGroup}>
    <label>Give your group a name<input aria-label="Group name" value={groupTitle} onChange={e=>setGroupTitle(e.target.value)} minLength={3} maxLength={80} placeholder="The Moonlit Circle" required/></label>
    <p>Invite 1–11 people. They choose whether to join; invitations do not grant access to private messages.</p>
    <div className="palace-chat-selected">{invitees.map(p=><button key={p.id} type="button" onClick={()=>toggleInvite(p)} aria-label={'Remove '+nameOf(p)}>{nameOf(p)} ×</button>)}</div>
    <div className="palace-chat-member-search"><input aria-label="Search people to invite" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Find a Palace member"/><button type="button" disabled={busy||!memberSearch.trim()} onClick={searchForMembers}>Find</button></div>
    <div className="palace-chat-member-results">{memberResults.map(p=><button type="button" key={p.id} aria-pressed={invitees.some(x=>x.id===p.id)} disabled={!invitees.some(x=>x.id===p.id)&&invitees.length>=11} onClick={()=>toggleInvite(p)}>{invitees.some(x=>x.id===p.id)?'✓ ':'＋ '}{nameOf(p)} <small>@{p.username}</small></button>)}</div>
    <button className="palace-chat-primary" type="submit" disabled={busy||groupTitle.trim().length<3||invitees.length===0}>{busy?'Creating…':'Create group · '+invitees.length+' invited'}</button>
   </form>:<>
    <div className="palace-chat-people" aria-label={tab==='groups'?'Groups':'Direct conversations'}>
     {tab==='direct'?visibleDirect.map(c=><button type="button" key={c.conversation_id} onClick={()=>{setSelectedDirect(c.conversation_id);setManaging(false)}} aria-pressed={activeDirect?.conversation_id===c.conversation_id}>{c.unread?'● ':''}{nameOf(c.correspondent)}</button>):
      groupRows.map(g=><button type="button" key={g.id} onClick={()=>{setSelectedGroup(g.id);setManaging(false);setIdentity({title:g.title,description:g.description||'',colorKey:g.colorKey||'moonlit'})}} aria-pressed={activeGroup?.id===g.id}>{g.lastMessageAt&&(!g.lastReadAt||Date.parse(g.lastMessageAt)>Date.parse(g.lastReadAt))?'● ':''}{g.title}</button>)}
    </div>
    {active?<><div className="palace-chat-correspondent"><div><strong>{openedRoomName}</strong><small>{tab==='groups'?activeGroup.members.length+' members · Invitation-only group':'Private correspondence · Palace boundaries apply'}</small><small className="palace-chat-connection" role="status"><i aria-hidden="true" className={liveStatus==='live'?'is-live':''}/>{liveStatus==='live'?'Live updates':'Refreshes automatically'}</small>{tab==='groups'&&activeGroup.description&&<p className="palace-chat-circle-description">{activeGroup.description}</p>}</div>{tab==='groups'&&<button type="button" aria-expanded={managing} onClick={()=>{setManaging(v=>!v);setIdentity({title:activeGroup.title,description:activeGroup.description||'',colorKey:activeGroup.colorKey||'moonlit'})}}>Members & settings ⚙</button>}</div>
     {tab==='groups'&&managing&&<section className="palace-chat-settings" aria-label="Group settings">
      <div className="palace-chat-settings-top"><strong>Members</strong><button type="button" disabled={busy} onClick={()=>mutate(()=>setPalaceGroupMuted(activeGroup.id,userId,!activeGroup.muted),activeGroup.muted?'Group unmuted.':'Group muted.')}>{activeGroup.muted?'Unmute':'Mute'}</button></div>
      <ul>{activeGroup.members.map(m=><li key={m.id}><span>{nameOf(m)} {m.id===activeGroup.ownerId?'· host':''}</span>{owner&&m.id!==userId&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm('Remove '+nameOf(m)+' from this group?'))mutate(()=>removePalaceGroupMember(activeGroup.id,m.id),'Member removed.')}}>Remove</button>}</li>)}</ul>
      {owner&&<><form className="palace-chat-identity-form" onSubmit={saveIdentity}><label>Group name<input value={identity.title} minLength={3} maxLength={80} onChange={e=>setIdentity(v=>({...v,title:e.target.value}))}/></label><label>Description<textarea aria-label="Group description" value={identity.description} maxLength={360} rows={2} placeholder="What brings this circle together?" onChange={e=>setIdentity(v=>({...v,description:e.target.value}))}/></label><label>Circle colour<select aria-label="Group colour" value={identity.colorKey} onChange={e=>setIdentity(v=>({...v,colorKey:e.target.value}))}>{PALACE_GROUP_COLOURS.map(item=><option value={item.key} key={item.key}>{item.label}</option>)}</select></label><button disabled={busy||identity.title.trim().length<3}>Save appearance</button></form>
       <div className="palace-chat-member-search"><input aria-label="Find a member to invite" placeholder="Add another member" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)}/><button type="button" disabled={busy||!memberSearch.trim()} onClick={searchForMembers}>Find</button></div>
       <div className="palace-chat-member-results">{memberResults.filter(p=>!activeGroup.members.some(m=>m.id===p.id)).map(p=><button type="button" key={p.id} disabled={busy} onClick={()=>inviteNew(p)}>＋ Invite {nameOf(p)}</button>)}</div></>}
      <button type="button" className="palace-chat-leave" disabled={busy} onClick={()=>{if(window.confirm('Leave '+activeGroup.title+'? You will lose access to its private messages.'))mutate(()=>leavePalaceGroupChat(activeGroup.id),'You left the group.')}}>Leave group</button>
     </section>}
     {tab==='groups'&&activeGroup.pinnedMessageId&&<div className="palace-chat-pinned" role="note"><span aria-hidden="true">✦</span><div><strong>Pinned in this circle</strong><p>{pinnedMessage?.body||'A message is pinned from an earlier part of this conversation.'}</p></div>{owner&&<button type="button" disabled={busy} aria-label="Unpin group message" onClick={()=>mutate(()=>pinPalaceGroupMessage(activeGroup.id,null),'Pin removed.')}>Unpin</button>}</div>}
     {tab==='groups'&&<div className="palace-chat-sharing-actions"><button type="button" aria-expanded={storySharing} onClick={()=>{setStorySharing(v=>!v);setStoryResults([]);setStoryQuery('')}}>✧ {storySharing?'Close story shelf':'Share a Palace story'}</button></div>}
     {tab==='groups'&&storySharing&&<section className="palace-chat-share-shelf" aria-label="Share a published Palace story"><form onSubmit={findStories}><input aria-label="Find a published story to share" placeholder="Search published story titles…" value={storyQuery} onChange={e=>setStoryQuery(e.target.value)} minLength={2} maxLength={90}/><button disabled={busy||storyQuery.trim().length<2}>Find</button></form><div>{storyResults.map(w=><button type="button" key={w.id} disabled={busy} onClick={()=>shareStory(w)}><strong>{w.title}</strong><small>Share with this circle ↗</small></button>)}</div><small>Only published Palace stories can be shared.</small></section>}
     <div className="palace-chat-messages" ref={messageRef} role="log" aria-label="Conversation messages" aria-live="polite" onScroll={e=>{const el=e.currentTarget;const pinned=el.scrollHeight-el.scrollTop-el.clientHeight<80;scrollPinned.current=pinned;if(pinned){setNewWhileAway(false);if(tab==='groups')acknowledgeVisibleGroupMessage();else acknowledgeVisibleDirectMessage()}}}>
      {messages.length?messages.map(m=><div key={m.id} className={'palace-chat-bubble'+(m.sender_id===userId?' mine':'')}>
       {tab==='groups'&&m.sender_id!==userId&&<strong className="palace-chat-sender">{nameOf(m.profiles)}</strong>}
       {tab==='groups'&&m.reply_to_id&&<div className="palace-chat-reply-quote"><small>Reply to</small><p>{messages.find(item=>item.id===m.reply_to_id)?.body?.slice(0,145)||'An earlier group message'}</p></div>}
       <p>{m.body}</p>
       {tab==='groups'&&m.works?.slug&&<Link className="palace-chat-shared-story" to={'/work/'+encodeURIComponent(m.works.slug)} onClick={()=>setOpen(false)}><span aria-hidden="true">✧</span><span><small>PALACE STORY</small><strong>{m.works.title}</strong></span><span aria-hidden="true">↗</span></Link>}
       <small>{dateOf(m.created_at)}</small>
       {tab==='groups'&&<div className="palace-chat-bubble-actions"><button type="button" onClick={()=>{setReplyTarget({id:m.id,body:m.body,chatId:roomId});setStorySharing(false)}}>↩ Reply</button>{owner&&<button type="button" disabled={busy} onClick={()=>togglePin(m)}>{activeGroup.pinnedMessageId===m.id?'Unpin':'Pin'}</button>}</div>}
      </div>):<p className="palace-chat-empty">Nothing written here yet. Begin with a hello. ✦</p>}
     </div>
     {newWhileAway&&messages.length>0&&<button type="button" className="palace-chat-jump-latest" onClick={jumpToLatest}>New messages · Jump to latest ↓</button>}
     {tab==='groups'&&replyTarget?.chatId===roomId&&<div className="palace-chat-replying"><span>Replying to: {replyTarget.body.slice(0,96)}{replyTarget.body.length>96?'…':''}</span><button type="button" aria-label="Cancel group reply" onClick={()=>setReplyTarget(null)}>×</button></div>}
     <form className="palace-chat-compose" onSubmit={send}><label className="sr-only" htmlFor="palace-quick-chat-message">Your message</label><textarea id="palace-quick-chat-message" aria-label={tab==='groups'?'Write a group message':'Write a private message'} placeholder={tab==='groups'?'Write to your circle…':'Write a little note…'} rows={2} maxLength={3000} value={currentDraft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(currentDraft.trim())e.currentTarget.form?.requestSubmit()}}}/><button type="submit" disabled={busy||!currentDraft.trim()}>{busy?'Sending…':'Send ↗'}</button></form>
     <small className="palace-chat-draft-hint">{currentDraft?'Draft kept on this device':'Ctrl/⌘ + Enter to send · Enter for a new line'}</small>
    </>:<div className="palace-chat-empty"><p>{tab==='groups'?'No groups yet.':'No open direct conversations yet.'}</p><p>{tab==='groups'?'Start a private circle and invite members, or accept an invitation above.':'Begin or accept a correspondence in Palace Letters.'}</p>{tab==='direct'&&<Link to="/letters" onClick={()=>setOpen(false)}>Open Palace Letters →</Link>}{tab==='groups'&&<button type="button" onClick={()=>setCreating(true)}>＋ Create a group</button>}</div>}
   </>}
   <footer><small>{tab==='groups'?'Group messages are visible only to current group members.':'Your Palace letters stay private.'} {chatPaused?'Quiet launcher is on.':'Minimize whenever you want to focus.'}</small></footer>
  </section>}
 </div>;
}
