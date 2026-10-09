import React from 'react';
import {writerReleaseVisibility} from './writerReleaseVisibility';
import './writer-release-info.css';

export default function WriterReleaseInfo({work}){
 const summary=writerReleaseVisibility(work);
 return <section className="writer-release-clarity" aria-label="Chapter publication visibility">
  <div><strong>Who can read this work?</strong><span>{summary.label}</span></div>
  <p>{summary.access}</p>
  {summary.notice&&<p className="writer-release-work-warning">{summary.notice}</p>}
  <small>Changing a chapter's publication state does not change the work's visibility. To change it, open Work settings.</small>
 </section>;
}
