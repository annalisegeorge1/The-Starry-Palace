import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import './palace-install.css';

function isInstalled(){
 if(typeof window==='undefined')return false;
 return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator?.standalone);
}
/**
 * The install request only appears after a real browser installability event.
 * No unsolicited popups, extra app downloads or account migration.
 */
export default function PalaceInstall(){
 const [prompt,setPrompt]=useState(null);
 const [installed,setInstalled]=useState(isInstalled);
 const [notice,setNotice]=useState('');
 useEffect(()=>{
  function available(event){event.preventDefault();setPrompt(event)}
  function complete(){setInstalled(true);setPrompt(null);setNotice('The Palace is now on this device. ✦')}
  window.addEventListener('beforeinstallprompt',available);
  window.addEventListener('appinstalled',complete);
  return()=>{
   window.removeEventListener('beforeinstallprompt',available);
   window.removeEventListener('appinstalled',complete);
  };
 },[]);
 async function install(){
  if(!prompt)return;
  const request=prompt;setPrompt(null);
  try{
   await request.prompt();
   const decision=await request.userChoice;
   if(decision?.outcome==='accepted')setNotice('Your browser is adding the Palace to your device.');
   else setNotice('You can install the Palace from your browser menu whenever you choose.');
  }catch{setNotice('Use your browser’s menu to add the Palace to your home screen.')}
 }
 return <main className="palace-install-page">
  <section className="palace-install-hero">
   <span className="palace-install-sigil" aria-hidden="true">☾ <i>✦</i></span>
   <p className="palace-install-kicker">THE STARRY PALACE · YOUR POCKET CONSTELLATION</p>
   <h1>Take the Palace with you.</h1>
   <p>Gather. Have a cup of tea. Write and read with me. Your reading room, writing desk, and favourite Palace corners can live on your home screen.</p>
   <div className="palace-install-actions">
    {installed?<strong role="status" className="palace-install-installed">✦ Installed on this device</strong>:
     prompt?<button type="button" onClick={install}>✧ Install The Starry Palace</button>:
     <span>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</span>}
    <Link to="/reading">Explore the Reading Room →</Link>
   </div>
   {notice&&<p role="status" className="palace-install-notice">{notice}</p>}
  </section>
  <section className="palace-install-platforms" aria-label="How to install on your device">
   <article><span aria-hidden="true">✧</span><h2>Android</h2><p>Open the Palace in <strong>Chrome</strong>, tap <strong>⋮</strong>, then choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. Confirm the installation.</p></article>
   <article><span aria-hidden="true">☾</span><h2>iPhone &amp; iPad</h2><p>Open the Palace in <strong>Safari</strong>, tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong>. Keep <strong>Open as Web App</strong> enabled, then tap <strong>Add</strong>.</p></article>
   <article><span aria-hidden="true">✦</span><h2>Laptop &amp; desktop</h2><p>Use <strong>Chrome</strong> or <strong>Edge</strong>, open the browser menu, then choose <strong>Install page as app</strong> when offered.</p></article>
  </section>
  <p className="palace-install-note">Installing the Palace is free and does not make a second account. This is the web-app version, not an App Store download. It needs an internet connection for signing in, messages, publishing, and most reading. Offline story downloads are not available yet.</p>
 </main>;
}
