// Owner-approved Palace invitations; account creation remains entirely inside
// the existing 13+ signup flow. No auth users or invitation OTPs created here.
import {renderAgeSafeInvitation} from './email.ts';

const SITE='https://thestarrypalace.com';
const EMAIL_API='https://api.resend.com/emails';
const EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

function corsHeaders(origin:string|null){
 const allowed=origin===SITE ||
  (typeof origin==='string' && /^https:\/\/[a-z0-9-]+\.the-starry-palace\.pages\.dev$/i.test(origin));
 return {
  ...(allowed?{'Access-Control-Allow-Origin':origin!}:{}),
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Max-Age':'600',
  'Vary':'Origin',
  'Cache-Control':'no-store'
 };
}
function json(value:unknown,status:number,headers:Record<string,string>){
 return new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
}
function secret(name:string){return (Deno.env.get(name)||'').trim();}
function adminEmails(){
 return secret('PALACE_INVITE_ADMIN_EMAILS').split(',')
  .map(value=>value.trim().toLowerCase()).filter(Boolean);
}
function configured(){
 return !!(secret('RESEND_API_KEY')&&secret('SUPABASE_URL')&&
  secret('SUPABASE_SERVICE_ROLE_KEY')&&adminEmails().length);
}
async function verifiedSender(req:Request){
 const token=(req.headers.get('Authorization')||'').match(/^Bearer\s+(\S+)$/i)?.[1]||'';
 const origin=secret('SUPABASE_URL').replace(/\/$/,'');
 const apikey=secret('SUPABASE_ANON_KEY')||secret('SUPABASE_PUBLISHABLE_KEY');
 if(!token||!origin.startsWith('https://')||!origin.endsWith('.supabase.co')||!apikey)return null;
 const resp=await fetch(origin+'/auth/v1/user',{
  headers:{Authorization:'Bearer '+token,apikey}
 });
 if(!resp.ok)return null;
 const user=await resp.json();
 if(!user?.id||!user.email||!user.email_confirmed_at)return null;
 if(!adminEmails().includes(String(user.email).trim().toLowerCase()))return null;
 return {id:String(user.id)};
}
async function rpc(name:string,args:Record<string,unknown>){
 const key=secret('SUPABASE_SERVICE_ROLE_KEY');
 const origin=secret('SUPABASE_URL').replace(/\/$/,'');
 const response=await fetch(origin+'/rest/v1/rpc/'+name,{
  method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,
   'Content-Type':'application/json'},
  body:JSON.stringify(args)
 });
 if(!response.ok){
  const status=response.status;
  if(status===400||status===429){
   const error=await response.text();
   if(error.includes('invitation_rate_limited'))throw new Error('RATE_LIMITED');
  }
  throw new Error('INVITATION_LEDGER_UNAVAILABLE');
 }
 return response.json();
}
async function fingerprint(recipient:string){
 // HMAC: even if the private mail ledger leaks, it cannot be inverted by
 // hashing a list of common addresses without the server's secret.
 const key=await crypto.subtle.importKey('raw',
  new TextEncoder().encode(secret('SUPABASE_SERVICE_ROLE_KEY')),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(recipient));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');
 const headers=corsHeaders(origin);
 const originAllowed=!origin || !!headers['Access-Control-Allow-Origin'];
 if(req.method==='OPTIONS'){
  return originAllowed?new Response(null,{status:204,headers}):
   json({error:'Forbidden'},403,headers);
 }
 if(!originAllowed)return json({error:'Forbidden'},403,headers);
 if(req.method!=='GET'&&req.method!=='POST')
  return json({error:'Method not allowed'},405,headers);
 let sender:{id:string}|null=null;
 try{sender=await verifiedSender(req);}catch{sender=null;}
 if(!sender)return json({error:'Forbidden'},403,headers);
 if(req.method==='GET')return json({allowed:true,ready:configured()},200,headers);
 if(!configured())return json({error:'Sending is not configured'},503,headers);

 let to='';
 try{
  if(!req.headers.get('content-type')?.toLowerCase().includes('application/json'))
   return json({error:'Invalid request'},400,headers);
  const data=await req.json();
  if(!data||typeof data.email!=='string')return json({error:'Invalid email'},400,headers);
  to=data.email.trim().toLowerCase();
  if(to.length>254||!EMAIL_RE.test(to))return json({error:'Invalid email'},400,headers);
 }catch{return json({error:'Invalid request'},400,headers);}

 let id='';
 try{
  const reserved=await rpc('palace_invitation_reserve',{
   p_sender_id:sender.id,p_recipient_fingerprint:await fingerprint(to)
  });
  if(typeof reserved!=='string'||!/^[0-9a-f-]{36}$/i.test(reserved))
   throw new Error('INVITATION_LEDGER_UNAVAILABLE');
  id=reserved;
 }catch(error){
  const limited=error instanceof Error&&error.message==='RATE_LIMITED';
  return json({error:limited?'Too many invitations. Please try later.':'Invitation service unavailable'},
   limited?429:503,headers);
 }

 let sent=false;let providerId='';
 try{
  const letter=renderAgeSafeInvitation();
  const response=await fetch(EMAIL_API,{
   method:'POST',
   headers:{Authorization:'Bearer '+secret('RESEND_API_KEY'),'Content-Type':'application/json',
    'Idempotency-Key':'palace-invitation-'+id},
   body:JSON.stringify({
    from:'The Starry Palace <no-reply@thestarrypalace.com>',
    to:[to],subject:letter.subject,html:letter.html,text:letter.text
   })
  });
  if(!response.ok)throw new Error('Provider rejected request');
  const result=await response.json();
  sent=true;providerId=String(result?.id||'').slice(0,200);
 }catch{
  // Never log recipient addresses, request bodies, or Resend credentials.
  console.error('Palace invitation email provider rejected a request.');
 }
 try{
  await rpc('palace_invitation_finish',{
   p_id:id,p_accepted:sent,p_provider_message_id:providerId
  });
 }catch{
  // Provider idempotency protects retries made under this reservation id.
  console.error('Palace invitation accounting could not finish.');
 }
 return sent?json({accepted:true},200,headers):
  json({error:'Invitation email could not be sent'},502,headers);
});
