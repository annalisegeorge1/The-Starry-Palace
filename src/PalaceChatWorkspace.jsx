import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import PalaceChatDrawer from './PalaceChatDrawer';
import './palace-chat-workspace.css';

/* Full messenger and quick chat share exactly the same conversation engine.
   No second storage system, no duplicate subscriptions, and no new privileges. */
export default function PalaceChatWorkspace(){
 const {session}=useAuth();
 if(!session?.user?.id)return null;
 return <section className="palace-chat-workspace-page" aria-label="Palace Messenger">
  <header className="palace-chat-workspace-intro">
   <div><p className="eyebrow">THE STARRY PALACE · PRIVATE CONVERSATIONS</p>
    <h1>Palace Messenger</h1>
    <p>Your letters, reading circles, and shared stories — all in one calm place.</p></div>
   <nav aria-label="Messenger navigation">
    <Link to="/letters">Palace Letters</Link>
    <Link to="/palace-life">Palace Life</Link>
   </nav>
  </header>
  <PalaceChatDrawer key={session.user.id} userId={session.user.id} workspace/>
  <p className="palace-chat-workspace-privacy">Direct messages and invitation-only circles remain subject to each member’s permissions. Message search covers only the messages currently loaded in your browser.</p>
 </section>;
}
