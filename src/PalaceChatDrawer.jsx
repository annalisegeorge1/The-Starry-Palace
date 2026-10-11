import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import {watchPalaceChatRoom} from './palaceChatRealtime';
import {getLetters,sendLetter,sendLetterPhoto,editLetterMessage,searchMembers,setConversationPreference} from './palaceData';
import {createPalaceGroupChat,getPalaceGroupChatOverview,getPalaceGroupMessages,sendPalaceGroupMessage,sendPalaceGroupPhoto,editPalaceGroupMessage,respondPalaceGroupInvite,invitePalaceGroupMember,removePalaceGroupMember,leavePalaceGroupChat,setPalaceGroupMuted,markPalaceGroupRead,PALACE_GROUP_COLOURS,setPalaceGroupIdentity,pinPalaceGroupMessage,getPinnedPalaceGroupMessage,searchShareablePalaceStories} from './palaceGroupChatData';
import './palace-chat-drawer.css';
import './palace-chat-groups.css';
import {GROUP_HISTORY_PAGE_SIZE,mergePalaceGroupMessages,oldestPalaceGroupMessage,palaceChatUnreadGroup,palaceChatMatchesGroup} from './palaceChatHistory';
import './palace-chat-discovery.css';
import './palace-chat-mobile-viewport.css';
import './palace-chat-theme-parity.css';
import PalaceEmojiPicker from './PalaceEmojiPicker';
import PalaceChatGif from './PalaceChatGif';
import {insertPalaceEmoji} from './palaceEmoji';
import {encodePalaceGif,parsePalaceGif} from './palaceChatGif';
import PalaceGiphyPicker from './PalaceGiphyPicker';
import PalaceChatPhoto from './PalaceChatPhoto';
import {uploadPalaceChatPhoto,discardPalaceChatPhoto} from './palaceChatMedia';
import './palace-chat-expressions.css';
import './palace-chat-refined.css';
import './palace-chat-media-edit.css';
import './palace-chat-context-polish.css';

const draftKey=(user,kind,id)=>'palace-chat-draft:'+user+':'+kind+':'+id;
const nameOf=p=>p?.display_name||p?.username||'Palace member';
const dateOf=d=>d?new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
const errorText=e=>e?.message||'The Palace could not complete that action. Please try again.';

