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

function InvitationPanel({children,Frame,title,eyebrow='A LETTER FROM THE PALACE',overline='BY PERSONAL INVITATION'}){
 return <Frame><section className="palace-invite-room">
   <div className="palace-invite-letter">
     <header className="palace-invite-letter-head">
       <p className="palace-invite-stars" aria-hidden="true">✧ ✦ ✧</p>
       <p className="palace-invite-wordmark">The Starry Palace</p>
       <span className="palace-invite-letter-rule" aria-hidden="true"/>
       <p className="palace-invite-overline">{overline}</p>
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
  {!loading&&session?.user?.id&&!secret&&<p className="palace-invite-back"><Link to="/my-invitations">View My Royal Invitations</Link></p>}
 </InvitationPanel>;
}

export function PalaceMyRoyalInvitations({Frame}){
 const {session,loading}=useAuth();
 const [adminAccess,setAdminAccess]=useState(false);
 const endpoint=getInvitationDispatchEndpoint(import.meta.env.VITE_SUPABASE_URL);
 useEffect(()=>{
  let active=true;
  setAdminAccess(false);
  if(loading||!session?.access_token||!endpoint)return()=>{active=false;};
  // Legacy welcome-letter permissions are checked by the existing service.
  // A visible navigation link is never the authority for sending an email.
  fetch(endpoint,{headers:{
   Authorization:'Bearer '+session.access_token,
   apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||''
  }}).then(response=>response.ok?response.json():null)
   .then(result=>{if(active)setAdminAccess(result?.allowed===true);})
   .catch(()=>{if(active)setAdminAccess(false);});
  return()=>{active=false;};
 },[loading,session?.access_token,endpoint]);
 return <InvitationPanel Frame={Frame} eyebrow="MY PALACE" title="My Royal Invitations" overline="THE ROYAL INVITATION PRIVILEGE">
  <p className="palace-invite-member-lead">An invitation is an honour to receive and a responsibility to give. Royal Envoy status is an earned privilege; ordinary members retain the Palace's essential reading, writing and community features.</p>
  <div className="palace-invite-member-grid">
   <section>
    <h2>Receiving a sealed invitation</h2>
    <p>When the system opens, verified invitees can receive a permanent admission keepsake and choose one of five exclusive welcome gifts.</p>
   </section>
   <section>
    <h2>Earning Royal Envoy status</h2>
    <p>Approved members may eventually issue limited sealed letters. Readers, artists and writers can qualify regardless of followers or publishing history.</p>
   </section>
  </div>
  {loading?<p role="status">Checking your Palace membership…</p>:session?.user?.id
   ?<RoyalEnvoyDesk key={session.user.id} session={session} endpoint={endpoint}/>
   :<p><Link to="/login">Sign in to view your Royal Invitation status</Link></p>}
  {adminAccess&&<section className="palace-invite-member-admin" aria-label="Existing administrator invitation desk">
   <h2>Your administrator welcome desk</h2>
   <p>You can send ordinary Palace welcome letters now. They do not grant Royal Envoy admission seals or exclusive gifts.</p>
   <Link className="palace-invite-primary" to="/admin/invitations">Open administrator invitation desk</Link>
  </section>}
  <nav className="palace-invite-member-actions" aria-label="Continue exploring the Palace">
   <Link className="palace-invite-member-action" to="/reading">Explore Reading Rooms</Link>
   <Link className="palace-invite-member-action" to="/chamber">Return to my Chamber</Link>
  </nav>
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
   <p>This desk sends an ordinary Palace welcome email. It helps someone register but does not issue a unique Royal Invitation Seal or exclusive honours. Special invitations will be issued from My Royal Invitations when the secure Royal Envoy system is enabled. Every recipient follows the normal 13+ registration process.</p>
   <div className="palace-invite-feature">
    <strong>Share an ordinary Palace welcome link</strong>
    <p><a href={PALACE_PUBLIC_INVITATION_URL}>{PALACE_PUBLIC_INVITATION_URL}</a></p>
    <p className="palace-invite-age">This public link leads to ordinary registration. Exclusive Royal Invitation honours require a unique, recipient-bound sealed letter issued through the Royal Envoy system.</p>
    <button type="button" className="palace-invite-primary" onClick={copyLink}>{copied?'Palace welcome link copied':'Copy welcome link'}</button>
   </div>
   {loading||checking?<p role="status">Checking invitation permissions…</p>:allowed?<form onSubmit={send} className="palace-invite-form">
     <label htmlFor="palace-invite-email">Recipient email</label>
     <input id="palace-invite-email" type="email" autoComplete="off" placeholder="reader@example.com" required readOnly={reviewing||busy} maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/>
     <p className="palace-invite-age">The recipient will receive a Palace welcome letter, not a sealed Royal Invitation. No account is created by sending it.</p>
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
