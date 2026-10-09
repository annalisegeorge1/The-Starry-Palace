// Postgres Changes delivers only RLS-authorized events. Never render payload bodies;
// trigger a fresh member-authorized fetch instead.
export function watchPalaceChatRoom(client,{userId,kind,roomId,onChange,onStatus}){
 if(!client||!userId||!roomId||!['direct','groups'].includes(kind))return ()=>{};
 const table=kind==='groups'?'palace_group_chat_messages':'messages';
 const column=kind==='groups'?'chat_id':'conversation_id';
 let active=true;
 const channel=client.channel('palace-chat-live-'+kind+'-'+roomId+'-'+userId)
  .on('postgres_changes',{
   event:'INSERT',schema:'public',table,filter:column+'=eq.'+roomId
  },()=>{if(active)onChange?.()});
 channel.subscribe(status=>{if(active)onStatus?.(status)});
 return ()=>{
  active=false;
  // Do not await removal in a React effect cleanup.
  try{const pending=client.removeChannel(channel);pending?.catch?.(()=>{})}catch{}
 };
}