export default function PalaceChatDrawer({userId}){
 const[open,setOpen]=useState(false);
 const[threadOpen,setThreadOpen]=useState(false);
 const[loadingDirect,setLoadingDirect]=useState(true);
 const[refreshToken,setRefreshToken]=useState(0);
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
 const[gifOpen,setGifOpen]=useState(false);
 const[photoFile,setPhotoFile]=useState(null);
 const[photoPreview,setPhotoPreview]=useState('');
 const[editingMessage,setEditingMessage]=useState(null);
 const[editBody,setEditBody]=useState('');
 const[actionMenu,setActionMenu]=useState(null);
 const[search,setSearch]=useState('');
 const[unreadOnly,setUnreadOnly]=useState(false);
 const[historyLoading,setHistoryLoading]=useState(false);
 const[hasOlder,setHasOlder]=useState(false);
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
 const composerRef=useRef(null);
 const photoInputRef=useRef(null);
 const holdRef=useRef(null);
 const actionMenuRef=useRef(null);
 const historyScrollRef=useRef(null);
 const exhaustedHistoryRef=useRef(new Set());
 const selectedGroupRef=useRef(selectedGroup);
 selectedGroupRef.current=selectedGroup;
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
 const groupRows=groupData.groups.filter(g=>palaceChatMatchesGroup(g,search)&&(!unreadOnly||palaceChatUnreadGroup(g)));
 const visibleDirect=directRows.filter(c=>[c.correspondent?.username,c.correspondent?.display_name].join(' ').toLowerCase().includes(search.toLowerCase())&&(!unreadOnly||c.unread));
 const directUnread=directRows.filter(c=>c.unread&&!c.preference?.muted).length;
 const groupUnread=groupData.groups.filter(g=>!g.muted&&palaceChatUnreadGroup(g)).length;
 const unread=directUnread+groupUnread+groupData.invitations.length;
 const openedRoomName=tab==='direct'?nameOf(activeDirect?.correspondent):activeGroup?.title;
 useEffect(()=>{if(!photoFile){setPhotoPreview('');return}
  const preview=URL.createObjectURL(photoFile);setPhotoPreview(preview);
  return()=>URL.revokeObjectURL(preview);
 },[photoFile]);
 useEffect(()=>{setPhotoFile(null);setEditingMessage(null);setGifOpen(false)},[roomId,tab]);
 useEffect(()=>()=>{if(holdRef.current?.timer)window.clearTimeout(holdRef.current.timer)},[]);
 useEffect(()=>{
  if(!actionMenu)return;
  const onKey=e=>{if(e.key==='Escape')setActionMenu(null)};
  document.addEventListener('keydown',onKey);
  const timer=window.setTimeout(()=>actionMenuRef.current?.querySelector('[role="menuitem"]')?.focus(),0);
  return()=>{document.removeEventListener('keydown',onKey);window.clearTimeout(timer)};
 },[actionMenu]);

 useEffect(()=>{setOpen(false);setThreadOpen(false);setLoadingDirect(true);setTab('direct');setDirect(null);setGroupData({groups:[],invitations:[]});setSelectedDirect('');setSelectedGroup('');setGroupMessages({chatId:'',items:[]});setNewWhileAway(false);setLiveStatus('polling');lastAcknowledgedRef.current={roomId:'',messageId:''};setReplyTarget(null);setStorySharing(false);setPinnedPreview({chatId:'',messageId:'',message:null});setDrafts({});setError('');setNotice('');setCreating(false);setManaging(false);setSearch('');setUnreadOnly(false);setHistoryLoading(false);setHasOlder(false);historyScrollRef.current=null;exhaustedHistoryRef.current.clear()},[userId]);
 useEffect(()=>{
  if(!userId)return;
  let alive=true;
  if(!direct)setLoadingDirect(true);
  const refresh=async()=>{
   const [letters,groups]=await Promise.allSettled([getLetters(userId),getPalaceGroupChatOverview(userId)]);
   if(!alive)return;
   setLoadingDirect(false);
   if(letters.status==='fulfilled'){
    setDirect(letters.value);
    setError('');
    setSelectedDirect(previous=>letters.value.conversations.some(c=>c.conversation_id===previous&&!c.preference?.archived&&c.conversations?.kind==='direct')?previous:(letters.value.conversations.find(c=>!c.preference?.archived&&c.conversations?.kind==='direct')?.conversation_id||''));
   }else{setDirect(null);setError(errorText(letters.reason))}
   if(groups.status==='fulfilled'){
    setGroupAvailable(true);setGroupData(groups.value);
    setSelectedGroup(previous=>groups.value.groups.some(g=>g.id===previous)?previous:(groups.value.groups[0]?.id||''));
   }else{setGroupAvailable(false);setGroupData({groups:[],invitations:[]})}
   setDataOwner(userId);
  };
  refresh();
  // Keep the launcher badge from the initial fetch, but do not run costly
  // letters, membership and profile queries every minute when chat is closed.
  const timer=open?window.setInterval(()=>{if(document.visibilityState==='visible')refresh()},60000):null;
  return()=>{alive=false;if(timer!==null)window.clearInterval(timer)};
 },[open,userId,refreshToken]);
 useEffect(()=>{
  if(!open||tab!=='groups'||!selectedGroup)return;
  let alive=true;
  const refresh=()=>getPalaceGroupMessages(selectedGroup).then(rows=>{
   if(!alive)return;
   setGroupMessages(previous=>({chatId:selectedGroup,items:previous.chatId===selectedGroup?mergePalaceGroupMessages(previous.items,rows):rows}));
   setHasOlder(value=>!exhaustedHistoryRef.current.has(selectedGroup)&&(value||rows.length>=100));
  }).catch(e=>{if(alive)setError(errorText(e))});
  setHasOlder(false);setHistoryLoading(false);historyScrollRef.current=null;
  setGroupMessages({chatId:selectedGroup,items:[]});refresh();
  // Realtime handles arrivals while connected; this is a slower safety net.
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')refresh()},60000);
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
     if(active){setGroupMessages(previous=>({chatId:roomId,items:previous.chatId===roomId?mergePalaceGroupMessages(previous.items,rows):rows}));setGroupData(overview)}
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
 useLayoutEffect(()=>{
  const anchor=historyScrollRef.current;
  if(!anchor||anchor.chatId!==groupMessages.chatId)return;
  const el=messageRef.current;
  if(!el)return;
  el.scrollTop=Math.max(0,el.scrollHeight-anchor.height+anchor.top);
  historyScrollRef.current=null;
 },[groupMessages]);
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
 async function loadOlderGroupMessages(){
  if(tab!=='groups'||!activeGroup||historyLoading||!hasOlder||!messages.length)return;
  const chatId=activeGroup.id;
  const cursor=oldestPalaceGroupMessage(messages);
  if(!cursor)return;
  const el=messageRef.current;
  if(el)historyScrollRef.current={chatId,height:el.scrollHeight,top:el.scrollTop};
  scrollPinned.current=false;
  setHistoryLoading(true);setError('');
  try{
   const older=await getPalaceGroupMessages(chatId,GROUP_HISTORY_PAGE_SIZE,cursor);
   if(selectedGroupRef.current!==chatId)return;
   setGroupMessages(previous=>previous.chatId===chatId?{chatId,items:mergePalaceGroupMessages(previous.items,older)}:previous);
   if(older.length<GROUP_HISTORY_PAGE_SIZE)exhaustedHistoryRef.current.add(chatId);
   setHasOlder(older.length===GROUP_HISTORY_PAGE_SIZE);
   if(!older.length)historyScrollRef.current=null;
  }catch(e){
   if(selectedGroupRef.current===chatId){historyScrollRef.current=null;setError(errorText(e))}
  }finally{if(selectedGroupRef.current===chatId)setHistoryLoading(false)}
 }
 function insertChatEmoji(emoji){
  if(!roomId)return;
  const el=composerRef.current;
  const added=insertPalaceEmoji(currentDraft,emoji,el?.selectionStart,el?.selectionEnd,3000);
  if(!added.inserted)return;
  setDraft(added.text);
  window.requestAnimationFrame(()=>{if(composerRef.current){composerRef.current.focus();composerRef.current.setSelectionRange(added.cursor,added.cursor)}});
 }
 async function sendGif(url){
  const body=encodePalaceGif(url);
  if(!body){setError('That GIF is unavailable. Please choose another.');return}
  if(!roomId||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(tab==='groups'){
    await sendPalaceGroupMessage(roomId,userId,body,replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{});
    const fresh=await getPalaceGroupMessages(roomId);
    setGroupMessages(previous=>({chatId:roomId,items:previous.chatId===roomId?mergePalaceGroupMessages(previous.items,fresh):fresh}));
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else{
    await sendLetter(userId,roomId,body);
    setDirect(await getLetters(userId));
   }
   setGifOpen(false);setReplyTarget(null);scrollPinned.current=true;
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function sendPhoto(e){
  e.preventDefault();if(!roomId||!photoFile||busy)return;
  setBusy(true);setError('');setNotice('');
  let path='';let sent=false;
  try{
   path=await uploadPalaceChatPhoto({kind:tab==='groups'?'group':'direct',roomId,userId,file:photoFile});
   const caption=currentDraft.trim();
   if(tab==='groups'){
    await sendPalaceGroupPhoto(roomId,userId,path,caption,replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{});
    sent=true;
    const fresh=await getPalaceGroupMessages(roomId);
    setGroupMessages(p=>({chatId:roomId,items:p.chatId===roomId?mergePalaceGroupMessages(p.items,fresh):fresh}));
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else{
    await sendLetterPhoto(userId,roomId,path,caption);
    sent=true;
    setDirect(await getLetters(userId));
   }
   setPhotoFile(null);setDraft('');setReplyTarget(null);
   if(photoInputRef.current)photoInputRef.current.value='';
   scrollPinned.current=true;
  }catch(e){
   if(path&&!sent)await discardPalaceChatPhoto(path).catch(()=>{});
   setError(errorText(e));
  }finally{setBusy(false)}
 }
 async function saveEditedMessage(e){
  e.preventDefault();
  if(!roomId||!editingMessage||busy)return;
  const edited=editBody.trim();
  if(!edited||edited.length>3000){setError('Messages must contain 1–3,000 characters.');return}
  setBusy(true);setError('');
  try{
   if(tab==='groups'){
    await editPalaceGroupMessage(roomId,userId,editingMessage,edited);
    const fresh=await getPalaceGroupMessages(roomId);
    setGroupMessages(p=>({chatId:roomId,items:p.chatId===roomId?mergePalaceGroupMessages(p.items,fresh):fresh}));
   }else{
    await editLetterMessage(userId,roomId,editingMessage,edited);
    setDirect(await getLetters(userId));
   }
   setEditingMessage(null);setEditBody('');
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 function jumpToQuotedMessage(id){
  const el=[...messageRef.current?.querySelectorAll('[data-chat-message]')||[]].find(x=>x.getAttribute('data-chat-message')===id);
  el?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function clearMessageHold(){
  if(holdRef.current?.timer)window.clearTimeout(holdRef.current.timer);
  holdRef.current=null;
 }
 function openMessageActions(message,element,x,y){
  if(!element||editingMessage===message.id)return;
  clearMessageHold();
  const rect=element.getBoundingClientRect();
  const menuWidth=210,menuHeight=175;
  const width=Math.max(window.innerWidth||360,240);
  const height=Math.max(window.innerHeight||700,280);
  const left=Math.max(10,Math.min(width-menuWidth-10,Number.isFinite(x)?x-72:rect.left+20));
  const top=Math.max(10,Math.min(height-menuHeight-10,(Number.isFinite(y)?y:rect.top)-menuHeight-7));
  setActionMenu({message,top,left,roomId});
 }
 function beginMessageHold(e,message){
  if(e.button!==0||e.target.closest('button,a,textarea,input,select'))return;
  clearMessageHold();
  const element=e.currentTarget,x=e.clientX,y=e.clientY;
  holdRef.current={x,y,timer:window.setTimeout(()=>{
   holdRef.current=null;
   openMessageActions(message,element,x,y);
   try{navigator.vibrate?.(12)}catch{}
  },480)};
 }
 function moveMessageHold(e){
  const hold=holdRef.current;
  if(hold&&(Math.abs(e.clientX-hold.x)>11||Math.abs(e.clientY-hold.y)>11))clearMessageHold();
 }
 function applyMessageAction(action){
  const message=actionMenu?.message;
  setActionMenu(null);
  if(!message)return;
  if(action==='edit'){
   setEditingMessage(message.id);setEditBody(message.body);
  }else if(action==='reply'&&tab==='groups'){
   setReplyTarget({id:message.id,body:message.body,chatId:roomId});
   setStorySharing(false);
   window.requestAnimationFrame(()=>composerRef.current?.focus());
  }else if(action==='copy'){
   if(!navigator.clipboard?.writeText){setError('Copy is unavailable in this browser.');return}
   navigator.clipboard.writeText(message.body).then(()=>setNotice('Message copied.')).catch(()=>setError('The message could not be copied.'));
  }else if(action==='pin'&&tab==='groups'){
   togglePin(message);
  }
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
    const fresh=await getPalaceGroupMessages(roomId);
    setGroupMessages(previous=>({chatId:roomId,items:previous.chatId===roomId?mergePalaceGroupMessages(previous.items,fresh):fresh}));
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
   const fresh=await getPalaceGroupMessages(chatId);
   setGroupMessages(previous=>({chatId,items:previous.chatId===chatId?mergePalaceGroupMessages(previous.items,fresh):fresh}));
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
 return <div data-chat-type={tab} data-circle-colour={tab==='groups'?(activeGroup?.colorKey||'moonlit'):'moonlit'} className={'palace-chat-dock palace-chat-v2'+(open?' is-open':'')+(open&&threadOpen?' is-thread-open':'')+(open&&!threadOpen&&!creating?' is-inbox-empty':'')+(chatPaused?' is-quiet':'')}>
  {!open?<button type="button" className="palace-chat-launch" aria-label={'Open Palace chat'+(unread?' · '+unread+' new items':'')} aria-expanded={false} onClick={()=>{setActionMenu(null);setThreadOpen(false);setOpen(true)}}><span aria-hidden="true">✉</span><span>Chat</span>{unread>0&&<b>{unread>99?'99+':unread}</b>}</button>:
  <section className="palace-chat-panel" aria-label="Palace Chat" role="region">
   <header className="palace-chat-heading"><div className="palace-chat-brand"><span className="palace-chat-brand-mark" aria-hidden="true">✦</span><div className="palace-chat-brand-copy"><small>PRIVATE CONVERSATIONS</small><strong>Palace Chat</strong></div></div><div className="palace-chat-header-actions"><button type="button" onClick={()=>setChatPaused(v=>!v)} aria-pressed={chatPaused} title="Compact chat launcher when minimized" aria-label={chatPaused?'Turn off quiet launcher':'Use quiet launcher'}>☾</button><button type="button" onClick={()=>{setActionMenu(null);setOpen(false)}} aria-label="Minimize Palace chat">−</button></div></header>
   <nav className="palace-chat-tabs" aria-label="Chat type">
    <button type="button" aria-pressed={tab==='direct'} onClick={()=>{setActionMenu(null);setThreadOpen(false);setTab('direct');setSearch('');setUnreadOnly(false);setCreating(false);setManaging(false);setError('')}}>✉ Direct {directUnread>0&&<span>{directUnread}</span>}</button>
    <button type="button" aria-pressed={tab==='groups'} onClick={()=>{setActionMenu(null);setThreadOpen(false);setTab('groups');setSearch('');setUnreadOnly(false);setCreating(false);setManaging(false);setError('')}}>♧ Groups {(groupUnread+groupData.invitations.length)>0&&<span>{groupUnread+groupData.invitations.length}</span>}</button>
   </nav>
   <div className="palace-chat-tools"><input aria-label="Find a conversation" placeholder={tab==='groups'?'Find a circle or member…':'Search direct conversations…'} value={search} onChange={e=>setSearch(e.target.value)}/>
    {tab==='direct'?<Link to="/letters" onClick={()=>setOpen(false)}>All letters ↗</Link>:<button type="button" onClick={()=>{setCreating(v=>!v);setManaging(false);setMemberResults([]);setMemberSearch('');setError('')}}>{creating?'Cancel':'＋ Group'}</button>}
   </div>
   {!creating&&<div className="palace-chat-inbox-refine" aria-label="Conversation filters">
    <span>{tab==='groups'?groupData.groups.length+' private circles':loadingDirect&&!direct?'Loading direct conversations…':error&&!direct?'Could not load direct conversations':directRows.length+' direct conversations'}</span>
    <button type="button" aria-pressed={unreadOnly} onClick={()=>setUnreadOnly(v=>!v)}>{unreadOnly?'✓ Unread only':'Unread only'}</button>
    {(search||unreadOnly)&&<button type="button" className="palace-chat-clear-filter" onClick={()=>{setSearch('');setUnreadOnly(false)}}>Clear filters</button>}
   </div>}
   {notice&&<p className="palace-chat-notice" role="status">{notice}</p>}
   {error&&<p className="palace-chat-error" role="alert">{error}</p>}
   {tab==='direct'&&error&&!direct&&<button type="button" className="palace-chat-retry" onClick={()=>{setLoadingDirect(true);setError('');setRefreshToken(n=>n+1)}}>Retry loading conversations</button>}
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
     {tab==='direct'?visibleDirect.map(c=><button type="button" key={c.conversation_id} onClick={()=>{setActionMenu(null);setSelectedDirect(c.conversation_id);setThreadOpen(true);setManaging(false)}} aria-pressed={activeDirect?.conversation_id===c.conversation_id}><span className="palace-chat-list-avatar" aria-hidden="true">{(nameOf(c.correspondent)||'P').charAt(0).toUpperCase()}</span><span className="palace-chat-list-name">{nameOf(c.correspondent)}</span>{c.unread&&<span className="palace-chat-unread-spark" aria-label="Unread messages">●</span>}</button>):
      groupRows.map(g=><button type="button" key={g.id} onClick={()=>{setActionMenu(null);setSelectedGroup(g.id);setThreadOpen(true);setManaging(false);setIdentity({title:g.title,description:g.description||'',colorKey:g.colorKey||'moonlit'})}} aria-pressed={activeGroup?.id===g.id} title={g.description||g.title}><span className="palace-chat-room-symbol" aria-hidden="true">✧</span><span className="palace-chat-room-name">{g.title}</span>{palaceChatUnreadGroup(g)&&<span className="palace-chat-unread-spark" aria-label="Unread messages">●</span>}{g.muted&&<span className="palace-chat-muted-symbol" title="Muted" aria-label="Muted">◌</span>}</button>)}
     {((tab==='groups'&&!groupRows.length)||(tab==='direct'&&!visibleDirect.length))&&(search||unreadOnly)&&<span className="palace-chat-filter-empty">No matching conversations. Clear filters to see your other rooms.</span>}
    </div>
    {active?<><div className="palace-chat-correspondent"><button className="palace-chat-thread-back" type="button" onClick={()=>{setActionMenu(null);setThreadOpen(false)}} aria-label="Back to conversations">← Conversations</button><div className="palace-chat-person"><span className="palace-chat-person-avatar" aria-hidden="true">{tab==='direct'&&activeDirect?.correspondent?.avatar_url?<img src={activeDirect.correspondent.avatar_url} alt=""/>:tab==='groups'?'✧':(openedRoomName||'P').charAt(0).toUpperCase()}</span><div className="palace-chat-person-copy"><strong>{openedRoomName}</strong><small>{tab==='groups'?activeGroup.members.length+' members · Invitation-only group':'Private correspondence · Palace boundaries apply'}</small><small className="palace-chat-connection" role="status"><i aria-hidden="true" className={liveStatus==='live'?'is-live':''}/>{liveStatus==='live'?'Live updates':'Refreshes automatically'}</small>{tab==='groups'&&activeGroup.description&&<p className="palace-chat-circle-description">{activeGroup.description}</p>}</div></div>{tab==='groups'&&<button type="button" aria-expanded={managing} onClick={()=>{setManaging(v=>!v);setIdentity({title:activeGroup.title,description:activeGroup.description||'',colorKey:activeGroup.colorKey||'moonlit'})}}>Members & settings ⚙</button>}</div>
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
     {tab==='groups'&&hasOlder&&messages.length>0&&<div className="palace-chat-earlier"><button type="button" onClick={loadOlderGroupMessages} disabled={historyLoading} aria-label="Load earlier group messages">{historyLoading?'Gathering earlier messages…':'↑ Earlier messages'}</button></div>}
     <div className="palace-chat-messages" ref={messageRef} role="log" aria-label="Conversation messages" aria-live="polite" onScroll={e=>{const el=e.currentTarget;const pinned=el.scrollHeight-el.scrollTop-el.clientHeight<80;scrollPinned.current=pinned;if(pinned){setNewWhileAway(false);if(tab==='groups')acknowledgeVisibleGroupMessage();else acknowledgeVisibleDirectMessage()}}}>
      {messages.length?messages.map(m=><div key={m.id} data-chat-message={m.id}
        tabIndex={0} role="group" aria-label={'Message from '+(m.sender_id===userId?'you':tab==='groups'?nameOf(m.profiles):openedRoomName)+'. Press and hold for actions.'}
        onPointerDown={e=>beginMessageHold(e,m)}
        onPointerMove={moveMessageHold} onPointerUp={clearMessageHold} onPointerCancel={clearMessageHold} onPointerLeave={clearMessageHold}
        onContextMenu={e=>{e.preventDefault();openMessageActions(m,e.currentTarget,e.clientX,e.clientY)}}
        onKeyDown={e=>{if((e.shiftKey&&e.key==='F10')||e.key==='ContextMenu'){e.preventDefault();openMessageActions(m,e.currentTarget)} }}
        className={'palace-chat-bubble'+(m.sender_id===userId?' mine':'')+(actionMenu?.message.id===m.id?' has-active-actions':'')}>
       {tab==='groups'&&m.sender_id!==userId&&<strong className="palace-chat-sender">{nameOf(m.profiles)}</strong>}
       {tab==='groups'&&m.reply_to_id&&<button type="button" className="palace-chat-reply-quote" onClick={()=>jumpToQuotedMessage(m.reply_to_id)} aria-label="Jump to replied message"><small>↩ Reply to {nameOf(messages.find(item=>item.id===m.reply_to_id)?.profiles)}</small><p>{messages.find(item=>item.id===m.reply_to_id)?.body?.slice(0,145)||'An earlier group message'}</p></button>}
       {editingMessage===m.id?
        <form className="palace-chat-edit-form" onSubmit={saveEditedMessage}>
         <textarea aria-label="Edit your message" autoFocus value={editBody} maxLength={3000} onChange={e=>setEditBody(e.target.value)} rows={3}/>
         <div><button type="button" onClick={()=>{setEditingMessage(null);setEditBody('')}}>Cancel</button><button disabled={busy||!editBody.trim()} type="submit">{busy?'Saving…':'Save changes'}</button></div>
        </form>:
        <><PalaceChatGif body={m.body}/>{m.media_path&&<PalaceChatPhoto path={m.media_path}/>}</>}
       {m.edited_at&&<small className="palace-chat-edited-mark" title={'Edited '+new Date(m.edited_at).toLocaleString()}>Edited</small>}
       {tab==='groups'&&m.works?.slug&&<Link className="palace-chat-shared-story" to={'/work/'+encodeURIComponent(m.works.slug)} onClick={()=>setOpen(false)}><span aria-hidden="true">✧</span><span><small>PALACE STORY</small><strong>{m.works.title}</strong></span><span aria-hidden="true">↗</span></Link>}
       <small>{dateOf(m.created_at)}</small>
       {/* Message actions appear only on long-press, right-click, or keyboard context menu. */}
      </div>):<p className="palace-chat-empty">Nothing written here yet. Begin with a hello. ✦</p>}
     </div>
     {newWhileAway&&messages.length>0&&<button type="button" className="palace-chat-jump-latest" onClick={jumpToLatest}>New messages · Jump to latest ↓</button>}
     {tab==='groups'&&replyTarget?.chatId===roomId&&<div className="palace-chat-replying"><span>Replying to: {replyTarget.body.slice(0,96)}{replyTarget.body.length>96?'…':''}</span><button type="button" aria-label="Cancel group reply" onClick={()=>setReplyTarget(null)}>×</button></div>}
     <div className="palace-chat-compose-tools"><PalaceEmojiPicker label="Palace Chat" onPick={insertChatEmoji}/><button type="button" className="palace-chat-gif-toggle" aria-expanded={gifOpen} onClick={()=>setGifOpen(v=>!v)}>🎞️ GIF</button><button type="button" className="palace-chat-photo-toggle" aria-label="Attach photo" disabled={busy} onClick={()=>photoInputRef.current?.click()}>▧ Photo</button><input ref={photoInputRef} className="palace-chat-photo-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Choose photo to send" onChange={e=>{const file=e.target.files?.[0];if(file){if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>18*1024*1024){setError('Use a JPEG, PNG, WebP or AVIF photo under 18 MB.');e.target.value='';return}setPhotoFile(file);setGifOpen(false)}}}/></div>
     {gifOpen&&<PalaceGiphyPicker busy={busy} onSend={sendGif} onClose={()=>setGifOpen(false)}/>}\n     {photoFile&&<form className="palace-chat-photo-stage" onSubmit={sendPhoto}><div>{photoPreview&&<img src={photoPreview} alt="Selected photo preview"/>}<span><strong>{photoFile.name}</strong><small>Private photo · {Math.round(photoFile.size/1024)} KB · {currentDraft.trim()?'Your drafted text becomes its caption':'Add an optional caption below'}</small></span></div><footer><button type="button" onClick={()=>{setPhotoFile(null);if(photoInputRef.current)photoInputRef.current.value=''}}>Cancel</button><button type="submit" disabled={busy}>{busy?'Sending…':'Send photo ↗'}</button></footer></form>}
     <form className="palace-chat-compose" onSubmit={send}><label className="sr-only" htmlFor="palace-quick-chat-message">Your message</label><textarea ref={composerRef} id="palace-quick-chat-message" aria-label={tab==='groups'?'Write a group message':'Write a private message'} placeholder={tab==='groups'?'Write to your circle…':'Write a little note…'} rows={1} maxLength={3000} value={currentDraft} onChange={e=>setDraft(e.target.value)} onInput={e=>{const field=e.currentTarget;field.style.height='auto';field.style.height=Math.min(112,Math.max(46,field.scrollHeight))+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(currentDraft.trim())e.currentTarget.form?.requestSubmit()}}}/><button type="submit" className="palace-chat-send" disabled={busy||!currentDraft.trim()}>{busy?'Sending…':<>Send <span aria-hidden="true">↗</span></>}</button></form>
     <small className="palace-chat-draft-hint">{currentDraft?'Draft kept on this device':'Ctrl/⌘ + Enter to send · Enter for a new line'}</small>
    </>:<div className="palace-chat-empty"><p>{tab==='groups'?'No groups yet.':loadingDirect?'Loading your private conversations…':error?'Conversations could not be loaded.':'No open direct conversations yet.'}</p><p>{tab==='groups'?'Start a private circle and invite members, or accept an invitation above.':'Begin or accept a correspondence in Palace Letters.'}</p>{tab==='direct'&&<Link to="/letters" onClick={()=>setOpen(false)}>Open Palace Letters →</Link>}{tab==='groups'&&<button type="button" onClick={()=>setCreating(true)}>＋ Create a group</button>}</div>}
   </>}
   {active&&!creating&&!threadOpen&&<p className="palace-chat-select-hint">Choose a name above to open their conversation.</p>}
   <footer><small>{tab==='groups'?'Members-only group':'Private conversation'}{chatPaused?' · Quiet mode':''}</small><button type="button" className="palace-chat-mobile-close" aria-label="Close Palace chat" onClick={()=>{setActionMenu(null);setOpen(false)}}>Close chat <span aria-hidden="true">×</span></button></footer>
  </section>}
  {open&&actionMenu&&actionMenu.roomId===roomId&&createPortal(<div className="palace-chat-actions-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setActionMenu(null)}} onClick={e=>{if(e.target===e.currentTarget)setActionMenu(null)}}>
   <div ref={actionMenuRef} className="palace-chat-actions-menu" role="menu" aria-label="Message actions" style={{top:actionMenu.top,left:actionMenu.left}}>
    <small>MESSAGE OPTIONS</small>
    {tab==='groups'&&<button type="button" role="menuitem" aria-label="Reply" onClick={()=>applyMessageAction('reply')}><span aria-hidden="true">↩</span><span>Reply</span></button>}
    {actionMenu.message.sender_id===userId&&!parsePalaceGif(actionMenu.message.body)&&<button type="button" role="menuitem" aria-label="Edit message" onClick={()=>applyMessageAction('edit')}><span aria-hidden="true">✎</span><span>Edit message</span></button>}
    <button type="button" role="menuitem" aria-label="Copy text" onClick={()=>applyMessageAction('copy')}><span aria-hidden="true">⧉</span><span>Copy text</span></button>
    {tab==='groups'&&owner&&<button type="button" role="menuitem" aria-label={activeGroup?.pinnedMessageId===actionMenu.message.id?'Unpin message':'Pin message'} disabled={busy} onClick={()=>applyMessageAction('pin')}><span aria-hidden="true">✧</span><span>{activeGroup?.pinnedMessageId===actionMenu.message.id?'Unpin message':'Pin message'}</span></button>}
    <button type="button" className="palace-chat-action-dismiss" role="menuitem" onClick={()=>setActionMenu(null)}>Cancel</button>
   </div>
  </div>,document.body)}
 </div>;
}
