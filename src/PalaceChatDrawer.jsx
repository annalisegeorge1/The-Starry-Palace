import MemberAvatar from './MemberAvatar';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
import {watchPalaceChatRoom} from './palaceChatRealtime';
import {buildPalaceDirectPreviews} from './palaceChatDirectPreview';
import {filterPalaceDirectInbox,findPalaceChatMessages} from './palaceChatInboxModel';
import {collectPalaceSharedMedia,groupPalaceSharedMedia} from './palaceChatSharedMedia';
import {PALACE_READING_CIRCLE_PROMPTS,PALACE_READING_CIRCLE_KITS,makePalaceCircleDraft} from './palaceReadingCirclePrompts';
import {makePalaceDirectQuoteDraft} from './palaceDirectQuote';
import {PALACE_CHAT_V3_ENABLED,getPalaceReactions,changePalaceReaction} from './palaceChatV3';
import PalaceChatReactionBar from './PalaceChatReactionBar';
import './palace-chat-workspace.css';
import {getMyProfile,getLetters,getDirectConversationMessages,DIRECT_HISTORY_PAGE_SIZE,sendLetter,sendLetterPhoto,editLetterMessage,searchMembers,setConversationPreference,getMemberBoundary,setMemberBoundary,reportConversation,submitCommunityReport} from './palaceData';
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
import './palace-chat-conversation-first.css';
import './palace-chat-compact-menu.css';

const draftKey=(user,kind,id)=>'palace-chat-draft:'+user+':'+kind+':'+id;
const nameOf=p=>p?.display_name||p?.username||'Palace member';
const dateOf=d=>d?new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';
const errorText=e=>e?.message||'The Palace could not complete that action. Please try again.';

