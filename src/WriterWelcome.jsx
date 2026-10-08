import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from './auth';
import './writer-welcome.css';

const WRITER_STRENGTHS=[
 {icon:'✎',title:'A private writing desk',description:'Begin with a draft. Review, revise, arrange chapters, and choose when to publish.'},
 {icon:'◈',title:'A place for many kinds of stories',description:'Write original fiction, fanworks, poetry and other forms, with genres, fandoms and searchable tags.'},
 {icon:'☾',title:'Tools for returning to the page',description:'Work on a manuscript, use creative prompts and join optional Ink Duels or collaborative rooms.'},
 {icon:'✦',title:'A community, not a popularity contest',description:'Find readers, conversations and fellow writers without being required to compete or collect points.'}
];
const COMMON_QUESTIONS=[
 {question:'Do I have to publish right away?',answer:'No. You can draft and edit privately before you choose to make a chapter public. Keep your own independent backup of important manuscripts too.'},
 {question:'Can I bring an existing story?',answer:'You can begin a work and paste your own writing into its chapters. A one-click import from other platforms is not currently promised.'},
 {question:'Are original stories and fanfiction both welcome?',answer:'Yes, within the Palace Code, applicable rights and community rules. Choose the correct work type and fandom tags so readers can find your story.'},
 {question:'Will I automatically receive readers, gifts, or a featured placement?',answer:'No. We cannot promise followers, votes, rankings, promotional placement or earnings. Early contributors can help us make the writing experience better.'},
 {question:'What is the Founding Writers Circle?',answer:'A proposed, small early-community programme focused on feedback, genuine discussion and improving the tools. Participation is voluntary; joining the site does not automatically enroll you in a separate programme.'}
];
const FIRST_CHAPTER=[
 {number:'01',title:'Create your Chamber',description:'Make a free account and choose how you want to participate.'},
 {number:'02',title:'Start a private draft',description:'Open the Writing Chamber and create an original work, fanwork, poem or other manuscript.'},
 {number:'03',title:'Prepare your story',description:'Write a chapter, choose a title, set its classification and add relevant tags.'},
 {number:'04',title:'Publish when ready',description:'Check your chapter, publish deliberately and share its link with the readers you want to invite.'}
];

export function WriterWelcome(){
 const {session}=useAuth();
 return <div className="writer-welcome" id="writer-welcome">
  <section className="writer-welcome-hero">
   <div className="writer-welcome-copy">
    <p className="writer-eyebrow">THE STARRY PALACE · A HOME FOR YOUR STORIES</p>
    <h1>Your next chapter belongs here.</h1>
    <p>Write quietly. Publish when you're ready. Find other people who care about stories as much as you do.</p>
    <div className="writer-welcome-actions">
     <Link className="writer-primary" to={session?'/writing':'/login?mode=signup&next=%2Fwriting'}>{session?'Open my Writing Chamber':'Create an account to write'} <span aria-hidden="true">↗</span></Link>
     <Link className="writer-secondary" to="/reading">Explore the Reading Rooms →</Link>
    </div>
    <small>Free to explore · A free account is required to save drafts · No promise of an audience or earnings</small>
   </div>
   <div className="writer-welcome-art" aria-hidden="true">
    <div className="writer-ink-orbit">✦</div>
    <div className="writer-paper">
     <span>THE FIRST PAGE</span>
     <strong>Every world begins with a sentence.</strong>
     <i/>
     <em>Gather. Have a cup of tea. Write and read with me.</em>
    </div>
    <span className="writer-moon-decoration">☾</span>
   </div>
  </section>

  <section className="writer-welcome-features">
   <div className="writer-section-heading"><p className="writer-eyebrow">WRITE, SHARE, BELONG</p>
    <h2>More than a place to post chapters.</h2>
    <p>Different kinds of writers should feel welcome without having to master every Palace room on day one.</p></div>
   <div className="writer-feature-grid">
    {WRITER_STRENGTHS.map(item=><article key={item.title}>
     <span aria-hidden="true">{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p>
    </article>)}
   </div>
  </section>

  <section className="writer-first-chapter" id="first-chapter">
   <div className="writer-section-heading"><p className="writer-eyebrow">YOUR FIRST NIGHT AT THE DESK</p>
    <h2>Four steps. One story.</h2>
    <p>You do not need to understand Palaces, badges, competitions or Council elections before writing.</p></div>
   <ol>{FIRST_CHAPTER.map(item=><li key={item.number}>
    <span className="writer-step-number">{item.number}</span>
    <div><h3>{item.title}</h3><p>{item.description}</p></div>
   </li>)}</ol>
   <Link className="writer-primary" to={session?'/writing':'/login?mode=signup&next=%2Fwriting'}>{session?'Begin in the Writing Chamber →':'Create my free writing desk →'}</Link>
  </section>

  <section className="writer-early-circle" id="founding-writers">
   <span className="writer-early-mark" aria-hidden="true">☾ ✧</span>
   <div><p className="writer-eyebrow">HELP SHAPE A NEW LITERARY HOME</p>
    <h2>The Founding Writers Circle</h2>
    <p>We're preparing a small, voluntary early-writer community. The idea is simple: welcome writers, listen to their publishing experiences, run gentle reading and writing gatherings, and improve what isn't working.</p>
    <p>Start writing now. A separate Founding Writers enrollment or badge is not being promised through this page.</p>
    <div className="writer-circle-actions"><Link to={session?'/writing':'/login?mode=signup&next=%2Fwriting'}>Create a manuscript →</Link><Link to="/beta">Give feedback on the Palace →</Link></div>
   </div>
  </section>

  <section className="writer-welcome-faq">
   <div className="writer-section-heading"><p className="writer-eyebrow">BEFORE YOU BEGIN</p><h2>Good questions deserve clear answers.</h2></div>
   <div className="writer-faq-items">{COMMON_QUESTIONS.map(item=><details key={item.question}>
    <summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
   <p className="writer-terms-note">Please review the <Link to="/code">Palace Code</Link> and the writing settings before publishing. For help testing a feature, use the <Link to="/beta">beta feedback guide</Link>.</p>
  </section>
 </div>;
}

export function FirstManuscriptGuide({works}){
 if(!Array.isArray(works))return null;
 const hasWork=works.length>0;
 const hasChapter=works.some(w=>(w.chapters||[]).length>0);
 const hasPublished=works.some(w=>w.publication_status==='published'||(w.chapters||[]).some(c=>c.status==='published'));
 if(hasPublished)return null;
 const progress=hasWork?(hasChapter?2:1):0;
 return <aside className="writer-first-manuscript-guide" aria-label="Optional guide to first published chapter">
  <div><span className="writer-eyebrow">A GENTLE START</span><h2>Your first chapter, your own pace.</h2>
   <p>{progress===0?'Create a private manuscript to begin.':progress===1?'Your story has a place. Give it a first chapter.':'Your manuscript has begun. Revise, add tags and publish only when you are ready.'}</p>
  </div>
  <div className="writer-manuscript-steps">
   <span className={hasWork?'completed':''}>{hasWork?'✓':'1'} Draft</span>
   <span className={hasChapter?'completed':''}>{hasChapter?'✓':'2'} Chapter</span>
   <span>3 Publish when ready</span>
  </div>
  <Link to="/writers">Writer’s Door and publishing guide →</Link>
 </aside>;
}
