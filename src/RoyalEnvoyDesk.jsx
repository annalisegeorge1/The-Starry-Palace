import React,{useState,useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';
const classes={royal:'Royal Invitation',honoured:'Honoured Guest Invitation',founding:'Founding Invitation'};
import {welcomeGifts as gifts} from './royalWelcomeGifts';
import RoyalWelcomeChest from './RoyalWelcomeChest';
export default function RoyalEnvoyDesk({endpoint,session}){
 const [record,setRecord]=useState(null),[refresh,setRefresh]=useState(0);
 const [loading,setLoading]=useState(true),[recordError,setRecordError]=useState(false);
 const [email,setEmail]=useState(''),[kind,setKind]=useState('royal'),[review,setReview]=useState(null);
 const [greeting,setGreeting]=useState(''),[message,setMessage]=useState('');
 const [member,setMember]=useState(''),[action,setAction]=useState('approve');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const active=useRef(false);
 useEffect(()=>{
  let current=true;
  setLoading(true);setRecordError(false);
  supabase.rpc('royal_invitation_my_record')
   .then(({data,error})=>{
    if(!current)return;
    setRecord(error?null:data);
    setRecordError(Boolean(error)||!data);
   })
   .catch(()=>{if(current){setRecord(null);setRecordError(true);}})
   .finally(()=>{if(current)setLoading(false);});
  return()=>{current=false};
 },[refresh]);
 async function run(fn){
  if(active.current)return;
  active.current=true;setBusy(true);setNotice('');
  try{setNotice(await fn());setRefresh(n=>n+1);}
  catch{setNotice('The Palace could not confirm this action. Review your invitation history before retrying.');setRefresh(n=>n+1);}
  finally{active.current=false;setBusy(false);}
 }
 async function rpc(name,args){
  const {data,error}=await supabase.rpc(name,args);if(error||data===false)throw new Error();return data;
 }
 if(loading&&!record)return <section aria-label="My Royal Invitations" className="palace-invite-feature"><h2>My Royal Invitations</h2><p role="status">Checking your Royal Invitation privileges…</p></section>;
 if(recordError||!record)return <section aria-label="My Royal Invitations" className="palace-invite-feature">
  <h2>My Royal Invitations</h2>
  <p role="status">The Royal Envoy system is being prepared. No member-issued invitation privileges are available here yet.</p>
  <p>Royal Invitations will be awarded to approved Envoys when the secure issuing system opens. You can still explore the Palace in the meantime.</p>
  <Link to="/reading">Explore Reading Rooms</Link>
 </section>;
 const canIssue=record.desk||(record.envoy&&record.sending&&record.available>0);
 return <section aria-label="My Royal Invitations" className="palace-invite-feature">
  <h2>My Royal Invitations</h2>
  {!record.envoy&&!record.desk&&!record.keepsake&&<section aria-label="Royal Envoy eligibility">
   <h3>Royal Envoy · Not yet awarded</h3>
   <p>Royal Invitations are a special privilege for approved members in good standing. Readers, writers and artists can all become eligible; you do not need followers or published stories.</p>
   <p>When the Palace opens member-issued invitations, approved Envoys will be able to send a limited number of personal letters. Ordinary membership already includes the Palace's essential reading, writing and community features.</p>
   <Link to="/guidebook">Explore the Palace Guidebook</Link>
  </section>}
  {record.envoy&&!record.sending&&<p role="status">Your Royal Envoy status is recognised, but sending invitations is not enabled yet.</p>}
  {record.keepsake&&<section><h3>My private keepsake</h3>
   <p>{classes[record.keepsake.class]} · Accepted {new Date(record.keepsake.accepted).toLocaleDateString()}</p>
   {record.keepsake.message&&<blockquote>{record.keepsake.message}</blockquote>}
   {record.keepsake.gift?<p>Welcome gift selected · {gifts[record.keepsake.gift]}</p>:<RoyalWelcomeChest busy={busy} onChoose={choice=>run(async()=>{
    const receipt=await rpc('royal_invitation_welcome_gift',{p_choice:choice});
    if(receipt?.gift!==choice)throw new Error();
    return 'Your choice has been saved.';
   })}/>}
   <Link to="/palace-life">Visit Palace Life</Link></section>}
  {(record.envoy||record.desk)&&<p>{record.desk?'Invitation Desk':'Royal Envoy'} · {record.available} seals available · {record.reserved} reserved · {record.accepted} accepted</p>}
  {(record.envoy||record.accepted>0)&&<p>Envoy milestones · {record.accepted} verified acceptances. Permanent achievement awards will appear after the Palace activates them.</p>}
  {(canIssue||review)&&<form onSubmit={event=>{event.preventDefault();
   if(!review){setReview({email:email.trim(),invitationClass:kind,requestId:crypto.randomUUID(),greeting:greeting.trim(),message:message.trim()});return}
   run(async()=>{
    const response=await fetch(endpoint+'?sealed=1',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,
     apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'','Content-Type':'application/json'},body:JSON.stringify(review)});
    if(!response.ok||(await response.json()).accepted!==true)throw new Error();
    setReview(null);setEmail('');setGreeting('');setMessage('');return 'Provider accepted the email. Recipient acceptance is recorded separately.';
   });
  }}>
   <label>Recipient email <input type="email" required maxLength={254} value={email} readOnly={!!review} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Recipient name (optional) <input maxLength={60} value={greeting} readOnly={!!review} onChange={e=>setGreeting(e.target.value)}/></label>
   <label>Personal message (optional) <textarea maxLength={300} value={message} readOnly={!!review} onChange={e=>setMessage(e.target.value)}/></label>
   {record.desk&&<label>Invitation class <select value={kind} disabled={!!review} onChange={e=>setKind(e.target.value)}>
    {Object.entries(classes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>}
   {review&&<p>{classes[kind]} for {review.email}. {record.desk?'Desk issue.':'Reserves one seal.'}</p>}
   <button disabled={busy} type="submit">{review?'Confirm dispatch':'Review sealed invitation'}</button>
   {review&&<button disabled={busy} type="button" onClick={()=>setReview(null)}>Edit</button>}
  </form>}
  {record.history.length>0&&<details><summary>Invitation history</summary><ul>{record.history.map(item=><li key={item.id}>
   {classes[item.class]} · {item.status} · {new Date(item.issued).toLocaleDateString()}
   {item.status==='pending'&&<button type="button" disabled={busy} onClick={()=>run(async()=>{
    await rpc('royal_invitation_revoke',{p_letter:item.id});return 'Invitation revoked.';
   })}>Revoke</button>}</li>)}</ul></details>}
  {record.desk&&<details><summary>Manage Royal Envoys</summary><form onSubmit={e=>{e.preventDefault();run(async()=>{
   await rpc('royal_invitation_manage_envoy',{p_member:member,p_action:action});return 'Desk action recorded.';
  })}}>
   <label>Verified member ID <input value={member} required onChange={e=>setMember(e.target.value)}/></label>
   <label>Action <select value={action} onChange={e=>setAction(e.target.value)}><option value="approve">Approve as Envoy</option>
   <option value="allocate">Allocate this quarter’s seals</option><option value="suspend">Suspend and revoke pending invitations</option></select></label>
   <button type="submit" disabled={busy}>Confirm desk action</button>
  </form></details>}
  <p role="status">{notice}</p>
 </section>;
}