export default function PalaceChatDrawer({userId,workspace=false,initialRoom=null}){
 const[selfProfile,setSelfProfile]=useState(null);
 useEffect(()=>{let active=true;setSelfProfile(null);Promise.resolve().then(()=>getMyProfile(userId)).then(p=>{if(active)setSelfProfile(p)}).catch(()=>{});return()=>{active=false}},[userId]);
 const[open,setOpen]=useState(Boolean(workspace));
 useEffect(()=>{if(workspace)return;const openFromHeader=()=>{setActionMenu(null);setThreadOpen(false);setOpen(true)};window.addEventListener("palace-chat-open",openFromHeader);return()=>window.removeEventListener("palace-chat-open",openFromHeader)},[workspace]);
 const[threadOpen,setThreadOpen]=useState(Boolean(initialRoom?.roomId));
 const[loadingDirect,setLoadingDirect]=useState(true);
 const[refreshToken,setRefreshToken]=useState(0);
 const[tab,setTab]=useState(initialRoom?.tab==='groups'?'groups':'direct');
 const[direct,setDirect]=useState(null);
 const[dataOwner,setDataOwner]=useState(userId);
 const[groupData,setGroupData]=useState({groups:[],invitations:[]});
 const[groupAvailable,setGroupAvailable]=useState(true);
 const[selectedDirect,setSelectedDirect]=useState(initialRoom?.tab==='direct'?initialRoom.roomId||'':'');
 const[selectedGroup,setSelectedGroup]=useState(initialRoom?.tab==='groups'?initialRoom.roomId||'':'');
 const[groupMessages,setGroupMessages]=useState({chatId:'',items:[]});
 const[directHistory,setDirectHistory]=useState({roomId:'',items:[],hasOlder:false,loading:false});
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
 const[starredOnly,setStarredOnly]=useState(false);
 const[showArchived,setShowArchived]=useState(false);
 const[messageSearch,setMessageSearch]=useState('');
 const[searchWithinThread,setSearchWithinThread]=useState(false);
 const[showSharedMedia,setShowSharedMedia]=useState(false);
 const[conversationOptionsOpen,setConversationOptionsOpen]=useState(false);
 const[mediaFilter,setMediaFilter]=useState('all');
 const[safetyOpen,setSafetyOpen]=useState(false);
 const[boundary,setBoundary]=useState({muted:false,blocked:false});
 const[reportReason,setReportReason]=useState('');
 const[reportedGroupMessage,setReportedGroupMessage]=useState(null);
 const[reactionRows,setReactionRows]=useState({roomId:'',rows:[]});
 const[reactionRefresh,setReactionRefresh]=useState(0);
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
 const[showCirclePrompts,setShowCirclePrompts]=useState(false);
 const[storyQuery,setStoryQuery]=useState('');
 const[storyResults,setStoryResults]=useState([]);
 const[pinnedPreview,setPinnedPreview]=useState({chatId:'',messageId:'',message:null});
 const messageRef=useRef(null);
 const composerRef=useRef(null);
 const photoInputRef=useRef(null);
 const holdRef=useRef(null);
 const actionMenuRef=useRef(null);
 const conversationOptionsRef=useRef(null);
 const historyScrollRef=useRef(null);
 const directScrollRef=useRef(null);
 const selectedDirectRef=useRef(selectedDirect);
 selectedDirectRef.current=selectedDirect;
 const exhaustedHistoryRef=useRef(new Set());
 const selectedGroupRef=useRef(selectedGroup);
 selectedGroupRef.current=selectedGroup;
 const scrollPinned=useRef(true);
 const lastAcknowledgedRef=useRef({roomId:'',messageId:''});
 const activeDirect=direct?.conversations?.find(c=>c.conversation_id===selectedDirect&&!c.preference?.archived&&c.conversations?.kind==='direct');
 const activeGroup=groupData.groups.find(g=>g.id===selectedGroup);
 const active=tab==='direct'?activeDirect:activeGroup;
 const roomId=tab==='direct'?activeDirect?.conversation_id:activeGroup?.id;
 const recentDirect=(direct?.messages||[]).filter(m=>m.conversation_id===roomId);
 const messages=tab==='direct'?mergePalaceGroupMessages(directHistory.roomId===roomId?directHistory.items:[],recentDirect):groupMessages.chatId===roomId?groupMessages.items:[];
 const reactionMessageIds=messages.slice(-120).map(m=>m.id).filter(Boolean).join(',');
 const latestMessage=messages[messages.length-1]||null;
 const latestMessageId=latestMessage?.id||'';
 const pinnedMessage=tab==='groups'&&activeGroup?.pinnedMessageId?(messages.find(m=>m.id===activeGroup.pinnedMessageId)||((pinnedPreview.chatId===roomId&&pinnedPreview.messageId===activeGroup.pinnedMessageId)?pinnedPreview.message:null)):null;
 const draftsKey=roomId?draftKey(userId,tab,roomId):'';
 const currentDraft=roomId?(drafts[draftsKey]??(()=>{try{return localStorage.getItem(draftsKey)||''}catch{return ''}})()):'';
 const allDirectRows=(direct?.conversations||[]).filter(c=>c.conversations?.kind==='direct');
 const directRows=allDirectRows.filter(c=>!c.preference?.archived);
 const archivedCount=allDirectRows.length-directRows.length;
 const directPreviews=buildPalaceDirectPreviews(direct?.messages,{formatTime:dateOf,isGif:body=>Boolean(parsePalaceGif(body))});
 const groupRows=groupData.groups.filter(g=>palaceChatMatchesGroup(g,search)&&(!unreadOnly||palaceChatUnreadGroup(g)));
 const visibleDirect=filterPalaceDirectInbox(allDirectRows,search,showArchived?'archived':starredOnly?'starred':unreadOnly?'unread':'all',directPreviews);
 const messageMatches=findPalaceChatMessages(messages,messageSearch);
 const sharedMedia=collectPalaceSharedMedia(messages,body=>Boolean(parsePalaceGif(body)));
 const filteredSharedMedia=groupPalaceSharedMedia(sharedMedia,mediaFilter);
 const directUnread=directRows.filter(c=>c.unread&&!c.preference?.muted).length;
 const groupUnread=groupData.groups.filter(g=>!g.muted&&palaceChatUnreadGroup(g)).length;
 const unread=directUnread+groupUnread+groupData.invitations.length;
 const openedRoomName=tab==='direct'?nameOf(activeDirect?.correspondent):activeGroup?.title;
 const otherUserId=activeDirect?.correspondent?.id;
 useEffect(()=>{
  if(tab!=='direct'||!otherUserId){setBoundary({muted:false,blocked:false});return}
  let current=true;
  getMemberBoundary(userId,otherUserId).then(row=>{if(current)setBoundary({muted:!!row.muted,blocked:!!row.blocked})}).catch(()=>{if(current)setBoundary({muted:false,blocked:false})});
  return()=>{current=false};
 },[userId,tab,otherUserId]);
 useEffect(()=>{
  if(!PALACE_CHAT_V3_ENABLED||!open||!roomId||!reactionMessageIds){setReactionRows({roomId:'',rows:[]});return}
  let alive=true;
  getPalaceReactions(tab,reactionMessageIds.split(',')).then(rows=>{
   if(alive)setReactionRows({roomId,rows});
  }).catch(e=>{if(alive)setError('Reactions could not be loaded. '+errorText(e))});
  return()=>{alive=false};
 },[open,roomId,tab,reactionMessageIds,reactionRefresh]);
 useEffect(()=>{if(!photoFile){setPhotoPreview('');return}
  const preview=URL.createObjectURL(photoFile);setPhotoPreview(preview);
  return()=>URL.revokeObjectURL(preview);
 },[photoFile]);
 useEffect(()=>{setPhotoFile(null);setEditingMessage(null);setGifOpen(false);setSearchWithinThread(false);setMessageSearch('');setShowSharedMedia(false);setConversationOptionsOpen(false);setMediaFilter('all');setShowCirclePrompts(false);setSafetyOpen(false);setReportReason('');setReportedGroupMessage(null)},[roomId,tab]);
 useEffect(()=>()=>{if(holdRef.current?.timer)window.clearTimeout(holdRef.current.timer)},[]);
 useEffect(()=>{
  if(!actionMenu)return;
  const onKey=e=>{if(e.key==='Escape')setActionMenu(null)};
  document.addEventListener('keydown',onKey);
  const timer=window.setTimeout(()=>actionMenuRef.current?.querySelector('[role="menuitem"]')?.focus(),0);
  return()=>{document.removeEventListener('keydown',onKey);window.clearTimeout(timer)};
 },[actionMenu]);

 useEffect(()=>{setOpen(Boolean(workspace));setThreadOpen(Boolean(initialRoom?.roomId));setTab(initialRoom?.tab==='groups'?'groups':'direct');setLoadingDirect(true);setDirect(null);setGroupData({groups:[],invitations:[]});setSelectedDirect(initialRoom?.tab==='direct'?initialRoom.roomId||'':'');setSelectedGroup(initialRoom?.tab==='groups'?initialRoom.roomId||'':'');setGroupMessages({chatId:'',items:[]});setDirectHistory({roomId:'',items:[],hasOlder:false,loading:false});setNewWhileAway(false);setLiveStatus('polling');lastAcknowledgedRef.current={roomId:'',messageId:''};setReplyTarget(null);setStorySharing(false);setShowCirclePrompts(false);setPinnedPreview({chatId:'',messageId:'',message:null});setDrafts({});setError('');setNotice('');setCreating(false);setManaging(false);setSearch('');setUnreadOnly(false);setStarredOnly(false);setShowArchived(false);setMessageSearch('');setSearchWithinThread(false);setShowSharedMedia(false);setMediaFilter('all');setHistoryLoading(false);setHasOlder(false);historyScrollRef.current=null;directScrollRef.current=null;exhaustedHistoryRef.current.clear()},[userId,workspace]);
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
   }else{setDirect(previous=>previous);setError(errorText(letters.reason))}
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
 // Load selected direct thread independently from its limited inbox preview.
 useEffect(()=>{
  if(!open||tab!=='direct'||!selectedDirect){setDirectHistory({roomId:'',items:[],hasOlder:false,loading:false});return}
  let alive=true;const id=selectedDirect;
  setDirectHistory({roomId:id,items:[],hasOlder:false,loading:true});
  getDirectConversationMessages(userId,id,DIRECT_HISTORY_PAGE_SIZE).then(rows=>{
   if(alive&&selectedDirectRef.current===id)
    setDirectHistory({roomId:id,items:rows,hasOlder:rows.length===DIRECT_HISTORY_PAGE_SIZE,loading:false});
  }).catch(e=>{
   if(alive&&selectedDirectRef.current===id){setDirectHistory({roomId:id,items:[],hasOlder:false,loading:false});setError('Earlier direct messages could not be loaded. '+errorText(e))}
  });
  return()=>{alive=false};
 },[open,tab,selectedDirect,userId]);
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
  if(!open||!roomId||!threadOpen)return;
  scrollPinned.current=true;setNewWhileAway(false);
  if(tab==='direct'&&activeDirect?.unread){
   setConversationPreference(userId,roomId,{...{starred:!!activeDirect.preference?.starred,archived:false,muted:!!activeDirect.preference?.muted},last_read_at:new Date().toISOString()}).then(()=>setDirect(d=>d?({...d,conversations:d.conversations.map(c=>c.conversation_id===roomId?{...c,unread:false}:c)}):d)).catch(()=>{});
  }
 },[open,tab,roomId,userId,threadOpen]);
 useEffect(()=>{
  const el=messageRef.current;
  if(!el||!open||!roomId||!threadOpen)return;
  if(scrollPinned.current){
   el.scrollTop=el.scrollHeight;
   setNewWhileAway(false);
   if(tab==='groups'&&latestMessageId)acknowledgeVisibleGroupMessage();
   else if(tab==='direct'&&activeDirect?.unread&&latestMessageId)acknowledgeVisibleDirectMessage();
  }else if(latestMessageId)setNewWhileAway(true);
 },[latestMessageId,roomId,tab,open,threadOpen]);
 useLayoutEffect(()=>{
  const anchor=historyScrollRef.current;
  if(!anchor||anchor.chatId!==groupMessages.chatId)return;
  const el=messageRef.current;
  if(!el)return;
  el.scrollTop=Math.max(0,el.scrollHeight-anchor.height+anchor.top);
  historyScrollRef.current=null;
 },[groupMessages]);
 useLayoutEffect(()=>{
  const anchor=directScrollRef.current;
  if(!anchor||anchor.roomId!==directHistory.roomId)return;
  const el=messageRef.current;if(!el)return;
  el.scrollTop=Math.max(0,el.scrollHeight-anchor.height+anchor.top);
  directScrollRef.current=null;
 },[directHistory]);
 useEffect(()=>{const update=()=>setQuiet(document.body.classList.contains('reader-focus-mode')||document.body.classList.contains('writer-focus-mode'));update();const obs=new MutationObserver(update);obs.observe(document.body,{attributes:true,attributeFilter:['class']});return()=>obs.disconnect()},[]);
 useEffect(()=>{const handle=e=>{if(e.key!=='Escape'||!open)return;if(actionMenu){setActionMenu(null)}else if(conversationOptionsOpen){setConversationOptionsOpen(false);conversationOptionsRef.current?.querySelector('button')?.focus()}else if(creating){setCreating(false)}else if(managing){setManaging(false)}else if(threadOpen){setThreadOpen(false)}else if(!workspace)setOpen(false)};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle)},[open,creating,managing,threadOpen,actionMenu,conversationOptionsOpen,workspace]);
 useEffect(()=>{if(!threadOpen||!open)setConversationOptionsOpen(false)},[threadOpen,open]);
 useEffect(()=>{
  if(!conversationOptionsOpen)return;
  const dismiss=e=>{if(!conversationOptionsRef.current?.contains(e.target))setConversationOptionsOpen(false)};
  document.addEventListener('pointerdown',dismiss);
  return()=>document.removeEventListener('pointerdown',dismiss);
 },[conversationOptionsOpen]);
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
 async function loadOlderDirectMessages(){
  if(tab!=='direct'||!roomId||directHistory.loading||!directHistory.hasOlder||!messages.length)return;
  const id=roomId,cursor=oldestPalaceGroupMessage(messages);if(!cursor)return;
  const el=messageRef.current;
  if(el)directScrollRef.current={roomId:id,height:el.scrollHeight,top:el.scrollTop};
  scrollPinned.current=false;
  setDirectHistory(d=>d.roomId===id?{...d,loading:true}:d);
  setError('');
  try{
   const rows=await getDirectConversationMessages(userId,id,DIRECT_HISTORY_PAGE_SIZE,cursor);
   if(selectedDirectRef.current!==id)return;
   setDirectHistory(d=>d.roomId===id?{roomId:id,items:mergePalaceGroupMessages(d.items,rows),hasOlder:rows.length===DIRECT_HISTORY_PAGE_SIZE,loading:false}:d);
   if(!rows.length)directScrollRef.current=null;
  }catch(e){
   if(selectedDirectRef.current===id){directScrollRef.current=null;setDirectHistory(d=>d.roomId===id?{...d,loading:false}:d);setError('Earlier messages could not be loaded. '+errorText(e))}
  }
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
  const sentRoom=roomId,sentKind=tab;
  if(!sentRoom||busy||(sentKind==='direct'&&boundary.blocked))return;
  setBusy(true);setError('');setNotice('Sending GIF…');
  try{
   if(sentKind==='groups')await sendPalaceGroupMessage(roomId,userId,body,replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{});
   else await sendLetter(userId,roomId,body);
  }catch(e){setError('GIF not confirmed. '+errorText(e));setNotice('');setBusy(false);return}
  setGifOpen(false);setReplyTarget(null);scrollPinned.current=true;setNotice('GIF sent.');
  try{
   if(sentKind==='groups'){
    const fresh=await getPalaceGroupMessages(sentRoom);
    setGroupMessages(previous=>previous.chatId===sentRoom?{chatId:sentRoom,items:mergePalaceGroupMessages(previous.items,fresh)}:previous);
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else setDirect(await getLetters(userId));
  }catch{
   setNotice('GIF sent. Conversation sync is pending; avoid sending it again.');
   setRefreshToken(v=>v+1);
  }finally{setBusy(false)}
 }
 async function sendPhoto(e){
  e.preventDefault();
  const sentRoom=roomId,sentKind=tab,sentDraftKey=draftsKey,file=photoFile,caption=currentDraft.trim();
  if(!sentRoom||!file||busy||(sentKind==='direct'&&boundary.blocked))return;
  setBusy(true);setError('');setNotice('Sending photo…');
  let path='',sent=false;
  try{
   path=await uploadPalaceChatPhoto({kind:sentKind==='groups'?'group':'direct',roomId:sentRoom,userId,file});
   if(sentKind==='groups')await sendPalaceGroupPhoto(roomId,userId,path,caption,replyTarget?.chatId===roomId?{replyToId:replyTarget.id}:{});
   else await sendLetterPhoto(userId,roomId,path,caption);
   sent=true;
  }catch(e){
   if(path&&!sent)await discardPalaceChatPhoto(path).catch(()=>{});
   setError('Photo not confirmed. Your caption draft is preserved. '+errorText(e));
   setNotice('');setBusy(false);return;
  }
  // The attachment message was confirmed; never retry it due to a refresh error.
  setPhotoFile(null);
  setDrafts(previous=>({...previous,[sentDraftKey]:''}));
  try{localStorage.removeItem(sentDraftKey)}catch{}
  setReplyTarget(null);
  if(photoInputRef.current)photoInputRef.current.value='';
  scrollPinned.current=true;setNotice('Photo sent.');
  try{
   if(sentKind==='groups'){
    const fresh=await getPalaceGroupMessages(sentRoom);
    setGroupMessages(previous=>previous.chatId===sentRoom?{chatId:sentRoom,items:mergePalaceGroupMessages(previous.items,fresh)}:previous);
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else setDirect(await getLetters(userId));
  }catch{
   setNotice('Photo sent. Conversation sync is pending; avoid sending it again.');
   setRefreshToken(v=>v+1);
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
  }else if(action==='reply'&&tab==='direct'&&PALACE_CHAT_V3_ENABLED){
   setReplyTarget({id:message.id,body:message.body,chatId:roomId});
   window.requestAnimationFrame(()=>composerRef.current?.focus());
  }else if(action==='quote'&&tab==='direct'){
   setDraft(makePalaceDirectQuoteDraft(message,message.sender_id===userId?'you':openedRoomName,currentDraft));
   setNotice('Quotation added to your draft. This is a text quote, not a linked reply.');
   window.requestAnimationFrame(()=>composerRef.current?.focus());
  }else if(action==='report'&&message.sender_id!==userId){
   setReportReason('');if(tab==='direct')setSafetyOpen(true);else setReportedGroupMessage(message);
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
  const text=currentDraft.trim(),sentRoomId=roomId,sentKind=tab,sentDraftKey=draftsKey;
  if(!sentRoomId||!text||busy||(sentKind==='direct'&&boundary.blocked))return;
  setBusy(true);setError('');setNotice('Sending your message…');
  try{
   if(sentKind==='groups')await sendPalaceGroupMessage(sentRoomId,userId,text,replyTarget?.chatId===sentRoomId?{replyToId:replyTarget.id}:{});
   else if(PALACE_CHAT_V3_ENABLED)await sendLetter(userId,sentRoomId,text,replyTarget?.chatId===sentRoomId?{replyToId:replyTarget.id}:{});
   else await sendLetter(userId,sentRoomId,text);
  }catch(e){
   setNotice('');
   setError('Message not confirmed. Your draft is preserved. '+errorText(e));
   setBusy(false);
   return;
  }
  // The write succeeded: clear only the draft that was actually sent.
  // A separate refresh failure must never invite the member to send it twice.
  setDrafts(p=>({...p,[sentDraftKey]:''}));
  try{localStorage.removeItem(sentDraftKey)}catch{}
  setReplyTarget(null);scrollPinned.current=true;setNotice('Message sent.');
  try{
   if(sentKind==='groups'){
    await markPalaceGroupRead(sentRoomId,userId).catch(()=>{});
    const fresh=await getPalaceGroupMessages(sentRoomId);
    setGroupMessages(previous=>previous.chatId===sentRoomId?{chatId:sentRoomId,items:mergePalaceGroupMessages(previous.items,fresh)}:previous);
    setGroupData(await getPalaceGroupChatOverview(userId));
   }else setDirect(await getLetters(userId));
  }catch{
   setNotice('Message sent. The conversation is syncing; use Refresh if it does not appear.');
   setRefreshToken(n=>n+1);
  }finally{setBusy(false)}
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
 async function reactToMessage(messageId,key,current){
  if(!PALACE_CHAT_V3_ENABLED||busy||!roomId)return;
  setBusy(true);setError('');
  try{await changePalaceReaction(tab,messageId,userId,key,current);setReactionRefresh(v=>v+1)}
  catch(e){setError('Reaction was not saved. '+errorText(e))}
  finally{setBusy(false)}
 }
 async function updateSafetyBoundary(blocked){
  if(!otherUserId||busy)return;
  if(blocked&&!window.confirm('Block this member? New contact will be restricted, and you can unblock them later.'))return;
  const prior=boundary;setBusy(true);setError('');
  try{
   const saved=await setMemberBoundary(userId,otherUserId,{muted:!!prior.muted,blocked});
   setBoundary({muted:!!saved.muted,blocked:!!saved.blocked});
   setNotice(blocked?'Member blocked. You can unblock them here.':'Member unblocked.');
  }catch(e){setError('Your safety preference could not be saved. '+errorText(e))}
  finally{setBusy(false)}
 }
 async function submitGroupReport(e){
  e.preventDefault();
  if(!reportedGroupMessage||!reportReason.trim()||busy)return;
  setBusy(true);setError('');
  try{
   await submitCommunityReport(userId,'member',reportedGroupMessage.sender_id,reportReason.trim().slice(0,2000),{
    chat_id:roomId,message_id:reportedGroupMessage.id,context:'private_group_message'
   });
   setNotice('Group-message report submitted to Palace moderators.');
   setReportReason('');setReportedGroupMessage(null);
  }catch(e){setError('The report was not submitted. '+errorText(e))}
  finally{setBusy(false)}
 }
 async function submitDirectReport(e){
  e.preventDefault();
  if(!otherUserId||!roomId||!reportReason.trim()||busy)return;
  setBusy(true);setError('');
  try{
   await reportConversation(userId,roomId,otherUserId,reportReason.trim().slice(0,2000));
   setNotice('Report submitted to Palace moderators for review.');setReportReason('');setSafetyOpen(false);
  }catch(e){setError('The report was not submitted. '+errorText(e))}
  finally{setBusy(false)}
 }
 async function updateDirectPreference(conversationId,patch,success){
  if(busy)return;
  const target=allDirectRows.find(c=>c.conversation_id===conversationId);
  if(!target)return;
  const previous=target.preference||{};
  const update={
   starred:!!previous.starred,muted:!!previous.muted,archived:!!previous.archived,
   ...(previous.last_read_at?{last_read_at:previous.last_read_at}:{}),
   ...patch
  };
  setBusy(true);setError('');
  try{
   const saved=await setConversationPreference(userId,conversationId,update);
   setDirect(current=>current?{...current,conversations:current.conversations.map(c=>c.conversation_id===conversationId?{...c,preference:{...previous,...update,...saved}}:c)}:current);
   if(patch.archived===true){setThreadOpen(false);setSelectedDirect('');setShowArchived(false)}
   setNotice(success);
  }catch(e){setError(errorText(e))}
  finally{setBusy(false)}
 }
 async function toggleFavorite(){
  if(!activeDirect)return;
  await updateDirectPreference(activeDirect.conversation_id,{starred:!activeDirect.preference?.starred},activeDirect.preference?.starred?'Removed from favourites.':'Added to favourites.');
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
 const previewDirect=c=>directPreviews.get(c.conversation_id)||{text:'Start your conversation',time:''};
 if(quiet&&!open)return null;
 return <div data-chat-type={tab} data-circle-colour={tab==='groups'?(activeGroup?.colorKey||'moonlit'):'moonlit'} className={'palace-chat-dock palace-chat-v2'+(workspace?' is-workspace':'')+(open?' is-open':'')+(open&&threadOpen?' is-thread-open':'')+(open&&!threadOpen&&!creating?' is-inbox-empty':'')+(chatPaused?' is-quiet':'')}>
  {!open?<button type="button" className="palace-chat-launch" aria-label={'Open Palace chat'+(unread?' · '+unread+' new items':'')} aria-expanded={false} onClick={()=>{setActionMenu(null);setThreadOpen(false);setOpen(true)}}><span aria-hidden="true">✉</span><span>Chat</span>{unread>0&&<b>{unread>99?'99+':unread}</b>}</button>:
  <section className="palace-chat-panel" aria-label="Palace Chat" role="region">
   <header className="palace-chat-heading"><div className="palace-chat-brand">{!workspace&&<button type="button" className="palace-chat-mobile-back" aria-label={threadOpen?"Back to conversations":"Close Palace Chat"} onClick={()=>{setActionMenu(null);if(threadOpen){setThreadOpen(false)}else{setOpen(false)}}}>←</button>}<span className="palace-chat-brand-mark" aria-hidden="true">✦</span><div className="palace-chat-brand-copy"><small>PRIVATE CONVERSATIONS</small><strong>{workspace?"Palace Messenger":"Palace Chat"}</strong></div></div>
    {active&&threadOpen&&<div className="palace-chat-thread-identity">
     <button type="button" className="palace-chat-header-back" aria-label="Back to inbox" onClick={()=>{setActionMenu(null);setThreadOpen(false)}}>‹</button>
     {tab==='direct'?<MemberAvatar className="palace-chat-header-avatar" profile={activeDirect?.correspondent}/>:<span className="palace-chat-header-avatar" aria-hidden="true">✧</span>}
     <span className="palace-chat-header-person"><strong>{openedRoomName}</strong><small><i aria-hidden="true" className={liveStatus==='live'?'is-live':''}/>{liveStatus==='live'?'Live updates':'Refreshes automatically'}</small></span>
     {tab==='groups'&&<button type="button" className="palace-chat-header-group-settings" aria-label="Group settings" aria-expanded={managing} onClick={()=>{setManaging(v=>!v);setIdentity({title:activeGroup.title,description:activeGroup.description||'',colorKey:activeGroup.colorKey||'moonlit'})}}>⚙</button>}
    </div>}
    <details className="palace-chat-help"><summary aria-label="How Palace Chat works" title="Chat tips and shortcuts">?</summary><div className="palace-chat-help-card"><strong>Palace Chat guide</strong><p>Choose a conversation to read and reply. Use <b>Direct</b> for one-to-one messages, or <b>Groups</b> for private circles.</p><p><b>Message options:</b> press and hold a bubble (or right-click it). You can copy, edit your own message, reply in groups, and pin messages when hosting a group.</p><p><b>Writing:</b> Ctrl/⌘ + Enter sends; Enter starts a new line. Use Emoji, GIF or Photo beside your message.</p><small>Messages stay within the conversation you open.</small></div></details>
     <div className="palace-chat-header-actions">
     {active&&threadOpen&&<div className="palace-chat-more-wrap" ref={conversationOptionsRef}>
       <button type="button" className="palace-chat-more-trigger" aria-label="More conversation options" title="Conversation options" aria-expanded={conversationOptionsOpen} aria-haspopup="true" onClick={()=>setConversationOptionsOpen(v=>!v)}><span aria-hidden="true">⋯</span></button>
       {conversationOptionsOpen&&<div className="palace-chat-options-dropdown" role="group" aria-label="Conversation tools">
         <small className="palace-chat-options-label">EXPLORE</small>
         <button type="button" aria-pressed={searchWithinThread} aria-label={searchWithinThread?"Close message search":"Search messages in this conversation"} onClick={()=>{setSearchWithinThread(v=>!v);setShowSharedMedia(false);setMessageSearch('');setConversationOptionsOpen(false)}}><span aria-hidden="true">⌕</span>{searchWithinThread?'Close search':'Search messages'}</button>
         <button type="button" aria-pressed={showSharedMedia} aria-label={showSharedMedia?"Close shared media":"Show shared media"} onClick={()=>{setShowSharedMedia(v=>!v);setSearchWithinThread(false);setMessageSearch('');setMediaFilter('all');setConversationOptionsOpen(false)}}><span aria-hidden="true">▤</span>{showSharedMedia?'Close shared media':'Shared media'}</button>
         {tab==='direct'&&activeDirect&&<>
           <div className="palace-chat-options-divider"/>
           <small className="palace-chat-options-label">CONVERSATION</small>
           <button type="button" disabled={busy} aria-pressed={!!activeDirect.preference?.starred} aria-label={activeDirect.preference?.starred?'Remove conversation from favourites':'Add conversation to favourites'} onClick={()=>{setConversationOptionsOpen(false);toggleFavorite()}}><span aria-hidden="true">{activeDirect.preference?.starred?'★':'☆'}</span>{activeDirect.preference?.starred?'Remove favourite':'Add to favourites'}</button>
           <button type="button" disabled={busy} aria-pressed={!!activeDirect.preference?.muted} aria-label={activeDirect.preference?.muted?'Unmute this conversation':'Mute this conversation'} onClick={()=>{setConversationOptionsOpen(false);updateDirectPreference(activeDirect.conversation_id,{muted:!activeDirect.preference?.muted},activeDirect.preference?.muted?'Conversation notifications unmuted.':'Conversation muted.')}}><span aria-hidden="true">◌</span>{activeDirect.preference?.muted?'Unmute':'Mute'}</button>
           <button type="button" disabled={busy} aria-label="Archive this conversation" onClick={()=>{setConversationOptionsOpen(false);updateDirectPreference(activeDirect.conversation_id,{archived:true},'Conversation archived. Restore it from Archived.')}}><span aria-hidden="true">▣</span>Archive</button>
           <button type="button" aria-expanded={safetyOpen} aria-label="Conversation safety tools" onClick={()=>{setSafetyOpen(v=>!v);setConversationOptionsOpen(false)}}><span aria-hidden="true">⚑</span>Safety & reporting</button>
         </>}
         {!workspace&&<>
           <div className="palace-chat-options-divider"/>
           <Link to="/chat" state={{palaceChat:{tab,roomId:threadOpen?roomId:null}}} aria-label="Switch to full Palace Messenger" onClick={()=>setConversationOptionsOpen(false)}><span aria-hidden="true">⤢</span>Full Messenger</Link>
         </>}
       </div>}
     </div>}{!workspace&&<Link to="/chat" state={{palaceChat:{tab,roomId:threadOpen?roomId:null}}} className="palace-chat-expand" aria-label="Open full Palace Messenger" title="Open full Messenger">⤢</Link>}<button type="button" onClick={()=>setChatPaused(v=>!v)} aria-pressed={chatPaused} title="Compact chat launcher when minimized" aria-label={chatPaused?'Turn off quiet launcher':'Use quiet launcher'}>☾</button>{workspace?<Link className="palace-chat-close-workspace" to="/" aria-label="Return to Palace home">✕</Link>:<button type="button" onClick={()=>{setActionMenu(null);setOpen(false)}} aria-label="Minimize Palace chat">−</button>}</div></header>
   <nav className="palace-chat-tabs" aria-label="Chat type">
    <button type="button" aria-pressed={tab==='direct'} onClick={()=>{setActionMenu(null);setThreadOpen(false);setTab('direct');setSearch('');setUnreadOnly(false);setStarredOnly(false);setShowArchived(false);setCreating(false);setManaging(false);setError('')}}>✉ Direct {directUnread>0&&<span>{directUnread}</span>}</button>
    <button type="button" aria-pressed={tab==='groups'} onClick={()=>{setActionMenu(null);setThreadOpen(false);setTab('groups');setSearch('');setUnreadOnly(false);setStarredOnly(false);setShowArchived(false);setCreating(false);setManaging(false);setError('')}}>♧ Groups {(groupUnread+groupData.invitations.length)>0&&<span>{groupUnread+groupData.invitations.length}</span>}</button>
   </nav>
   <details className={"palace-chat-advanced-controls"+(tab==='direct'&&directRows.length===1&&archivedCount===0&&!search&&!unreadOnly&&!starredOnly&&!showArchived?' is-quiet-single':'')}><summary aria-label="Search and filter conversations">⋯ Search & filters</summary><div className="palace-chat-tools"><input aria-label="Find a conversation" placeholder={tab==='groups'?'Find a circle or member…':'Search direct conversations…'} value={search} onChange={e=>setSearch(e.target.value)}/>
    {tab==='direct'?<Link to="/letters" onClick={()=>setOpen(false)}>All letters ↗</Link>:<button type="button" onClick={()=>{setCreating(v=>!v);setManaging(false);setMemberResults([]);setMemberSearch('');setError('')}}>{creating?'Cancel':'＋ Group'}</button>}
   </div>
   {!creating&&<div className="palace-chat-inbox-refine" aria-label="Conversation filters">
    <span>{tab==='groups'?groupData.groups.length+' private circles':loadingDirect&&!direct?'Loading direct conversations…':error&&!direct?'Could not load direct conversations':directRows.length+' direct conversations'}</span>
    <button type="button" aria-pressed={unreadOnly} onClick={()=>{setUnreadOnly(v=>!v);setStarredOnly(false)}}>{unreadOnly?'✓ Unread only':'Unread only'}</button>
    {tab==='direct'&&<button type="button" aria-pressed={starredOnly} onClick={()=>{setStarredOnly(v=>!v);setUnreadOnly(false)}}>{starredOnly?'★ Favourites':'☆ Favourites'}</button>}
    {tab==='direct'&&<button type="button" aria-pressed={showArchived} onClick={()=>{setShowArchived(v=>!v);setThreadOpen(false);setUnreadOnly(false);setStarredOnly(false)}}>{showArchived?'✓ Archived':`Archived (${archivedCount})`}</button>}
    {(search||unreadOnly||starredOnly||showArchived)&&<button type="button" className="palace-chat-clear-filter" onClick={()=>{setSearch('');setUnreadOnly(false);setStarredOnly(false);setShowArchived(false)}}>Clear filters</button>}
   </div>}
   </details>
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
     {tab==='direct'?visibleDirect.map(c=>showArchived?
      <div className="palace-chat-archived-row" key={c.conversation_id}><MemberAvatar className="palace-chat-list-avatar" profile={c.correspondent}/><span>{nameOf(c.correspondent)}</span><button type="button" disabled={busy} aria-label={'Restore archived conversation with '+nameOf(c.correspondent)} onClick={()=>updateDirectPreference(c.conversation_id,{archived:false},'Conversation restored to Direct messages.')}>Restore</button></div>:
      <button type="button" key={c.conversation_id} aria-label={nameOf(c.correspondent)} onClick={()=>{setActionMenu(null);setSelectedDirect(c.conversation_id);setThreadOpen(true);setManaging(false)}} aria-pressed={activeDirect?.conversation_id===c.conversation_id}>
      <MemberAvatar className="palace-chat-list-avatar" profile={c.correspondent}/>
      <span className="palace-chat-list-details"><span className="palace-chat-list-name">{nameOf(c.correspondent)}</span><small className="palace-chat-list-preview">{previewDirect(c).text}</small>{c.preference?.starred&&<small className="palace-chat-favourite-indicator">★ Favourite</small>}{c.preference?.muted&&<small className="palace-chat-favourite-indicator">◌ Muted</small>}</span>
      <span className="palace-chat-list-meta">{previewDirect(c).time&&<small>{previewDirect(c).time}</small>}{c.unread&&<span className="palace-chat-unread-spark" aria-label="Unread messages">●</span>}</span>
     </button>):
      groupRows.map(g=><button type="button" key={g.id} aria-label={g.title} onClick={()=>{setActionMenu(null);setSelectedGroup(g.id);setThreadOpen(true);setManaging(false);setIdentity({title:g.title,description:g.description||'',colorKey:g.colorKey||'moonlit'})}} aria-pressed={activeGroup?.id===g.id} title={g.description||g.title}><span className="palace-chat-room-symbol" aria-hidden="true">✧</span><span className="palace-chat-list-details"><span className="palace-chat-room-name">{g.title}</span><small className="palace-chat-list-preview">{g.description||'Private group conversation'}</small></span><span className="palace-chat-list-meta">{palaceChatUnreadGroup(g)&&<span className="palace-chat-unread-spark" aria-label="Unread messages">●</span>}{g.muted&&<span className="palace-chat-muted-symbol" title="Muted" aria-label="Muted">◌</span>}</span></button>)}
     {((tab==='groups'&&!groupRows.length)||(tab==='direct'&&!visibleDirect.length))&&(search||unreadOnly||starredOnly)&&<span className="palace-chat-filter-empty">No matching conversations. Clear filters to see your other rooms.</span>}
    </div>
    {active?<><div className="palace-chat-correspondent"><button className="palace-chat-thread-back" type="button" onClick={()=>{setActionMenu(null);setThreadOpen(false)}} aria-label="Back to conversations">← Conversations</button><div className="palace-chat-person">{tab==='direct'?<MemberAvatar className="palace-chat-person-avatar" profile={activeDirect?.correspondent}/>:<span className="palace-chat-person-avatar" aria-hidden="true">✧</span>}<div className="palace-chat-person-copy"><strong>{openedRoomName}</strong><small>{tab==='groups'?activeGroup.members.length+' members · Invitation-only group':'Private correspondence · Palace boundaries apply'}</small><small className="palace-chat-connection" role="status"><i aria-hidden="true" className={liveStatus==='live'?'is-live':''}/>{liveStatus==='live'?'Live updates':'Refreshes automatically'}</small>{tab==='groups'&&activeGroup.description&&<p className="palace-chat-circle-description">{activeGroup.description}</p>}</div></div>{tab==='groups'&&<button type="button" aria-expanded={managing} onClick={()=>{setManaging(v=>!v);setIdentity({title:activeGroup.title,description:activeGroup.description||'',colorKey:activeGroup.colorKey||'moonlit'})}}>Members & settings ⚙</button>}</div>
 {tab==='direct'&&activeDirect&&safetyOpen&&<section className="palace-chat-safety" aria-label="Private conversation safety">
  <header><strong>Safety & boundaries</strong><button type="button" onClick={()=>setSafetyOpen(false)} aria-label="Close safety tools">×</button></header>
  <p>Blocking limits contact. Reporting sends a confidential notice for moderator review. Reports do not automatically remove messages.</p>
  <button type="button" disabled={busy} aria-label={boundary.blocked?'Unblock this member':'Block this member'} onClick={()=>updateSafetyBoundary(!boundary.blocked)}>{boundary.blocked?'Unblock member':'Block member'}</button>
  <form onSubmit={submitDirectReport}><label>Report a concern<textarea aria-label="Reason for reporting this conversation" rows={3} maxLength={2000} value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Describe the message or behavior and when it happened." required/></label><button type="submit" disabled={busy||!reportReason.trim()}>Submit report</button></form>
 </section>}
 {tab==='groups'&&reportedGroupMessage&&<section className="palace-chat-safety" aria-label="Report a group message">
  <header><strong>Report this group message</strong><button type="button" aria-label="Cancel group report" onClick={()=>setReportedGroupMessage(null)}>×</button></header>
  <p>Explain the concern. A moderator will review the report; the message is not removed automatically.</p>
  <form onSubmit={submitGroupReport}><label>Reason for report<textarea aria-label="Reason for reporting group message" rows={3} maxLength={2000} required value={reportReason} onChange={e=>setReportReason(e.target.value)}/></label><button type="submit" disabled={busy||!reportReason.trim()}>Send group report</button></form>
 </section>}
 {tab==='groups'&&managing&&<section className="palace-chat-settings" aria-label="Group settings">
      <div className="palace-chat-settings-top"><strong>Members</strong><button type="button" disabled={busy} onClick={()=>mutate(()=>setPalaceGroupMuted(activeGroup.id,userId,!activeGroup.muted),activeGroup.muted?'Group unmuted.':'Group muted.')}>{activeGroup.muted?'Unmute':'Mute'}</button></div>
      <ul>{activeGroup.members.map(m=><li key={m.id}><MemberAvatar profile={m}/><span>{nameOf(m)} {m.id===activeGroup.ownerId?'· host':''}</span>{owner&&m.id!==userId&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm('Remove '+nameOf(m)+' from this group?'))mutate(()=>removePalaceGroupMember(activeGroup.id,m.id),'Member removed.')}}>Remove</button>}</li>)}</ul>
      {owner&&<><form className="palace-chat-identity-form" onSubmit={saveIdentity}><label>Group name<input value={identity.title} minLength={3} maxLength={80} onChange={e=>setIdentity(v=>({...v,title:e.target.value}))}/></label><label>Description<textarea aria-label="Group description" value={identity.description} maxLength={360} rows={2} placeholder="What brings this circle together?" onChange={e=>setIdentity(v=>({...v,description:e.target.value}))}/></label><label>Circle colour<select aria-label="Group colour" value={identity.colorKey} onChange={e=>setIdentity(v=>({...v,colorKey:e.target.value}))}>{PALACE_GROUP_COLOURS.map(item=><option value={item.key} key={item.key}>{item.label}</option>)}</select></label><button disabled={busy||identity.title.trim().length<3}>Save appearance</button></form>
       <div className="palace-chat-member-search"><input aria-label="Find a member to invite" placeholder="Add another member" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)}/><button type="button" disabled={busy||!memberSearch.trim()} onClick={searchForMembers}>Find</button></div>
       <div className="palace-chat-member-results">{memberResults.filter(p=>!activeGroup.members.some(m=>m.id===p.id)).map(p=><button type="button" key={p.id} disabled={busy} onClick={()=>inviteNew(p)}>＋ Invite {nameOf(p)}</button>)}</div></>}
      <button type="button" className="palace-chat-leave" disabled={busy} onClick={()=>{if(window.confirm('Leave '+activeGroup.title+'? You will lose access to its private messages.'))mutate(()=>leavePalaceGroupChat(activeGroup.id),'You left the group.')}}>Leave group</button>
     </section>}
     {tab==='groups'&&activeGroup.pinnedMessageId&&<div className="palace-chat-pinned" role="note"><span aria-hidden="true">✦</span><div><strong>Pinned in this circle</strong><p>{pinnedMessage?.body||'A message is pinned from an earlier part of this conversation.'}</p></div>{owner&&<button type="button" disabled={busy} aria-label="Unpin group message" onClick={()=>mutate(()=>pinPalaceGroupMessage(activeGroup.id,null),'Pin removed.')}>Unpin</button>}</div>}
     {tab==='groups'&&<div className="palace-chat-sharing-actions"><button type="button" aria-expanded={storySharing} onClick={()=>{setStorySharing(v=>!v);setShowCirclePrompts(false);setStoryResults([]);setStoryQuery('')}}>✧ {storySharing?'Close story shelf':'Share a Palace story'}</button><button type="button" aria-expanded={showCirclePrompts} onClick={()=>{setShowCirclePrompts(v=>!v);setStorySharing(false)}}>☾ {showCirclePrompts?'Close discussion ideas':'Reading Circle ideas'}</button></div>}
 {tab==='groups'&&showCirclePrompts&&<section className="palace-chat-circle-prompts" aria-label="Reading Circle discussion ideas">
  <header><strong>Begin a literary conversation</strong><small>Choose a question to edit in your message. Nothing is sent automatically.</small></header>
  <div>{PALACE_READING_CIRCLE_PROMPTS.map(prompt=><button type="button" key={prompt.id} onClick={()=>{setDraft(makePalaceCircleDraft(prompt.text,currentDraft));setShowCirclePrompts(false);composerRef.current?.focus()}}><small>{prompt.category}</small><span>{prompt.text}</span></button>)}</div>
  <h4>Guided circle sessions</h4>
  <div>{PALACE_READING_CIRCLE_KITS.map(kit=><button type="button" key={kit.id} aria-label={'Start '+kit.name+' session draft'} onClick={()=>{setDraft(makePalaceCircleDraft(kit.text,currentDraft));setShowCirclePrompts(false);composerRef.current?.focus()}}><small>{kit.name}</small><span>{kit.label}</span></button>)}</div>
  <small>Every session idea stays editable and unsent until you press Send.</small>
 </section>}
     {tab==='groups'&&storySharing&&<section className="palace-chat-share-shelf" aria-label="Share a published Palace story"><form onSubmit={findStories}><input aria-label="Find a published story to share" placeholder="Search published story titles…" value={storyQuery} onChange={e=>setStoryQuery(e.target.value)} minLength={2} maxLength={90}/><button disabled={busy||storyQuery.trim().length<2}>Find</button></form><div>{storyResults.map(w=><button type="button" key={w.id} disabled={busy} onClick={()=>shareStory(w)}><strong>{w.title}</strong><small>Share with this circle ↗</small></button>)}</div><small>Only published Palace stories can be shared.</small></section>}
     {tab==='groups'&&hasOlder&&messages.length>0&&<div className="palace-chat-earlier"><button type="button" onClick={loadOlderGroupMessages} disabled={historyLoading} aria-label="Load earlier group messages">{historyLoading?'Gathering earlier messages…':'↑ Earlier messages'}</button></div>}
     {active&&threadOpen&&showSharedMedia&&<section className="palace-chat-shared-media" aria-label="Shared media in this conversation">
       <header><div><strong>Shared in this conversation</strong><small>{sharedMedia.length} items from currently loaded messages</small></div><button type="button" aria-label="Close shared media panel" onClick={()=>setShowSharedMedia(false)}>×</button></header>
       <nav aria-label="Filter shared media">{[['all','Everything'],['photo','Photos'],['gif','GIFs'],['story','Stories']].map(([value,label])=><button type="button" key={value} aria-pressed={mediaFilter===value} onClick={()=>setMediaFilter(value)}>{label}</button>)}</nav>
       {filteredSharedMedia.length?<div className="palace-chat-media-grid">{filteredSharedMedia.map(item=><div className="palace-chat-media-item" key={item.id}>
        <div className="palace-chat-media-preview">{item.kind==='photo'?<PalaceChatPhoto path={item.path}/>:item.kind==='gif'?<PalaceChatGif body={item.body}/>:<span aria-hidden="true">✧</span>}</div>
        {item.kind==='story'&&<Link to={'/work/'+encodeURIComponent(item.slug)} aria-label={'Read shared story '+item.title}>{item.title}</Link>}
        <button type="button" onClick={()=>{setShowSharedMedia(false);jumpToQuotedMessage(item.messageId||item.id)}} aria-label={'Find '+item.kind+' in conversation'}>Find message ↗</button>
       </div>)}</div>:<p>No {mediaFilter==='all'?'shared items':mediaFilter==='photo'?'photos':mediaFilter==='gif'?'GIFs':'stories'} in the messages loaded here.</p>}
       {sharedMedia.length>filteredSharedMedia.length&&<small>Showing the most recent {filteredSharedMedia.length} items. Load earlier messages to see older items.</small>}
      </section>}
     {active&&threadOpen&&searchWithinThread&&<div className="palace-chat-message-search"><label htmlFor="palace-chat-inthread-search">Find in loaded messages</label><input id="palace-chat-inthread-search" type="search" value={messageSearch} onChange={e=>setMessageSearch(e.target.value)} placeholder="Search this conversation"/><span role="status">{messageSearch.trim()?messageMatches.length+' matching loaded '+(messageMatches.length===1?'message':'messages'):'Only messages currently loaded are searched'}</span>{messageMatches.slice(0,8).map(m=><button type="button" key={m.id} onClick={()=>jumpToQuotedMessage(m.id)}>{String(m.body||'Message').slice(0,70)}</button>)}</div>}
     <div className="palace-chat-messages" ref={messageRef} role="log" aria-label="Conversation messages" aria-live="polite" onScroll={e=>{const el=e.currentTarget;const pinned=el.scrollHeight-el.scrollTop-el.clientHeight<80;scrollPinned.current=pinned;if(pinned){setNewWhileAway(false);if(tab==='groups')acknowledgeVisibleGroupMessage();else acknowledgeVisibleDirectMessage()}}}>
      {tab==='direct'&&directHistory.roomId===roomId&&directHistory.hasOlder&&messages.length>0&&<div className="palace-chat-earlier"><button type="button" onClick={loadOlderDirectMessages} disabled={directHistory.loading} aria-label="Load earlier direct messages">{directHistory.loading?'Gathering earlier letters…':'↑ Earlier direct messages'}</button></div>}
      {messages.length?messages.map((m,index)=><React.Fragment key={m.id}>{(index===0||new Date(messages[index-1].created_at).toDateString()!==new Date(m.created_at).toDateString())&&<div className="palace-chat-date-divider" role="separator"><span>{new Date(m.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span></div>}<div data-chat-message={m.id}
        tabIndex={0} role="group" aria-label={'Message from '+(m.sender_id===userId?'you':tab==='groups'?nameOf(m.profiles):openedRoomName)+'. Press and hold for actions.'}
        onPointerDown={e=>beginMessageHold(e,m)}
        onPointerMove={moveMessageHold} onPointerUp={clearMessageHold} onPointerCancel={clearMessageHold} onPointerLeave={clearMessageHold}
        onContextMenu={e=>{e.preventDefault();openMessageActions(m,e.currentTarget,e.clientX,e.clientY)}}
        onKeyDown={e=>{if(e.target!==e.currentTarget)return;if((e.shiftKey&&e.key==='F10')||e.key==='ContextMenu'||e.key==='Enter'||e.key===' '){e.preventDefault();openMessageActions(m,e.currentTarget)} }}
        className={'palace-chat-bubble'+(m.sender_id===userId?' mine':'')+(actionMenu?.message.id===m.id?' has-active-actions':'')}>
       <div className="palace-chat-sender"><MemberAvatar className="palace-chat-message-avatar" memberId={m.sender_id} profile={tab==='groups'?(m.profiles||activeGroup?.members.find(p=>p.id===m.sender_id)):m.sender_id===userId?selfProfile:activeDirect?.correspondent}/>{tab==='groups'&&m.sender_id!==userId&&<strong>{nameOf(m.profiles)}</strong>}</div>
       {(tab==='groups'||PALACE_CHAT_V3_ENABLED)&&m.reply_to_id&&<button type="button" className="palace-chat-reply-quote" onClick={()=>jumpToQuotedMessage(m.reply_to_id)} aria-label="Jump to replied message"><small>↩ Reply to {nameOf(messages.find(item=>item.id===m.reply_to_id)?.profiles)}</small><p>{messages.find(item=>item.id===m.reply_to_id)?.body?.slice(0,145)||'An earlier group message'}</p></button>}
       {editingMessage===m.id?
        <form className="palace-chat-edit-form" onSubmit={saveEditedMessage}>
         <textarea aria-label="Edit your message" autoFocus value={editBody} maxLength={3000} onChange={e=>setEditBody(e.target.value)} rows={3}/>
         <div><button type="button" onClick={()=>{setEditingMessage(null);setEditBody('')}}>Cancel</button><button disabled={busy||!editBody.trim()} type="submit">{busy?'Saving…':'Save changes'}</button></div>
        </form>:
        <><PalaceChatGif body={m.body}/>{m.media_path&&<PalaceChatPhoto path={m.media_path}/>}</>}
       {m.edited_at&&<small className="palace-chat-edited-mark" title={'Edited '+new Date(m.edited_at).toLocaleString()}>Edited</small>}
       {tab==='groups'&&m.works?.slug&&<Link className="palace-chat-shared-story" to={'/work/'+encodeURIComponent(m.works.slug)} onClick={()=>setOpen(false)}><span aria-hidden="true">✧</span><span><small>PALACE STORY</small><strong>{m.works.title}</strong></span><span aria-hidden="true">↗</span></Link>}
       <small>{dateOf(m.created_at)}</small>
       {PALACE_CHAT_V3_ENABLED&&<PalaceChatReactionBar message={m} rows={reactionRows.roomId===roomId?reactionRows.rows:[]} userId={userId} disabled={busy||(tab==='direct'&&boundary.blocked)} onReact={reactToMessage}/>}
       {/* Message actions appear only on long-press, right-click, or keyboard context menu. */}
      </div></React.Fragment>):<p className="palace-chat-empty">Nothing written here yet. Begin with a hello. ✦</p>}
     </div>
     {newWhileAway&&messages.length>0&&<button type="button" className="palace-chat-jump-latest" onClick={jumpToLatest}>New messages · Jump to latest ↓</button>}
     {(tab==='groups'||PALACE_CHAT_V3_ENABLED)&&replyTarget?.chatId===roomId&&<div className="palace-chat-replying"><span>Replying to: {replyTarget.body.slice(0,96)}{replyTarget.body.length>96?'…':''}</span><button type="button" aria-label={tab==='groups'?"Cancel group reply":"Cancel reply"} onClick={()=>setReplyTarget(null)}>×</button></div>}
     <div className="palace-chat-composer-shell"><div className="palace-chat-compose-tools"><PalaceEmojiPicker label="Palace Chat" onPick={insertChatEmoji}/><button type="button" className="palace-chat-gif-toggle" aria-expanded={gifOpen} onClick={()=>setGifOpen(v=>!v)}>🎞️ GIF</button><button type="button" className="palace-chat-photo-toggle" aria-label="Attach photo" disabled={busy} onClick={()=>photoInputRef.current?.click()}>▧ Photo</button><input ref={photoInputRef} className="palace-chat-photo-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Choose photo to send" onChange={e=>{const file=e.target.files?.[0];if(file){if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>18*1024*1024){setError('Use a JPEG, PNG, WebP or AVIF photo under 18 MB.');e.target.value='';return}setPhotoFile(file);setGifOpen(false)}}}/></div>
     {gifOpen&&<PalaceGiphyPicker busy={busy} onSend={sendGif} onClose={()=>setGifOpen(false)}/>}
     {photoFile&&<form className="palace-chat-photo-stage" onSubmit={sendPhoto}><div>{photoPreview&&<img src={photoPreview} alt="Selected photo preview"/>}<span><strong>{photoFile.name}</strong><small>Private photo · {Math.round(photoFile.size/1024)} KB · {currentDraft.trim()?'Your drafted text becomes its caption':'Add an optional caption below'}</small></span></div><footer><button type="button" onClick={()=>{setPhotoFile(null);if(photoInputRef.current)photoInputRef.current.value=''}}>Cancel</button><button type="submit" disabled={busy}>{busy?'Sending…':'Send photo ↗'}</button></footer></form>}
     {tab==='direct'&&boundary.blocked&&<p className="palace-chat-safety-blocked" role="status">You blocked this member. Unblock them in Safety to resume sending.</p>}
     <form className="palace-chat-compose" onSubmit={send}><label className="sr-only" htmlFor="palace-quick-chat-message">Your message</label><textarea ref={composerRef} id="palace-quick-chat-message" aria-label={tab==='groups'?'Write a group message':'Write a private message'} placeholder={tab==='groups'?'Write to your circle…':'Write a little note…'} rows={1} maxLength={3000} value={currentDraft} onChange={e=>setDraft(e.target.value)} onInput={e=>{const field=e.currentTarget;field.style.height='auto';field.style.height=Math.min(112,Math.max(46,field.scrollHeight))+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(currentDraft.trim())e.currentTarget.form?.requestSubmit()}}}/><button type="submit" className="palace-chat-send" disabled={busy||!currentDraft.trim()||(tab==='direct'&&boundary.blocked)}>{busy?'Sending…':<>Send <span aria-hidden="true">↗</span></>}</button></form>
     <small className="palace-chat-draft-hint">{currentDraft?'Draft kept on this device':'Ctrl/⌘ + Enter to send · Enter for a new line'}</small></div>
    </>:<div className="palace-chat-empty"><p>{tab==='groups'?'No groups yet.':loadingDirect?'Loading your private conversations…':error?'Conversations could not be loaded.':'No open direct conversations yet.'}</p><p>{tab==='groups'?'Start a private circle and invite members, or accept an invitation above.':'Begin or accept a correspondence in Palace Letters.'}</p>{tab==='direct'&&<Link to="/letters" onClick={()=>setOpen(false)}>Open Palace Letters →</Link>}{tab==='groups'&&<button type="button" onClick={()=>setCreating(true)}>＋ Create a group</button>}</div>}
   </>}
   {active&&!creating&&!threadOpen&&<div className="palace-chat-select-hint" role="status"><span className="palace-chat-empty-moon" aria-hidden="true">☾</span><strong>Your conversations await.</strong><p>Select a fellow traveler above to begin your conversation.</p></div>}
   <footer><small>{tab==='groups'?'Members-only group':'Private conversation'}{chatPaused?' · Quiet mode':''}</small>{!workspace&&<Link className="palace-chat-full-route" to="/chat" state={{palaceChat:{tab,roomId:threadOpen?roomId:null}}} aria-label="Open the full Palace Messenger page">Full Messenger ↗</Link>}{workspace?<Link className="palace-chat-mobile-close" to="/" aria-label="Exit Messenger and return home">Exit Messenger <span aria-hidden="true">×</span></Link>:<button type="button" className="palace-chat-mobile-close" aria-label="Close Palace chat" onClick={()=>{setActionMenu(null);setOpen(false)}}>Close chat <span aria-hidden="true">×</span></button>}</footer>
  </section>}
  {open&&actionMenu&&actionMenu.roomId===roomId&&createPortal(<div className="palace-chat-actions-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setActionMenu(null)}} onClick={e=>{if(e.target===e.currentTarget)setActionMenu(null)}}>
   <div ref={actionMenuRef} className="palace-chat-actions-menu" role="menu" aria-label="Message actions" style={{top:actionMenu.top,left:actionMenu.left}}>
    <small>MESSAGE OPTIONS</small>
    {tab==='groups'&&<button type="button" role="menuitem" aria-label="Reply" onClick={()=>applyMessageAction('reply')}><span aria-hidden="true">↩</span><span>Reply</span></button>}
    {tab==='direct'&&PALACE_CHAT_V3_ENABLED&&<button type="button" role="menuitem" aria-label="Reply to message" onClick={()=>applyMessageAction('reply')}><span aria-hidden="true">↩</span><span>Linked reply</span></button>}
    {tab==='direct'&&<button type="button" role="menuitem" aria-label="Quote in draft" onClick={()=>applyMessageAction('quote')}><span aria-hidden="true">↩</span><span>Quote in draft</span></button>}
    {actionMenu.message.sender_id===userId&&!parsePalaceGif(actionMenu.message.body)&&<button type="button" role="menuitem" aria-label="Edit message" onClick={()=>applyMessageAction('edit')}><span aria-hidden="true">✎</span><span>Edit message</span></button>}
    {actionMenu.message.sender_id!==userId&&<button type="button" role="menuitem" aria-label="Report message" onClick={()=>applyMessageAction('report')}><span aria-hidden="true">⚑</span><span>Report message</span></button>}
    <button type="button" role="menuitem" aria-label="Copy text" onClick={()=>applyMessageAction('copy')}><span aria-hidden="true">⧉</span><span>Copy text</span></button>
    {tab==='groups'&&owner&&<button type="button" role="menuitem" aria-label={activeGroup?.pinnedMessageId===actionMenu.message.id?'Unpin message':'Pin message'} disabled={busy} onClick={()=>applyMessageAction('pin')}><span aria-hidden="true">✧</span><span>{activeGroup?.pinnedMessageId===actionMenu.message.id?'Unpin message':'Pin message'}</span></button>}
    <button type="button" className="palace-chat-action-dismiss" role="menuitem" onClick={()=>setActionMenu(null)}>Cancel</button>
   </div>
  </div>,document.body)}
 </div>;
}
