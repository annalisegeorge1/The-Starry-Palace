// Run with pg and embedded-postgres installed in a disposable tools directory.
// The script creates its own temporary database. It accepts no production URL.
import EmbeddedPostgres from 'embedded-postgres';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const cluster = new EmbeddedPostgres({databaseDir:mkdtempSync(join(tmpdir(),'reader-cas-')),port:54671,persistent:false,postgresFlags:['-c','unix_socket_directories=','-c','listen_addresses=127.0.0.1'],onLog:()=>{}});
const scripts = process.argv[2] || new URL('.',import.meta.url).pathname;
const sql = name=>readFileSync(join(scripts,name+'.sql'),'utf8');
const clients=[];
const uid='10000000-0000-0000-0000-000000000001';
const work='20000000-0000-0000-0000-000000000001';
const ch='30000000-0000-0000-0000-000000000001';
const next='30000000-0000-0000-0000-000000000002';
try {
 await cluster.initialise(); await cluster.start();
 for(let i=0;i<3;i++){const c=cluster.getPgClient();await c.connect();clients.push(c)}
 const [admin,a,b]=clients;
 await admin.query(`create role authenticated; create role anon; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select current_setting('test.uid')::uuid$$;
 create table chapters(id uuid primary key,work_id uuid,status text);
 create table reading_progress(user_id uuid, work_id uuid,chapter_id uuid references chapters on delete set null,
 progress_percent numeric check(progress_percent between 0 and 100), chapter_progress_percent numeric check(chapter_progress_percent between 0 and 100),completed boolean,updated_at timestamptz,primary key(user_id,work_id));
 alter table reading_progress enable row level security;
 create policy own on reading_progress using(user_id=auth.uid()) with check(user_id=auth.uid());
 grant usage on schema auth to authenticated;grant select on chapters to authenticated;grant select,insert,update on reading_progress to authenticated;`);
 await admin.query("insert into chapters values($1,$2,'published'),($3,$2,'published')",[ch,work,next]);
 await admin.query(sql('install'));
 for(const c of [a,b]){await c.query('set role authenticated');await c.query("select set_config('test.uid',$1,false)",[uid])}
 const save=async(client,rev,chapter=ch,pct=80,done=false)=>(await client.query('select save_reading_position($1,$2,$3,80,$4,$5) as revision',[work,chapter,rev,pct,done])).rows[0].revision;
 const first=await Promise.all([save(a,null),save(b,null)]);assert.deepEqual(first.sort(),['1',null].sort());
 const race=await Promise.all([save(a,1),save(b,1)]);assert.deepEqual(race.sort(),['2',null].sort());
 assert.equal(await save(a,2,next,100,true),'3');assert.equal(await save(b,2,ch),null);
 assert.equal(await save(a,3,ch,5),'4');
 await assert.rejects(b.query('update reading_progress set chapter_progress_percent=95'),e=>e.code==='40001');
 const row=(await a.query('select * from reading_progress')).rows[0];assert.equal(row.chapter_progress_percent,'5');assert.equal(row.completed,true);
 await b.query("select set_config('test.uid',$1,false)",['10000000-0000-0000-0000-000000000002']);
 assert.equal(await save(b,4),null);assert.equal((await b.query('select * from reading_progress')).rowCount,0);
 await admin.query(sql('rollback'));assert.equal((await admin.query('select * from reading_progress')).rowCount,1);
 console.log('PASS concurrent creation and updates, delayed write, rereading, completion retention, legacy writer rejection, account isolation, rollback');
} finally {
 await Promise.all(clients.map(c=>c.end()));await cluster.stop();
}
