import React,{useEffect,useState}from'react';
import{useAuth}from'./auth';
import{supabase}from'./supabase';

export function PalaceAgeGate({Frame,children}){
 const{session}=useAuth();
 const[status,setStatus]=useState('checking');
 const[birthDate,setBirthDate]=useState('');
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  if(!session?.user?.id){setStatus('signed_out');return()=>{active=false}}
  setStatus('checking');setError('');
  supabase.rpc('palace_age_status').then(({data,error:rpcError})=>{
   if(!active)return;
   if(rpcError)throw rpcError;
   setStatus(data||'needs_birth_date');
  }).catch(e=>{if(active){setStatus('unavailable');setError(e?.message||'Age eligibility could not be checked.')}});
  return()=>{active=false};
 },[session?.user?.id]);
 async function submit(e){
  e.preventDefault();if(!birthDate||busy)return;
  setBusy(true);setError('');
  try{
   const{data,error:rpcError}=await supabase.rpc('set_my_palace_birth_date',{p_birth_date:birthDate});
   if(rpcError)throw rpcError;
   setStatus(data||'needs_birth_date');
   if(data!=='eligible')setError('The Palace requires members to be at least 12 years old.');
  }catch(e){setError(e?.message||'Your age could not be confirmed. Please check the date and try again.');}
  finally{setBusy(false)}
 }
 if(!session?.user?.id)return children;
 if(status==='eligible')return children;
 const title=status==='checking'?'Checking the Palace gates':status==='unavailable'?'Age check unavailable':'Confirm your age to continue';
 return <Frame><section className="gate palace-age-gate"><div className="gate-copy"><p className="eyebrow">PALACE AGE REQUIREMENT</p><h1>{title}</h1><p>The minimum age to create or use a Palace account is 12. Your date of birth is stored privately and is used only to enforce this minimum and age limits set by creators.</p><p>Creators may set a higher minimum age for individual stories and comics. Those limits apply to reading, including direct links.</p></div><div className="auth-panel"><form onSubmit={submit}><label htmlFor="palace-birth-date">Date of birth</label><input id="palace-birth-date" type="date" autoComplete="bday" max={(()=>{const d=new Date();d.setFullYear(d.getFullYear()-12);return d.toISOString().slice(0,10)})()} value={birthDate} onChange={e=>setBirthDate(e.target.value)} required disabled={status==='checking'||status==='unavailable'}/><small>Your exact birth date is private. The Palace does not display it on your profile.</small><button disabled={busy||status==='checking'||status==='unavailable'}>{busy?'Checking…':'Continue'}</button></form>{status==='under_minimum'&&<p className="palace-auth-message" role="alert">The Palace requires account holders to be at least 12 years old.</p>}{error&&<p className="palace-auth-message" role="alert">{error}</p>}{status==='unavailable'&&<button type="button" className="secondary" onClick={()=>window.location.reload()}>Try again</button>}<button type="button" className="secondary" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></section></Frame>;
}
