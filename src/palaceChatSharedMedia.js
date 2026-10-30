/* Read-only shared-content index for the currently opened and loaded room.
 * Never fetch, resolve, or expose media URLs outside the existing private renderer. */
export function collectPalaceSharedMedia(messages=[],isGif=()=>false){
 const valid=Array.isArray(messages)?messages:[];
 const seen=new Set();
 const items=[];
 for(const message of valid){
  if(!message?.id||seen.has(String(message.id)))continue;
  seen.add(String(message.id));
  const id=String(message.id),createdAt=message.created_at||'';
  const base={id,createdAt};
  if(typeof message.media_path==='string'&&message.media_path.trim()){
   items.push({...base,kind:'photo',path:message.media_path,body:message.body||''});
  }else if(typeof message.body==='string'&&isGif(message.body)){
   items.push({...base,kind:'gif',body:message.body});
  }
  if(message.works?.slug&&message.works?.title){
   items.push({...base,id:id+':story',messageId:id,kind:'story',title:String(message.works.title),slug:String(message.works.slug)});
  }
 }
 return items.sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
}
export function groupPalaceSharedMedia(items=[],filter='all',limit=24){
 const safe=['all','photo','gif','story'].includes(filter)?filter:'all';
 return (Array.isArray(items)?items:[]).filter(x=>safe==='all'||x.kind===safe).slice(0,Math.max(0,Math.min(100,Number(limit)||24)));
}
