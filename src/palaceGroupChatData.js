import {supabase} from './supabase';

function client(){if(!supabase)throw new Error('Palace messaging is not connected yet.');return supabase}
function result({data,error}){if(error)throw error;return data}
const cleanId=value=>typeof value==='string'?value.trim():'';

export async function getPalaceGroupChatOverview(userId){
 if(!userId)return {groups:[],invitations:[]};
 const db=client();
 const [membership,invites]=await Promise.all([
  db.from('palace_group_chat_members')
   .select('chat_id,muted,last_read_at,palace_group_chats(id,title,owner_id,status,created_at,last_message_at)')
   .eq('user_id',userId).is('left_at',null),
  db.from('palace_group_chat_invites')
   .select('chat_id,status,created_at,palace_group_chats(id,title,owner_id,status)')
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
  id:x.chat_id,title:x.palace_group_chats.title,ownerId:x.palace_group_chats.owner_id,
  lastMessageAt:x.palace_group_chats.last_message_at,muted:x.muted,lastReadAt:x.last_read_at,
  members:roster.filter(m=>m.chat_id===x.chat_id).map(m=>({id:m.user_id,joinedAt:m.joined_at,...m.profiles}))
 }));
 return {
  groups:groups.sort((a,b)=>Date.parse(b.lastMessageAt||0)-Date.parse(a.lastMessageAt||0)),
  invitations:myInvites.filter(x=>x.palace_group_chats?.status==='active').map(x=>({
   id:x.chat_id,title:x.palace_group_chats.title,ownerId:x.palace_group_chats.owner_id,createdAt:x.created_at
  }))
 };
}
export async function getPalaceGroupMessages(chatId,limit=100){
 if(!cleanId(chatId))return [];
 const data=result(await client().from('palace_group_chat_messages')
  .select('id,chat_id,sender_id,body,created_at,profiles!palace_group_chat_messages_sender_id_fkey(id,username,display_name)')
  .eq('chat_id',chatId).order('created_at',{ascending:false}).limit(Math.min(120,Math.max(1,limit))));
 return (data||[]).reverse();
}
export async function createPalaceGroupChat(title,userIds){
 const invitees=[...new Set((userIds||[]).filter(Boolean))];
 const id=result(await client().rpc('create_palace_group_chat',{p_title:String(title||'').trim(),p_invitees:invitees}));
 if(!id)throw new Error('The group could not be created.');
 return id;
}
export async function sendPalaceGroupMessage(chatId,userId,body){
 const text=String(body||'').trim();
 if(!text||text.length>3000)throw new Error('Write a message of up to 3,000 characters.');
 return result(await client().from('palace_group_chat_messages')
  .insert({chat_id:chatId,sender_id:userId,body:text}).select('id').single());
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
