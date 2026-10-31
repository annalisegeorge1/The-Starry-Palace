import React from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import terms from '../docs/legal/terms-of-service.md?raw';
import privacy from '../docs/legal/privacy-policy.md?raw';
import rules from '../docs/legal/site-rules.md?raw';
import cookies from '../docs/legal/cookie-notice.md?raw';
import ai from '../docs/legal/ai-policy.md?raw';
import support from '../docs/legal/donation-rules.md?raw';
import './palace-legal-pages.css';

const policies=[
 {id:'terms',title:'Terms of Service',summary:'Accounts, publishing, creator rights, community conduct and moderation.',content:terms},
 {id:'privacy',title:'Privacy Policy',summary:'Account information, age checks, drafts, service providers and privacy requests.',content:privacy},
 {id:'rules',title:'Site Rules',summary:'The community standards members agree to follow.',content:rules},
 {id:'cookies',title:'Cookies and Browser Storage',summary:'Sign-in storage, device preferences and browser controls.',content:cookies},
 {id:'ai',title:'Artificial Intelligence Policy',summary:'How the Palace protects creative work and limits AI use.',content:ai},
 {id:'support',title:'Voluntary Support and Donation Rules',summary:'External creator links, voluntary payments and Palace gifts.',content:support},
];

function inline(text,key){
 const pattern=/\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
 const out=[];let start=0,match,n=0;
 while((match=pattern.exec(text))){if(match.index>start)out.push(text.slice(start,match.index));
  if(match[1]){const href=match[2];const safe=/^(https?:\/\/|mailto:|\/)/i.test(href);out.push(safe?<a key={`${key}-${n++}`} href={href} {...(/^https?:/i.test(href)?{target:'_blank',rel:'noreferrer'}:{})}>{match[1]}</a>:match[1]);}
  else if(match[3])out.push(<strong key={`${key}-${n++}`}>{match[3]}</strong>);
  else if(match[4])out.push(<code key={`${key}-${n++}`}>{match[4]}</code>);
  else out.push(<em key={`${key}-${n++}`}>{match[5]}</em>);
  start=pattern.lastIndex;
 }
 if(start<text.length)out.push(text.slice(start));return out;
}

function MarkdownContent({source}){
 const displaySource=source.replace(/^# THE STARRY PALACE\s*\r?\n## [^\r\n]+\s*\r?\n/,'');
 const lines=displaySource.split(/\r?\n/);const out=[];let paragraph=[],list=[],listType='',key=0;
 const flushParagraph=()=>{if(paragraph.length){out.push(<p key={`p-${key++}`}>{inline(paragraph.join(' '),`i-${key}`)}</p>);paragraph=[]}};
 const flushList=()=>{if(!list.length)return;const items=list;const type=listType;list=[];listType='';const Item=type==='ol'?'ol':'ul';out.push(<Item key={`l-${key++}`}>{items.map((item,i)=><li key={i}>{inline(item,`li-${key}-${i}`)}</li>)}</Item>)};
 for(const line of lines){
  if(!line.trim()){flushParagraph();flushList();continue}
  if(/^---+$/.test(line.trim())){flushParagraph();flushList();out.push(<hr key={`hr-${key++}`}/>);continue}
  const heading=line.match(/^(#{1,3})\s+(.+)$/);
  if(heading){flushParagraph();flushList();const level=heading[1].length;const title=heading[2].replace(/\s+#+$/,'');const H=`h${level}`;out.push(<H key={`h-${key++}`}>{inline(title,`hi-${key}`)}</H>);continue}
  const unordered=line.match(/^\s*[-*]\s+(.+)$/);const ordered=line.match(/^\s*\d+[.)]\s+(.+)$/);
  if(unordered||ordered){flushParagraph();const type=ordered?'ol':'ul';if(listType&&listType!==type)flushList();listType=type;list.push((unordered||ordered)[1]);continue}
  if(line.startsWith('>')){flushParagraph();flushList();out.push(<blockquote key={`b-${key++}`}>{inline(line.replace(/^>\s?/,'').trim(),`bi-${key}`)}</blockquote>);continue}
  paragraph.push(line.trim());
 }
 flushParagraph();flushList();return <div className="palace-legal-content">{out}</div>;
}

export function PalaceLegalPages(){
 const{policy}=useParams();
 if(policy&&!policies.some(p=>p.id===policy))return <Navigate to="/legal" replace/>;
 const selected=policies.find(p=>p.id===policy);
 return <main className="palace-legal-shell">
  <header className="palace-legal-intro"><p className="eyebrow">THE STARRY PALACE · POLICIES</p><h1>{selected?.title||'Policies and notices'}</h1><p>{selected?.summary||'Clear rules for your account, creative work, privacy and community participation.'}</p></header>
  <nav className="palace-legal-nav" aria-label="Policies and notices">{policies.map(item=><Link key={item.id} to={`/legal/${item.id}`} aria-current={policy===item.id?'page':undefined} className={policy===item.id?'active':''}>{item.title}</Link>)}</nav>
  {selected?<article className="palace-legal-paper"><MarkdownContent source={selected.content}/><footer>Questions about this policy? Contact <a href="mailto:annalise.pierre.28@gmail.com">annalise.pierre.28@gmail.com</a>.</footer></article>:<section className="palace-legal-cards">{policies.map(item=><Link key={item.id} to={`/legal/${item.id}`}><span>✦</span><div><h2>{item.title}</h2><p>{item.summary}</p></div><b aria-hidden="true">→</b></Link>)}</section>}
 </main>;
}

export default PalaceLegalPages;
