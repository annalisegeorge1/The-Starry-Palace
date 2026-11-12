import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from './supabase';

const seals={royal:'Royal Seal',honoured:'Honoured Guest Seal',founding:'Founding Guest Seal'};
import {welcomeGifts as gifts} from './royalWelcomeGifts';
import RoyalWelcomeChest from './RoyalWelcomeChest';
export function readInvitationSecret(hash){
 const value=new URLSearchParams(hash.slice(1)).get('seal');
 return value&&/^[0-9a-f]{64}$/.test(value)?value:null;
}

// The original email is the recovery path when confirmation opens another
// browser. Never forward its credential into OAuth, signup or local storage.
export function RoyalInvitationClaim({secret,member}){
 const [keepsake,setKeepsake]=useState(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const pending=useRef(false);
 const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 async function request(name,args){
  if(!member||pending.current)return;
  pending.current=true;setBusy(true);setMessage('');
  try{
   const {data,error}=await supabase.rpc(name,args);
   if(error||!data||!Object.hasOwn(seals,data.class)||!data.accepted)throw new Error();
   if(name==='royal_invitation_welcome_gift'&&data.gift!==args.p_choice)throw new Error();
   if(mounted.current)setKeepsake(data);
  }catch{
   if(mounted.current)setMessage(name==='royal_invitation_claim'
    ?'This invitation could not be accepted. Use the verified account for the address that received the letter, then reopen the original email.'
    :'Your gift choice could not be confirmed. You can retry your selection.');
  }finally{
   pending.current=false;if(mounted.current)setBusy(false);
  }
 }
 if(!member)return <section aria-label="Accept your sealed invitation">
  <p>Create your Chamber using the email address that received this letter. After confirming your email or signing in, reopen this invitation to claim your seal.</p>
  <Link className="palace-invite-primary" to="/login?mode=signup">Register to accept</Link>{' '}
  <Link to="/login">Sign in to the invited account</Link>
 </section>;
 return <section aria-label="Your sealed invitation" aria-busy={busy}>
  {keepsake?<><h2>{seals[keepsake.class]}</h2><p>Your private keepsake records your acceptance on {new Date(keepsake.accepted).toLocaleDateString()}.</p>
   {keepsake.message&&<blockquote>{keepsake.message}</blockquote>}
   {keepsake.gift?<p>Welcome gift selected · {gifts[keepsake.gift]}</p>:<RoyalWelcomeChest busy={busy} onChoose={choice=>request('royal_invitation_welcome_gift',{p_choice:choice})}/>}
   <p><Link to="/chamber">Enter my Chamber</Link></p>
  </>:<><p>Accept with the verified account that received this letter. Your keepsake is private.</p>
    <button type="button" disabled={busy} className="palace-invite-primary"
     onClick={()=>request('royal_invitation_claim',{p_token:secret})}>Accept my Royal Invitation</button></>}
  <p role="status">{busy?'Checking with the Palace…':message}</p>
 </section>;
}
