#!/usr/bin/env node
/**
 * LOCAL Supabase CLI Auth + Storage integration only.
 * No hosted URLs, user records, credentials, project data, or external email.
 * Mailpit captures local signup mail; generated localhost keys stay inside CI.
 */
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';

function localEnv(){
 const dir=process.env.PALACE_LOCAL_SUPABASE_DIR;
 assert.ok(dir,'Local-only Supabase CLI workdir must be supplied');
 const raw=execFileSync('supabase',['status','-o','env'],{cwd:dir,encoding:'utf8'});
 const out={};
 for(const line of raw.split(/\r?\n/)){
  const m=/^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if(m)out[m[1]]=m[2].replace(/^["']|["']$/g,'');
 }
 const url=out.API_URL,anon=out.ANON_KEY,admin=out.SERVICE_ROLE_KEY;
 assert.equal(url,'http://127.0.0.1:54321',
  'Refusing to run managed integration tests on any hosted environment');
 assert.ok(anon&&admin,'Local-only generated API keys unavailable');
 return {url,anon,admin};
}

const {url,anon,admin}=localEnv();
const settings={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const makeClient=key=>createClient(url,key,settings);
const root=makeClient(admin);
const guest=makeClient(anon);
const owner=makeClient(anon);
const member=makeClient(anon);
const stranger=makeClient(anon);
const identities=[];
const photos=[];
const bucket='palace-security-fixture';
const workId=randomUUID();
const roomId=randomUUID();
const pass=()=>randomBytes(24).toString('base64url')+'Aa1!';

function sql(query){
 // Only generated UUIDs and fixed SQL literals; no personal/user input.
 execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1',
  '-p','54322','-U','postgres','-d','postgres','-c',query],
  {env:{...process.env,PGPASSWORD:'postgres'},stdio:['ignore','pipe','pipe']});
}
function validUuid(s){
 assert.match(s,/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
 return s;
}
async function confirmedUser(label,client){
 const email='palace-'+label+'-'+randomUUID()+'@example.test';
 const password=pass();
 const created=await root.auth.admin.createUser({email,password,email_confirm:true});
 if(created.error)throw created.error;
 assert.ok(created.data?.user?.id,'Synthetic user was not created');
 const id=validUuid(created.data.user.id);
 identities.push(id);
 const signed=await client.auth.signInWithPassword({email,password});
 if(signed.error)throw signed.error;
 assert.equal(signed.data.user?.id,id,'GoTrue must issue a session for the right account');
 assert.ok(signed.data.session?.access_token,'GoTrue returned no signed session');
 return id;
}
async function mustFail(name,request){
 const r=await request();
 assert.ok(r.error, name+': unexpectedly allowed');
}
async function mustPass(name,request){
 const r=await request();
 if(r.error)throw new Error(name+': '+r.error.message);
 return r.data;
}

let passed=0;
function mark(name){passed++;console.log('PASS: '+name);}

try{
 // Confirmation remains enabled. No messages go to real inboxes.
 const email='palace-unconfirmed-'+randomUUID()+'@example.test';
 const password=pass();
 const signup=await guest.auth.signUp({email,password});
 if(signup.error)throw signup.error;
 assert.ok(signup.data.user?.id,'Unconfirmed signup did not create an account');
 identities.push(validUuid(signup.data.user.id));
 assert.equal(signup.data.session,null,'Unconfirmed signup unexpectedly received a session');
 await mustFail('unconfirmed user login',()=>guest.auth.signInWithPassword({email,password}));
 mark('Local GoTrue requires signup confirmation before issuing login tokens');

 const authorId=await confirmedUser('author',owner);
 const memberId=await confirmedUser('member',member);
 const unrelatedId=await confirmedUser('unrelated',stranger);
 assert.notEqual(authorId,memberId);
 assert.notEqual(unrelatedId,memberId);
 mark('Three genuinely signed-in, independently authorised GoTrue accounts');

 // Service key exists only in disposable localhost runtime, never in browser code.
 await mustPass('synthetic manuscript insert',()=>root.from('works')
   .insert({id:workId,author_id:authorId,publication_status:'draft',visibility:'private'}));
 await mustFail('unrelated reader cannot fetch draft via POST/UPDATE',()=>stranger.from('works')
   .update({visibility:'public'}).eq('id',workId).select('id').single());
 const invite=await mustPass('owner sends editor invitation',()=>owner.from('work_collaborators')
   .upsert({work_id:workId,user_id:memberId,role:'editor',status:'invited',invited_by:authorId},
      {onConflict:'work_id,user_id'}).select().single());
 assert.equal(invite.role,'editor');
 await mustFail('invitee cannot self-promote',()=>member.from('work_collaborators')
   .update({role:'co_writer'}).eq('work_id',workId).eq('user_id',memberId).select().single());
 await mustFail('author cannot accept for invited writer',()=>owner.from('work_collaborators')
   .update({status:'accepted'}).eq('work_id',workId).eq('user_id',memberId).select().single());
 const accepted=await mustPass('invitee accepts assigned editor role',()=>member.from('work_collaborators')
   .update({status:'accepted',responded_at:new Date().toISOString()})
   .eq('work_id',workId).eq('user_id',memberId).select().single());
 assert.equal(accepted.role,'editor');
 const ownWork=await mustPass('accepted collaborator can view assigned work',()=>member.from('works')
   .select('id').eq('id',workId).single());
 assert.equal(ownWork.id,workId);
 const unrelated=await mustPass('unrelated account only sees RLS-authorized rows',()=>stranger.from('works')
   .select('id').eq('id',workId));
 assert.equal(unrelated.length,0);
 mark('Managed Auth tokens enforce manuscript RLS and collaboration role consent');

 const room=validUuid(roomId);
 sql(`insert into private.staging_chat_rooms(id,kind) values ('${room}','direct');`);
 sql(`insert into private.staging_chat_members(room_id,user_id,active) values
  ('${room}','${authorId}',true),('${room}','${memberId}',true);`);
 const filePath='direct/'+room+'/'+authorId+'/'+randomUUID()+'.webp';
 const tinyWebp=Buffer.from(
  'UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoBAAEAAUAmJZgCdLoAA5gA/vm+F/8EFtR6YdKH18AU8SAA','base64');
 const up=await mustPass('author uploads private WebP',()=>owner.storage.from(bucket)
  .upload(filePath,tinyWebp,{contentType:'image/webp',upsert:false}));
 assert.ok(up.path);
 photos.push(filePath);
 const downloaded=await mustPass('member downloads authorised private WebP',()=>member.storage.from(bucket)
  .download(filePath));
 assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),tinyWebp);
 await mustFail('nonmember must not download private WebP',()=>stranger.storage.from(bucket)
  .download(filePath));
 await mustFail('guest must not download private WebP',()=>guest.storage.from(bucket)
  .download(filePath));
 await mustFail('nonmember must not issue private signed URL',()=>stranger.storage.from(bucket)
  .createSignedUrl(filePath,60));
 await mustFail('member must not upload inside another member folder',()=>member.storage.from(bucket)
  .upload('direct/'+room+'/'+authorId+'/'+randomUUID()+'.webp',tinyWebp,
   {contentType:'image/webp',upsert:false}));
 mark('Real local Supabase Storage upload/download and membership rules');

 // Signed URLs are temporary bearer links; we test them as a distinct threat.
 const signed=await mustPass('authorised member issues signed URL',()=>member.storage.from(bucket)
  .createSignedUrl(filePath,60));
 assert.ok(signed?.signedUrl?.startsWith(url+'/storage/'),'Malformed local signed URL');
 const before=await fetch(signed.signedUrl);
 assert.equal(before.status,200,'Valid signed link should serve private media before revocation');

 // Revocation is checked at the next authenticated request.
 sql(`update private.staging_chat_members set active=false where room_id='${room}' and user_id='${memberId}';`);
 await mustFail('revoked member must not download private media',()=>member.storage.from(bucket)
  .download(filePath));
 await mustFail('revoked member must not issue another signed link',()=>member.storage.from(bucket)
  .createSignedUrl(filePath,60));
 mark('Revoked membership denies subsequent authenticated downloads and new signed URLs');

 // Do not assert instantaneous revocation of already issued signed links.
 // Supabase's URL token/caching behavior may preserve such links until expiry.
 const previouslyIssued=await fetch(signed.signedUrl);
 console.log('INFO: previously issued signed URL after revocation: '+
  (previouslyIssued.ok?'still accessible until expiry':'no longer accessible in this run'));
 mark('Previously issued signed-link behavior observed separately from RLS');

 const publicUrl=root.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
 const publicFetch=await fetch(publicUrl);
 assert.notEqual(publicFetch.status,200,'Private bucket leaked through public URL');
 mark('Private bucket denies public unsigned URL');
 console.log('PASS: '+passed+' synthetic local Supabase managed Auth/Storage integration checks');
}finally{
 for(const path of photos)await root.storage.from(bucket).remove([path]).catch(()=>{});
 for(const id of identities)await root.auth.admin.deleteUser(id).catch(()=>{});
}
