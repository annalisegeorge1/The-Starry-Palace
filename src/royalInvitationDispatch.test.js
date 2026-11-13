import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
let handler;
const env={PALACE_SEALED_INVITATIONS:'enabled',PALACE_INVITATION_TOKEN_KEY:'test-only'.repeat(5),
 SUPABASE_SERVICE_ROLE_KEY:'fixture-service',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_ANON_KEY:'fixture-anon',
 PALACE_INVITE_ADMIN_EMAILS:'desk@example.invalid',RESEND_API_KEY:'fixture-mail'};
beforeEach(async()=>{
 vi.resetModules();vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('Deno',{env:{get:key=>env[key]},serve:fn=>{handler=fn}});
 await import('../supabase/functions/palace-invitations/index.ts');
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()});
const sender={id:'123e4567-e89b-42d3-a456-426614174000',email:'envoy@example.invalid',email_confirmed_at:'2026-01-01'};
const id='00000000-0000-4000-a000-000000000001';
const body={email:'guest@example.invalid',invitationClass:'royal',requestId:id};
function send(data=body){return handler(new Request('https://fixture.supabase.co/functions/v1/palace-invitations?sealed=1',{
 method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(data)}))}
it('takes sender identity from verified Auth, uses the same idempotency key and includes only a fragment token in the letter',async()=>{
 const requests=[];
 const mock=vi.fn(async(url,init)=>{
  const payload=init.body?JSON.parse(init.body):null;requests.push({url,payload,headers:init.headers});
  const result=url.endsWith('/auth/v1/user')?sender:url.endsWith('/royal_invitation_prepare_dispatch')?'send':
   url.endsWith('/royal_invitation_finish_dispatch')?true:{id:'synthetic-receipt'};
  return Response.json(result);
 });
 vi.stubGlobal('fetch',mock);
 const result=await send({...body,actor:'forged',greeting:'Reader',message:'A warm <welcome>.'});expect(await result.json()).toEqual({accepted:true});
 const prepare=requests.find(r=>r.url.endsWith('prepare_dispatch')).payload;
 expect(prepare.p_actor).toBe(sender.id);expect(prepare.p_token).toMatch(/^[0-9a-f]{64}$/);
 const mail=requests.find(r=>r.url==='https://api.resend.com/emails');
 expect(mail.headers['Idempotency-Key']).toBe('palace-invitation-'+id);
 expect(mail.payload.text).toContain('https://thestarrypalace.com/invitation#seal='+prepare.p_token);
 expect(mail.payload.html).toContain('#seal='+prepare.p_token);
 expect(mail.payload.html).toContain('A warm &lt;welcome&gt;.');expect(mail.payload.text).toContain('A warm <welcome>.');
 await send();expect(requests.filter(r=>r.url.endsWith('prepare_dispatch'))[1].payload.p_token).toBe(prepare.p_token);
});
it('rejects an Envoy class upgrade before reserving or sending',async()=>{
 const fetcher=vi.fn(async()=>Response.json(sender));vi.stubGlobal('fetch',fetcher);
 expect((await send({...body,invitationClass:'founding'})).status).toBe(400);expect(fetcher).toHaveBeenCalledTimes(1);
});
it('returns an existing provider acknowledgement without sending again',async()=>{
 const fetcher=vi.fn(async url=>Response.json(url.endsWith('/auth/v1/user')?sender:'provider_accepted'));
 vi.stubGlobal('fetch',fetcher);expect(await (await send()).json()).toEqual({accepted:true});expect(fetcher).toHaveBeenCalledTimes(2);
});


it('does not send a sealed email when the server-side issuer authorization rejects the actor',async()=>{
 const fetcher=vi.fn(async url=>{
  if(url.endsWith('/auth/v1/user'))return Response.json(sender);
  if(url.endsWith('/royal_invitation_prepare_dispatch'))
   return Response.json({error:'Issuing unavailable'},{status:403});
  throw new Error('Unexpected request after denied dispatch');
 });
 vi.stubGlobal('fetch',fetcher);
 const result=await send();
 expect(result.status).toBe(503);
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(fetcher.mock.calls.every(([url])=>url!=='https://api.resend.com/emails')).toBe(true);
});

it('fails closed when sealed dispatch is disabled even for a signed-in member',async()=>{
 const original=env.PALACE_SEALED_INVITATIONS;
 env.PALACE_SEALED_INVITATIONS='';
 try{
  const fetcher=vi.fn(async url=>{
   if(url.endsWith('/auth/v1/user'))return Response.json(sender);
   throw new Error('Sealed backend must not be called while disabled');
  });
  vi.stubGlobal('fetch',fetcher);
  const result=await send();
  expect(result.status).toBe(403);
  expect(fetcher).toHaveBeenCalledTimes(1);
 }finally{env.PALACE_SEALED_INVITATIONS=original;}
});
