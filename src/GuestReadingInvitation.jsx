import React from 'react';
import {Link} from 'react-router-dom';
import {palaceSignInDoor} from './palaceDoorway';
import './guest-reading-invitation.css';

/** Reading is public; accounts are for participation, not entry. */
export default function GuestReadingInvitation({returnTo='/reading',context='story',compact=false}){
 const login=palaceSignInDoor(returnTo);
 const signup=login+(login.includes('?')?'&':'?')+'mode=signup';
 const descriptions={
  discover:'Explore published public stories, comics and classics without an account.',
  comment:'Reader responses are open to members. Sign in to comment, reply and join the discussion.',
  chapter:'Keep reading freely. Join to save your place, give appreciation and join conversations.',
  comic:'Enjoy the panels freely. Join to save comics and follow artists.',
  story:'Read freely. Join to save stories, follow writers and take part in discussions.'
 };
 return <aside className={'guest-reading-invitation'+(compact?' compact':'')} aria-label="Reading and membership">
  <span className="guest-reading-mark" aria-hidden="true">☾</span>
  <div className="guest-reading-copy"><strong>No account needed to read.</strong><p>{descriptions[context]||descriptions.story}</p></div>
  <div className="guest-reading-actions"><Link className="guest-reading-join" to={signup}>Create an account</Link><Link className="guest-reading-login" to={login}>Sign in</Link></div>
 </aside>;
}
