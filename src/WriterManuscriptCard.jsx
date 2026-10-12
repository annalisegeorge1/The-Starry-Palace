import React from 'react';
import {Link} from 'react-router-dom';
import {chooseWritingResumeTarget,resumeWritingPath} from './writingReturnModel';
export function manuscriptCardDetails(work){
 const chapters=(Array.isArray(work.chapters)?work.chapters:[]).filter(Boolean);
 const scheduled=work.publication_status==='archived'?[]:chapters.filter(ch=>ch.status!=='published'&&ch.scheduled_for&&Number.isFinite(Date.parse(ch.scheduled_for))).sort((a,b)=>Date.parse(a.scheduled_for)-Date.parse(b.scheduled_for));
 const published=chapters.filter(ch=>ch.status==='published').length;
 const words=chapters.reduce((sum,ch)=>sum+Math.max(0,Number(ch.word_count)||0),0);
 return {chapters,published,unpublished:chapters.length-published,words,scheduled,target:chooseWritingResumeTarget([work])};
}
export default function WriterManuscriptCard({work,onInvite}){
 const details=manuscriptCardDetails(work);
 const archived=work.publication_status==='archived';
 const workPath='/writing/'+encodeURIComponent(work.slug);
 const date=new Date(work.updated_at);
 return <article className={'writer-work-card'+(details.scheduled.length?' has-scheduled-release':'')}>
  <header className="writer-work-card-head"><span>{({fanwork:'Fanwork',poetry:'Poetry',essay:'Essay',original:'Original work',other:'Other work'})[work.work_type]||'Work'}</span><span className={'writer-work-state is-'+(work.publication_status||'draft')}>{archived?'Archived':work.publication_status==='published'?'Published':'Draft'} · {work.visibility||'visibility not set'}</span></header>
  <div className="writer-work-card-copy"><h2><Link to={workPath}>{work.title||'Untitled work'}</Link></h2><p>{work.summary||'Add a summary in your work settings when you are ready.'}</p></div>
  <dl className="writer-work-card-stats"><div><dt>Words</dt><dd>{details.words.toLocaleString()}</dd></div><div><dt>Published chapters</dt><dd>{details.published}</dd></div><div><dt>Unpublished chapters</dt><dd>{details.unpublished}</dd></div></dl>
  {details.scheduled[0]&&<Link className="writer-work-release" to={workPath+'?chapter='+encodeURIComponent(details.scheduled[0].id)}><span aria-hidden="true">◷</span><span><strong>{details.scheduled[0].title||'Scheduled chapter'}</strong>{' '}<small>Scheduled · {new Date(details.scheduled[0].scheduled_for).toLocaleString()}</small></span><span aria-hidden="true">↗</span></Link>}
  <footer className="writer-work-card-footer"><span>{Number.isFinite(date.getTime())?'Updated '+date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Your manuscript'} · {(work.completion_status||'in_progress').replaceAll('_',' ')}</span><div><Link className="writer-work-resume" to={archived?workPath:resumeWritingPath(details.target)}>{archived?'Manage archived work':details.target?.chapter?'Continue chapter':'Open work'} <span aria-hidden="true">→</span></Link><details className="writer-work-menu"><summary aria-label={'More actions for '+(work.title||'Untitled work')}>More <span aria-hidden="true">⌄</span></summary><div><Link to={workPath}>Manage work</Link>{work.publication_status==='published'&&<Link to={'/work/'+encodeURIComponent(work.slug)}>View story</Link>}{!archived&&<button type="button" onClick={()=>onInvite(work.id)}>Invite co-writer</button>}</div></details></div></footer>
 </article>;
}
