import {preparePalaceEmail} from '../emailContent.js';

async function palaceRpc(env,name,payload){
 const origin=String(env.SUPABASE_URL||'').replace(/\/$/,'');
 if(!origin.startsWith('https://')||!origin.endsWith('.supabase.co'))
  throw new Error('Invalid Supabase endpoint');
 const response=await fetch(origin+'/rest/v1/rpc/'+name,{
  method:'POST',headers:{
   apikey:env.SUPABASE_SERVICE_ROLE_KEY,
   Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
   'Content-Type':'application/json'
  },body:JSON.stringify(payload)
 });
 if(!response.ok)throw new Error('Palace RPC returned '+response.status);
 return response.json();
}
export async function processPalaceEmailAlerts(env){
 // Explicit kill switch. No credentials or network calls while disabled.
 if(env.PALACE_EMAILS_ENABLED!=='true')return {status:'disabled',sent:0};
 if(!env.EMAIL?.send||!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_URL)
  throw new Error('Server-only email binding or credentials missing');
 const batches=await palaceRpc(env,'palace_email_claim_batches',{p_limit:10});
 if(!Array.isArray(batches))throw new Error('Invalid Palace email queue');
 let sent=0,failed=0;
 for(const batch of batches){
  let success=false,messageId='';
  try{
   if(!/^\S+@\S+\.\S+$/.test(String(batch.email||'')))throw new Error('Recipient address invalid');
   const content=preparePalaceEmail(batch);
   const result=await env.EMAIL.send({
    from:env.PALACE_EMAIL_FROM||'notifications@thestarrypalace.com',
    to:batch.email,subject:content.subject,text:content.text,html:content.html
   });
   messageId=String(result?.messageId||'');
   success=true;sent++;
  }catch(error){
   failed++;
   // Do not log member email addresses or private notice details.
   console.error('Palace email send failed',error?.name||'DeliveryError');
  }
  await palaceRpc(env,'palace_email_finish_batch',{
   p_claim_token:batch.claim_token,
   p_success:success,
   p_provider_message_id:messageId
  });
 }
 return {status:'processed',sent,failed};
}
export default {
 async fetch(){return new Response('Not found',{status:404});},
 async scheduled(_event,env,ctx){ctx.waitUntil(processPalaceEmailAlerts(env));}
};
