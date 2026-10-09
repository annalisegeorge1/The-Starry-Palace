import {supabase} from './supabase';

function client(){if(!supabase)throw new Error('Palace messaging is not connected yet.');return supabase}
function result({data,error}){if(error)throw error;return data}
const cleanId=value=>typeof value==='string'?value.trim():'';

export async function getPalaceGroupChatOverview(userId){
 if(!userId)return {groups:[],invitations:[]};
 const db=client();
 const [membership,invites]=await Promise.all([
  db.from('palace_group_chat_members')
   .select('chat_id,muted,last_read_at,palace_group_chats(id,title,description,color_key,pinned_message_id,owner_id,status,created_at,last_message_at)')
   .eq('user_id',userId).is('left_at',null),
  db.from('palace_group_chat_invites')
   .select('chat_id,status,created_at,palace_group_chats(id,title,color_key,owner_id,status)')
   .eq('user_id',userId).eq('status','pending')
 ]);
 const myRows=result(membership)||[];
 const myInvites=result(invites)||[];
 const ids=myRows.map(x=>x.chat_id).filter(Boolean);
 let roster=[];
 if(ids.length){
  roster=result(await db.from('palace_group_chat_members')
   .select('chat_id,user_id,joined_at,profiles!palace_group_chat_members_user_id_fkey(id,username,display_name,avatar_url)')
   .in('chat_id',ids).is('left_at',null))||[];
 }
 const groups=myRows.filter(x=>x.palace_group_chats?.status==='active').map(x=>({
  id:x.chat_id,title:x.palace_group_chats.title,description:x.palace_group_chats.description||'',colorKey:x.palace_group_chats.color_key||'moonlit',pinnedMessageId:x.palace_group_chats.pinned_message_id||null,ownerId:x.palace_group_chats.owner_id,
  lastMessageAt:x.palace_group_chats.last_message_at,muted:x.muted,lastReadAt:x.last_read_at,
  members:roster.filter(m=>m.chat_id===x.chat_id).map(m=>({id:m.user_id,joinedAt:m.joined_at,...m.profiles}))
 }));
 return {
  groups:groups.sort((a,b)=>Date.parse(b.lastMessageAt||0)-Date.parse(a.lastMessageAt||0)),
  invitations:myInvites.filter(x=>x.palace_group_chats?.status==='active').map(x=>({
   id:x.chat_id,title:x.palace_group_chats.title,colorKey:x.palace_group_chats.color_key||'moonlit',ownerId:x.palace_group_chats.owner_id,createdAt:x.created_at
  }))
 };
}
export async function getPalaceGroupMessages(chatId,limit=100,before=null){
 if(!cleanId(chatId))return [];
 let query=client().from('palace_group_chat_messages')
  .select('id,chat_id,sender_id,body,created_at,reply_to_id,shared_work_id,profiles!palace_group_chat_messages_sender_id_fkey(id,username,display_name),works!palace_group_chat_messages_shared_work_id_fkey(id,title,slug)')
  .eq('chat_id',chatId);
 // An exclusive, server-side timestamp cursor only retrieves earlier RLS-
 // authorized messages. Never download the entire history in one request.
 if(before){
  const cursor=String(before).trim();
  if(!Number.isFinite(Date.parse(cursor)))throw new Error('Invalid conversation history position.');
  query=query.lt('created_at',cursor);
 }
 const data=result(await query.order('created_at',{ascending:false}).limit(Math.min(120,Math.max(1,limit))));
 return (data||[]).reverse();
}
export async function createPalaceGroupChat(title,userIds){
 const invitees=[...new Set((userIds||[]).filter(Boolean))];
 const id=result(await client().rpc('create_palace_group_chat',{p_title:String(title||'').trim(),p_invitees:invitees}));
 if(!id)throw new Error('The group could not be created.');
 return id;
}
export async function sendPalaceGroupMessage(chatId,userId,body,options={}){
 const text=String(body||'').trim();
 if(!text||text.length>3000)throw new Error('Write a message of up to 3,000 characters.');
 return result(await client().from('palace_group_chat_messages')
  .insert({chat_id:chatId,sender_id:userId,body:text,reply_to_id:options.replyToId||null,shared_work_id:options.sharedWorkId||null}).select('id').single());
}
export async function respondPalaceGroupInvite(id,accept){
 result(await client().rpc('respond_palace_group_invite',{p_chat:id,p_accept:!!accept}));
}
export async function invitePalaceGroupMember(id,userId){
 result(await client().rpc('invite_palace_group_member',{p_chat:id,p_user:userId}));
}
export async function removePalaceGroupMember(id,userId){
 result(await client().rpc('remove_palace_group_member',{p_chat:id,p_user:userId}));
}
export async function leavePalaceGroupChat(id){
 result(await client().rpc('leave_palace_group_chat',{p_chat:id}));
}
export async function renamePalaceGroupChat(id,title){
 result(await client().rpc('rename_palace_group_chat',{p_chat:id,p_title:String(title||'').trim()}));
}
export async function setPalaceGroupMuted(chatId,userId,muted){
 result(await client().from('palace_group_chat_members').update({muted:!!muted})
  .eq('chat_id',chatId).eq('user_id',userId));
}
export async function markPalaceGroupRead(chatId,userId){
 result(await client().from('palace_group_chat_members').update({last_read_at:new Date().toISOString()})
  .eq('chat_id',chatId).eq('user_id',userId));
}

export const PALACE_GROUP_COLOURS=[
 {key:'moonlit',label:'Moonlit violet'},
 {key:'lilac',label:'Morning lilac'},
 {key:'glacier',label:'Glacier blue'},
 {key:'tide',label:'Moonlit tide'},
 {key:'orchid',label:'Orchid dusk'},
 {key:'emerald',label:'Emerald court'},
 {key:'slate',label:'Silver slate'},
 {key:'aurora',label:'Aurora sky'}
];
export async function setPalaceGroupIdentity(chatId,{title,description,colorKey}){
 result(await client().rpc('set_palace_group_identity',{
  p_chat:chatId,p_title:String(title||'').trim(),
  p_description:String(description||'').trim(),p_color_key:colorKey||'moonlit'
 }));
}
export async function pinPalaceGroupMessage(chatId,messageId=null){
 result(await client().rpc('pin_palace_group_message',{p_chat:chatId,p_message:messageId}));
}
export async function getPinnedPalaceGroupMessage(chatId,messageId){
 if(!chatId||!messageId)return null;
 return result(await client().from('palace_group_chat_messages')
  .select('id,chat_id,body,created_at').eq('id',messageId).eq('chat_id',chatId).maybeSingle());
}
export async function searchShareablePalaceStories(query){
 const text=String(query||'').trim();
 if(text.length<2)return [];
 const safe=text.slice(0,90).replace(/[%_,()]/g,' ');
 return result(await client().from('works')
  .select('id,title,slug,summary').eq('publication_status','published')
  .ilike('title','%'+safe+'%').order('last_published_at',{ascending:false}).limit(8))||[];
}
