// Run from an isolated folder with embedded-postgres installed. A fresh
// localhost cluster is created for each run. No database URL is accepted.
import EmbeddedPostgres from 'embedded-postgres';
import assert from 'node:assert/strict';
import {mkdtemp, readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
const dir=await mkdtemp(join(tmpdir(),'palace-seals-'));
const server=new EmbeddedPostgres({databaseDir:dir,port:25497,postgresFlags:['-c','unix_socket_directories='],user:'qa',password:randomUUID(),persistent:true,autoRehydrateSymlinks:true,onLog:()=>{},onError:()=>{}});
const clients=[];
const connect=async()=>{const c=server.getPgClient();await c.connect();clients.push(c);return c};
let passed=0;
const check=async(label,fn)=>{await fn();console.log('PASS',label);passed++};
try {
 await server.initialise();await server.start();
 const c=await connect(),other=await connect();
 const query=(sql,args=[])=>c.query(sql,args);
 const val=async(sql,args=[])=>Object.values((await query(sql,args)).rows[0])[0];
 const rpc=(name,args,client=c)=>client.query('select royal_invitation.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') as result',args).then(r=>r.rows[0].result);
 await query(`create role anon; create role authenticated; create role service_role;
 create schema auth;create schema private;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,created_at timestamptz,banned_until timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table private.member_age(user_id uuid primary key,birth_date date);`);
 await query(await readFile(new URL('./foundation.sql',import.meta.url),'utf8'));
 await query(await readFile(process.argv[2] || new URL('../../../supabase/migrations/20261111010000_palace_age_safe_outbound_invitations.sql',import.meta.url),'utf8'));
 await query(await readFile(new URL('./recipient-api.sql',import.meta.url),'utf8'));
 await query(await readFile(new URL('./dispatch-api.sql',import.meta.url),'utf8'));
 console.log('PostgreSQL',await val('show server_version'));
 async function member(email,{age=25,verified=true,old=false}={}){
   const id=randomUUID();await query("insert into auth.users values($1,$2,case when $3 then now() end,now() - case when $4 then interval '1 year' else interval '0' end,null)",[id,email,verified,old]);
   await query("insert into private.member_age values($1,current_date-make_interval(years=>$2))",[id,age]);return id;
 }
 const desk=await member('desk@example.invalid'),envoy=await member('envoy@example.invalid'),visitor=await member('reader@example.invalid');
 await query("insert into royal_invitation.issuers values($1,'desk',true)",[desk]);
 function letter(actor=envoy,kind='royal',email='arrival@example.invalid'){return [actor,randomUUID(),kind,email,randomBytes(32)]}
 const issue=(a)=>rpc('issue',a);
 const balance=()=>rpc('member_summary',[envoy]);
 await check('Browser and service roles have no private table or function access',async()=>{
   for(const role of ['anon','authenticated','service_role']){
    await query('set role '+role);await assert.rejects(()=>rpc('member_summary',[desk]),{code:'42501'});
    await assert.rejects(()=>query('select * from royal_invitation.letters'),{code:'42501'});await query('reset role');
   }
 });
 await check('Ordinary member cannot issue, approve, or allocate',async()=>{
   await assert.rejects(()=>issue(letter(visitor)),/Issuing unavailable/);
   await assert.rejects(()=>rpc('manage_envoy',[visitor,visitor,true]),/Desk approval required/);
   await assert.rejects(()=>rpc('allocate_quarter',[visitor,visitor]),/Desk approval required/);
 });
 await rpc('manage_envoy',[desk,envoy,true]);
 await check('Quarterly allocation is idempotent and supervised beta starts closed',async()=>{
  assert.equal(await rpc('allocate_quarter',[desk,envoy]),2);assert.equal(await rpc('allocate_quarter',[desk,envoy]),0);
  assert.equal((await balance()).available,2);await assert.rejects(()=>issue(letter()),/Issuing unavailable/);
 });
 await query('update royal_invitation.policy set member_sending=true');
 await check('Class, self-invite and Founding window enforced',async()=>{
  await assert.rejects(()=>issue(letter(envoy,'honoured')),/Issuing unavailable/);
  await assert.rejects(()=>issue(letter(envoy,'royal','ENVOY@example.invalid')),/Invalid invitation/);
  await assert.rejects(()=>issue(letter(desk,'founding')),/Class unavailable/);
  await query("update royal_invitation.policy set founding_window=tstzrange(now()-interval '1 hour',now()+interval '1 hour')");
  assert.ok(await issue(letter(desk,'founding')));
 });
 const first=letter();
 await check('Reservation retry returns the same invitation without spending twice',async()=>{
  assert.equal(await issue(first),first[1]);assert.equal(await issue(first),first[1]);assert.equal((await balance()).reserved,1);
  await assert.rejects(()=>issue([...first.slice(0,3),'other@example.invalid',first[4]]),/Request unavailable/);
 });
 let winner;
 await check('Concurrent sends against the last seal produce exactly one reservation',async()=>{
   const a=letter(),b=letter();const r=await Promise.allSettled([rpc('issue',a),rpc('issue',b,other)]);
   assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.match(r.find(x=>x.status==='rejected').reason.message,/No available seal/);
   winner=r[0].status==='fulfilled'?a:b;assert.equal((await balance()).available,0);
 });
 await check('Unauthorized revoke denied; two revocations return only one seal',async()=>{
  assert.equal(await rpc('revoke_letter',[visitor,winner[1]]),false);assert.equal(await rpc('revoke_letter',[envoy,winner[1]]),true);
  assert.equal(await rpc('revoke_letter',[envoy,winner[1]]),false);assert.equal((await balance()).available,1);
 });
 const invited=await member(first[3],{verified:false});
 await check('Wrong account, invalid token, unconfirmed account and revoked token denied',async()=>{
  for(const args of [[visitor,first[4]],[invited,randomBytes(32)],[invited,first[4]],[invited,winner[4]]])await assert.rejects(()=>rpc('redeem',args),/Invitation unavailable/);
 });
 await query('update auth.users set email_confirmed_at=now() where id=$1',[invited]);
 await check('Age eligibility fails closed for a missing or underage date of birth',async()=>{
  await query('delete from private.member_age where user_id=$1',[invited]);await assert.rejects(()=>rpc('redeem',[invited,first[4]]),/Invitation unavailable/);
  await query("insert into private.member_age values($1,current_date - interval '12 years')",[invited]);await assert.rejects(()=>rpc('redeem',[invited,first[4]]),/Invitation unavailable/);
  await query("update private.member_age set birth_date=current_date-interval '13 years' where user_id=$1",[invited]);
 });
 await check('Simultaneous verified acceptance is idempotent; one event and permanent seal consumption',async()=>{
   const result=await Promise.all([rpc('redeem',[invited,first[4]]),rpc('redeem',[invited,first[4]],other)]);
   assert.deepEqual(result,[first[1],first[1]]);assert.equal(await val("select count(*)::int from royal_invitation.events where event='redeemed'"),1);
   assert.equal((await balance()).accepted,1);assert.equal((await balance()).available,1);
 });
 await check('One welcome choice survives retries; private summary exposes no email or token',async()=>{
  assert.equal(await rpc('choose_gift',[invited,'guest-title']),true);assert.equal(await rpc('choose_gift',[invited,'guest-title']),true);
  assert.equal(await rpc('choose_gift',[invited,'seal-ornament']),false);assert.equal(await rpc('choose_gift',[visitor,'guest-title']),false);
  const s=await rpc('member_summary',[invited]);assert.equal(s.keepsake.gift,'guest-title');assert.equal(s.keepsake.class,'royal');assert.doesNotMatch(JSON.stringify(await balance()),/@|token|recipient_binding/);
 });
 await check('Existing account admission and expired letter cannot be claimed',async()=>{
  const a=letter(desk,'honoured','reader@example.invalid');await issue(a);await assert.rejects(()=>rpc('redeem',[visitor,a[4]]),/Invitation unavailable/);
  const b=letter();await issue(b);await query("update royal_invitation.letters set expires_at=now()-interval '1 minute' where id=$1",[b[1]]);
  await assert.rejects(()=>rpc('redeem',[invited,b[4]]),/Invitation unavailable/);assert.equal((await balance()).available,1);
  await issue(letter());assert.equal((await balance()).history.some(h=>h.status==='expired'),true);
 });
 await check('Suspension revokes pending letters and preserves acquired honours',async()=>{
  await rpc('manage_envoy',[desk,envoy,false]);await assert.rejects(()=>issue(letter()),/Issuing unavailable/);
  assert.equal((await balance()).reserved,0);assert.equal((await balance()).accepted,1);
  assert.equal((await rpc('member_summary',[invited])).keepsake.gift,'guest-title');
 });
 await check('Public RPC derives the recipient from the session and preserves a private keepsake',async()=>{
  const a=letter(desk,'honoured','honoured@example.invalid');await issue(a);
  const guest=await member(a[3]);const token=a[4].toString('hex');
  await query('set role anon');await assert.rejects(()=>val('select public.royal_invitation_claim($1)',[token]),{code:'42501'});
  await query('reset role');await query('set role authenticated');
  await query("select set_config('request.jwt.claim.sub',$1,false)",[guest]);
  await assert.rejects(()=>val('select public.royal_invitation_claim($1)',[token]),/Invitation unavailable/);
  await query('reset role');await query('update royal_invitation.policy set recipient_claims=true');await query('set role authenticated');
  await query("select set_config('request.jwt.claim.sub',$1,false)",[visitor]);
  assert.equal(await val('select public.royal_invitation_claim($1)',[token]),null);
  assert.equal((await val('select public.royal_invitation_my_record()')).keepsake,null);
  await query("select set_config('request.jwt.claim.sub',$1,false)",[guest]);
  assert.equal((await val('select public.royal_invitation_claim($1)',[token])).class,'honoured');
  assert.equal((await val("select public.royal_invitation_welcome_gift('seal-ornament')")).gift,'seal-ornament');
  assert.equal((await val('select public.royal_invitation_my_record()')).keepsake.gift,'seal-ornament');
  await query('reset role');
 });
 await check('Service-only dispatch reuses the original quota ledger, one seal and one provider receipt',async()=>{
  await rpc('manage_envoy',[desk,envoy,true]);
  const a=letter(envoy,'royal','dispatch@example.invalid');
  const args=[...a.slice(0,4),a[4].toString('hex'),'a'.repeat(64)];
  await query('set role authenticated');
  await assert.rejects(()=>val('select public.royal_invitation_prepare_dispatch($1,$2,$3,$4,$5,$6)',args),{code:'42501'});
  await query('reset role');await query('set role service_role');
  const prepare=()=>val('select public.royal_invitation_prepare_dispatch($1,$2,$3,$4,$5,$6)',args);
  assert.equal(await prepare(),'send');await assert.rejects(prepare,/Dispatch unavailable/);
  assert.equal(await val('select public.royal_invitation_finish_dispatch($1,false,null)',[a[1]]),true);
  await query('reset role');await query("update royal_invitation.letters set last_attempt=now()-interval '2 minutes' where id=$1",[a[1]]);
  await query('set role service_role');assert.equal(await prepare(),'send');
  assert.equal(await val("select public.royal_invitation_finish_dispatch($1,true,'test-provider-id')",[a[1]]),true);
  assert.equal(await prepare(),'provider_accepted');await query('reset role');
  assert.equal(await val('select count(*)::int from private.palace_invitation_delivery_log'),1);
  assert.equal((await balance()).reserved,1);assert.equal((await balance()).accepted,1);
 });
 await check('Treasury grants roll back with a missing mapping and populate existing inventory once',async()=>{
  await query(`create table public.virtual_gifts(id uuid primary key,art_status text,reward_eligible boolean);
   create table public.gift_grant_ledger(user_id uuid,gift_id uuid,tier text,quantity integer,source_type text,source_key text,note text,unique(user_id,source_type,source_key));
   create table public.user_gift_inventory(user_id uuid,gift_id uuid,tier text,copies integer,updated_at timestamptz,primary key(user_id,gift_id,tier));`);
  await query(await readFile(new URL('./inventory-trigger-fixture.sql',import.meta.url),'utf8'));
  await query(await readFile(new URL('./treasury.sql',import.meta.url),'utf8'));
  const a=letter(desk,'founding','treasury@example.invalid');await issue(a);const guest=await member(a[3]);
  await assert.rejects(()=>rpc('redeem',[guest,a[4]]),/Invitation benefit unavailable/);
  assert.equal(await val('select state from royal_invitation.letters where id=$1',[a[1]]),'pending');
  for(const benefit of ['founding','guest-title']){
   const id=randomUUID();await query("insert into public.virtual_gifts values($1,'final',false)",[id]);
   await query('insert into royal_invitation.cosmetics values($1,$2)',[benefit,id]);
  }
  await rpc('redeem',[guest,a[4]]);await rpc('redeem',[guest,a[4]]);
  await rpc('choose_gift',[guest,'guest-title']);await rpc('choose_gift',[guest,'guest-title']);
  assert.equal(await val('select count(*)::int from public.gift_grant_ledger'),2);
  assert.equal(await val('select sum(copies)::int from public.user_gift_inventory where user_id=$1',[guest]),2);
 });
 await check('Invalid claim attempts commit and throttle a later valid token',async()=>{
  const a=letter(desk,'royal','limited@example.invalid');await issue(a);const guest=await member(a[3]);
  await query("select set_config('request.jwt.claim.sub',$1,false)",[guest]);await query('set role authenticated');
  for(let i=0;i<10;i++)assert.equal(await val("select public.royal_invitation_claim('invalid')"),null);
  assert.equal(await val('select public.royal_invitation_claim($1)',[a[4].toString('hex')]),null);
  await query('reset role');assert.equal(await val('select attempts from royal_invitation.claim_attempts where member_id=$1',[guest]),10);
  assert.equal(await val('select state from royal_invitation.letters where id=$1',[a[1]]),'pending');
 });
 await check('An approved desk can adjust only unused seals; retries retain one audit event',async()=>{
  const id=randomUUID();const before=(await balance()).available;
  await query("select set_config('request.jwt.claim.sub',$1,false)",[envoy]);await query('set role authenticated');
  await assert.rejects(()=>val("select public.royal_invitation_adjust($1,$2,false,'test grant')",[envoy,id]),/Desk approval required/);
  await query("select set_config('request.jwt.claim.sub',$1,false)",[desk]);
  await val("select public.royal_invitation_adjust($1,$2,false,'test grant')",[envoy,id]);
  await val("select public.royal_invitation_adjust($1,$2,false,'test grant')",[envoy,id]);
  await query('reset role');assert.equal((await balance()).available,before+1);
  await val("select public.royal_invitation_adjust($1,$2,true,'test return')",[envoy,randomUUID()]);
  assert.equal((await balance()).available,before);assert.equal((await balance()).reserved,1);
 });
 console.log(passed+' groups passed');
} finally {await Promise.all(clients.map(c=>c.end()));await server.stop();await rm(dir,{recursive:true,force:true})}
