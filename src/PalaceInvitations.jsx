import React, {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import {configured, supabase} from './supabase';
import {renderAgeSafeInvitation} from '../supabase/functions/palace-invitations/email.ts';
import RoyalEnvoyDesk from './RoyalEnvoyDesk';
import {RoyalInvitationClaim,readInvitationSecret} from './RoyalInvitationClaim';
import './palace-invitations.css';

export const PALACE_PUBLIC_INVITATION_URL = 'https://thestarrypalace.com/invitation';
const FN_NAME='palace-invitations';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InvitationPanel({children,Frame,title,eyebrow='A LETTER FROM THE PALACE'}){
 return <Frame><section className="palace-invite-room">
   <div className="palace-invite-letter">
     <header className="palace-invite-letter-head">
       <p className="palace-invite-stars" aria-hidden="true">✧ ✦ ✧</p>
       <p className="palace-invite-wordmark">The Starry Palace</p>
       <span className="palace-invite-letter-rule" aria-hidden="true"/>
       <p className="palace-invite-overline">BY PERSONAL INVITATION</p>
     </header>
     <div className="palace-invite-letter-body">
       <p className="palace-invite-kicker">{eyebrow}</p>
       <h1>{title}</h1>
       {children}
     </div>
     <footer className="palace-invite-letter-foot">✦ Gather. Imagine. Create. Belong. ✦</footer>
   </div>
 </section></Frame>;
}

export function PalaceInvitationLanding({Frame}){
 const {session,loading}=useAuth();
 const [secret]=useState(()=>readInvitationSecret(window.location.hash));
 useEffect(()=>{
  if(secret)window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
 },[secret]);
 return <InvitationPanel Frame={Frame} title="The gates have opened for you.">
   <p className="palace-invite-poem">Some stories begin with a door.<br/>Yours begins beneath the stars.</p>
   <p>You've been invited to discover The Starry Palace: a home for readers, writers and artists, where your stories and imagination have a place to shine.</p>
   <p className="palace-invite-age">Membership is for people aged 13 or older. You'll enter your own date of birth privately during registration. An invitation does not bypass this requirement.</p>
   <div className="palace-invite-actions">
     {!loading&&secret&&<RoyalInvitationClaim key={session?.user?.id||'guest'} member={session?.user?.id} secret={secret}/>}
     {!loading&&!secret&&(session?<Link className="palace-invite-primary" to="/chamber">Enter my Chamber</Link>:<>
      <Link className="palace-invite-primary" to="/login?mode=signup">Accept my invitation</Link>
      <Link to="/login">Already a member? Sign in</Link>
     </>)}
     <Link to="/reading">Explore public stories first</Link>
   </div>
  {!loading&&session?.user?.id&&!secret&&<RoyalEnvoyDesk key={session.user.id} session={session} endpoint={getInvitationDispatchEndpoint(import.meta.env.VITE_SUPABASE_URL)}/>}
 </InvitationPanel>;
}

export function getInvitationDispatchEndpoint(origin){
 if(typeof origin!=='string'||!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(origin)) return null;
 return origin.replace(/\/$/,'')+'/functions/v1/'+FN_NAME;
}

export function PalaceInvitationAdmin({Frame}){
 const {session,loading}=useAuth();
 const [email,setEmail]=useState('');
 const [reviewing,setReviewing]=useState(false);
 const submitting=React.useRef(false);
 const letter=renderAgeSafeInvitation();
 const [checking,setChecking]=useState(true);
 const [allowed,setAllowed]=useState(false);
 const [configuredToSend,setConfiguredToSend]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [copied,setCopied]=useState(false);
 const endpoint=getInvitationDispatchEndpoint(import.meta.env.VITE_SUPABASE_URL);

 useEffect(()=>{
  let active=true;
  setChecking(true);setAllowed(false);setConfiguredToSend(false);
  if(!session?.access_token||!endpoint){setChecking(false);return()=>{active=false;};}
  fetch(endpoint,{headers:{Authorization:'Bearer '+session.access_token,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||''}})
   .then(async response=>{if(!response.ok)throw new Error('Forbidden');return response.json();})
   .then(data=>{if(active){setAllowed(Boolean(data.allowed));setConfiguredToSend(Boolean(data.ready));}})
   .catch(()=>{if(active)setNotice('Invitation sending is not configured for this account. You can still share the Palace invitation link.');})
   .finally(()=>{if(active)setChecking(false);});
  return()=>{active=false;};
 },[session?.access_token,endpoint]);

 async function copyLink(){
  try {await navigator.clipboard.writeText(PALACE_PUBLIC_INVITATION_URL);setCopied(true);}
  catch {setNotice('Copy this link manually: '+PALACE_PUBLIC_INVITATION_URL);}
 }
 async function send(event){
  event.preventDefault();
  if(!allowed||!configuredToSend||submitting.current||!endpoint||!session?.access_token)return;
  const trimmed=email.trim();
  if(trimmed.length>254||!emailPattern.test(trimmed)){setNotice('Enter a valid recipient email address.');return;}
  if(!reviewing){setReviewing(true);setNotice('');return;}
  submitting.current=true;setBusy(true);setNotice('');
  try{
   const response=await fetch(endpoint,{method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||''},
    body:JSON.stringify({email:trimmed})});
   if(!response.ok){
    if(response.status===429)throw new Error('Invitation sending limit reached. Please try again later.');
    throw new Error(response.status===503?'Invitation email delivery has not been configured yet.':'The invitation could not be sent. Please retry later.');
   }
   const receipt=await response.json().catch(()=>null);
   if(receipt?.accepted!==true)throw new Error('The Palace could not confirm the provider accepted this letter. Check its status before sending again.');
   setReviewing(false);
   setNotice('Invitation accepted by the email provider. Delivery to the recipient is not yet confirmed.');
   setEmail('');
  }catch(error){setNotice(error.message||'The invitation could not be sent.');}
  finally{submitting.current=false;setBusy(false);}
 }
 return <InvitationPanel Frame={Frame} eyebrow="PALACE INVITATION DESK" title="Send a letter from the Palace.">
   <p>Create a personal invitation to The Starry Palace. Inviting someone doesn't create an account; the recipient signs up and declares their own date of birth through the normal 13+ process.</p>
   <div className="palace-invite-feature">
    <strong>Share an invitation link</strong>
    <p><a href={PALACE_PUBLIC_INVITATION_URL}>{PALACE_PUBLIC_INVITATION_URL}</a></p>
    <button type="button" className="palace-invite-primary" onClick={copyLink}>{copied?'Invitation link copied':'Copy invitation link'}</button>
   </div>
   {loading||checking?<p role="status">Checking invitation permissions…</p>:allowed?<form onSubmit={send} className="palace-invite-form">
     <label htmlFor="palace-invite-email">Recipient email</label>
     <input id="palace-invite-email" type="email" autoComplete="off" placeholder="reader@example.com" required readOnly={reviewing||busy} maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/>
     <p className="palace-invite-age">The recipient will receive the royal invitation. No Palace user is created by sending it.</p>
     {reviewing&&<section aria-label="Review invitation email">
       <h2>Review your letter</h2>
       <p><strong>To</strong> {email.trim()}</p>
       <p><strong>Subject</strong> {letter.subject}</p>
       <details><summary>Read the plain-text letter</summary>
         {letter.text.split('\n\n').map((paragraph,index)=><p key={index}>{paragraph}</p>)}
       </details>
       <button type="button" disabled={busy} onClick={()=>{setReviewing(false);setNotice('');}}>Edit recipient</button>
     </section>}
     <button type="submit" className="palace-invite-primary" disabled={busy||!configuredToSend}>{busy?'Sending invitation…':configuredToSend?(reviewing?'Send this invitation':'Review invitation'):'Email sending not yet configured'}</button>
   </form>:<p className="palace-invite-age">Sending invitations is restricted to authorised Palace administrators. You may share the public invitation link above.</p>}
   {notice&&<p role="status" className="palace-invite-notice">{notice}</p>}
   <p className="palace-invite-back"><Link to="/">Return to the Palace</Link></p>
 </InvitationPanel>;
}
