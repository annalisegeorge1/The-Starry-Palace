// Run only against the temporary database created here.
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

const dataDir=await mkdtemp(join(tmpdir(),'discussion-qa-'));
const server=new EmbeddedPostgres({databaseDir:dataDir,port:16483,user:'postgres',password:'test',persistent:false,postgresFlags:['-c','unix_socket_directories=','-c','listen_addresses=127.0.0.1'],onLog:()=>{}});
const clients=[];
async function connect(){
 const client=new pg.Client({host:'127.0.0.1',port:16483,user:'postgres',password:'test',database:'postgres'});
 await client.connect();clients.push(client);return client;
}
async function file(name){return readFile(new URL(name,import.meta.url),'utf8')}
try{
 await server.initialise();await server.start();
 const db=await connect();
 await db.query(`create role authenticated;create role anon;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.user',true),'')::uuid$$;
 create table profiles(id uuid primary key,username text);
 create table private.member_age(user_id uuid primary key,birth_date date);
 create table notices(recipient uuid,title text,metadata jsonb);
 create function private.create_notification(uuid,text,text,text,text,text,text,text,jsonb)
 returns void language sql as $$insert into public.notices values($1,$3,$9)$$;
 create table works(id uuid primary key,author_id uuid,comment_policy text,slug text,visibility text,publication_status text,minimum_reader_age int);
 create table chapters(id uuid primary key,work_id uuid,status text);
 create function private.can_read_chapter(p_work uuid,p_status text) returns boolean language sql as $$
 select p_status='published' or exists(select 1 from public.works where id=p_work and author_id=auth.uid())$$;
 create table user_member_boundaries(user_id uuid,other_user_id uuid,blocked boolean,muted boolean default false);
 create table comments(id uuid primary key default gen_random_uuid(),work_id uuid,chapter_id uuid,author_id uuid,
 parent_comment_id uuid,body text,spoiler boolean default false,comment_type text default 'response',
 status text default 'pending',updated_at timestamptz,created_at timestamptz default now());`);
 for(const filename of ['discussion-revision-review.sql','discussion-submission-guard.sql','discussion-interactions.sql'])await db.query(await file(filename));
 const [writer,reader,other,work,chapter]=Array.from({length:5},()=>randomUUID());
 await db.query('insert into profiles(id) values($1),($2),($3)',[writer,reader,other]);
 await db.query("insert into works values($1,$2,'open','world','public','published',13)",[work,writer]);
 await db.query("insert into chapters values($1,$2,'published')",[chapter,work]);
 async function act(client,user){await client.query("select set_config('request.user',$1,false)",[user])}
 async function insert(client,author,parent=null,ch=chapter){
  const result=await client.query("insert into comments(work_id,chapter_id,author_id,parent_comment_id,body) values($1,$2,$3,$4,'original') returning id",[work,ch,author,parent]);
  return result.rows[0].id;
 }
 await db.query("insert into private.member_age select id,date '1990-01-01' from profiles");
 await db.query("update profiles set username='moon' where id=$1",[other]);
 await act(db,reader);
 const root=await insert(db,reader);
 await assert.rejects(insert(db,reader,root),/unavailable/);
 await act(db,writer);await db.query("update comments set status='approved' where id=$1",[root]);
 await act(db,other);await assert.rejects(insert(db,other,root,null),/unavailable/);
 const reply=await insert(db,other,root);
 await assert.rejects(db.query("update comments set body='rewritten' where id=$1",[root]),/cannot be edited/);
 await act(db,reader);
 const edited=(await db.query("update comments set body='revision' where id=$1 returning *",[root])).rows[0];
 assert.equal(edited.status,'pending');assert.equal(edited.edit_revision,1);assert.ok(edited.edited_at);
 await act(db,writer);
 await assert.rejects(db.query("update comments set status='approved' where id=$1",[root]),/changed/);
 await db.query("update comments set status='approved',reviewed_revision=1 where id=$1",[root]);
 await db.query('insert into user_member_boundaries values($1,$2,true)',[reader,other]);
 await act(db,other);await assert.rejects(insert(db,other,root),/unavailable/);
 await db.query('delete from user_member_boundaries');
 await act(db,writer);
 await db.query("select public.set_discussion_interaction($1,'pin','on')",[root]);
 await act(db,other);
 await assert.rejects(db.query("select public.set_discussion_interaction($1,'pin','off')",[root]),/unavailable/);
 await db.query("select public.set_discussion_interaction($1,'reaction','heart')",[root]);
 await db.query("select public.set_discussion_interaction($1,'reaction','laugh')",[root]);
 const state=async(id)=>(await db.query('select public.discussion_interaction_state($1::uuid[]) items',[[id]])).rows[0].items[id];
 assert.deepEqual((await state(root)).counts,{laugh:1});
 assert.equal((await state(root)).pinned,true);
 await db.query("select public.set_discussion_interaction($1,'preference','following')",[root]);
 await act(db,reader);
 await db.query("select public.set_discussion_interaction($1,'preference','muted')",[root]);
 await act(db,writer);await db.query("update comments set status='approved' where id=$1",[reply]);
 assert.equal((await db.query("select * from notices where metadata->>'comment_id'=$1",[reply])).rowCount,0);
 const fresh=await insert(db,reader).catch(()=>null);assert.equal(fresh,null);
 await act(db,reader);const mention=await insert(db,reader,root);
 await db.query("update comments set body='Thank you @moon' where id=$1",[mention]);
 await act(db,writer);
 await db.query("update comments set status='approved',reviewed_revision=1 where id=$1",[mention]);
 const alerts=(await db.query("select * from notices where metadata->>'comment_id'=$1",[mention])).rows;
 assert.equal(alerts.length,1);assert.equal(alerts[0].recipient,other);assert.match(alerts[0].title,/mentioned/);
 assert.equal(alerts[0].metadata.chapter_id,chapter);
 await act(db,other);
 await db.query("select public.set_discussion_interaction($1,'preference','off')",[root]);
 await act(db,reader);const direct=await insert(db,reader,reply);
 await act(db,writer);await db.query("update comments set status='approved' where id=$1",[direct]);
 const directAlerts=(await db.query("select * from notices where metadata->>'comment_id'=$1",[direct])).rows;
 assert.equal(directAlerts.length,1);assert.equal(directAlerts[0].recipient,other);assert.match(directAlerts[0].title,/replied/);
 await act(db,other);
 await db.query("select public.set_discussion_interaction($1,'preference','following')",[root]);
 await act(db,reader);const followed=await insert(db,reader,root);
 await act(db,writer);await db.query("update comments set status='approved' where id=$1",[followed]);
 const follows=(await db.query("select * from notices where metadata->>'comment_id'=$1",[followed])).rows;
 assert.equal(follows.length,1);assert.equal(follows[0].recipient,other);assert.match(follows[0].title,/followed/);
 await db.query("select public.set_discussion_chapter_closed($1,true)",[chapter]);
 await assert.rejects(insert(db,writer),/closed/);
 await act(db,reader);await assert.rejects(db.query("select public.set_discussion_chapter_closed($1,false)",[chapter]),/unavailable/);
 await act(db,writer);await db.query("select public.set_discussion_chapter_closed($1,false)",[chapter]);
 await db.query("update private.member_age set birth_date=current_date where user_id=$1",[other]);
 await act(db,other);assert.equal(await state(root),undefined);
 await assert.rejects(db.query("select public.set_discussion_interaction($1,'reaction','heart')",[root]),/unavailable/);
 // Exercise actual API grants using separate client roles, including a guest.
 const member=await connect();
 await member.query('set role authenticated');await act(member,reader);
 assert.equal((await member.query("select public.discussion_interaction_state($1::uuid[]) items",[[root]])).rows[0].items[root].pinned,true);
 await member.query("select public.set_discussion_interaction($1,'reaction','surprise')",[root]);
 await assert.rejects(member.query("select * from private.discussion_thread_preferences"),/permission denied/);
 await assert.rejects(member.query("insert into public.discussion_closed_chapters values($1)",[chapter]),/permission denied/);
 const guest=await connect();await guest.query('set role anon');
 assert.deepEqual((await guest.query("select public.discussion_interaction_state($1::uuid[]) items",[[root]])).rows[0].items,{});
 await assert.rejects(guest.query("select public.set_discussion_interaction($1,'reaction','heart')",[root]),/permission denied/);
 const burst=await Promise.all(Array.from({length:10},async()=>{
  const connection=await connect();await act(connection,writer);return connection;
 }));
 const results=await Promise.allSettled(burst.map(connection=>insert(connection,writer)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,6);
 assert.ok(results.filter(r=>r.status==='rejected').every(r=>/wait a moment/.test(r.reason.message)));
 await db.query(await file('rollback.sql'));
 assert.equal((await db.query('select edit_revision,status from comments where id=$1',[root])).rows[0].edit_revision,1);
 await assert.rejects(member.query("select public.set_discussion_interaction($1,'reaction','heart')",[root]),/permission denied/);
 console.log('Passed rollback, revision review, stale moderation, parent scope, boundaries and ten simultaneous submissions.');
}finally{
 await Promise.all(clients.map(c=>c.end()));
 await server.stop();
 await rm(dataDir,{recursive:true,force:true});
}
