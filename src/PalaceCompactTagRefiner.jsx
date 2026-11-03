import React,{useMemo,useState} from 'react';
import {splitTagQueries,matchesTagQueries,exactTagQueryMatches} from './multiTagSearch';

const QUICK_CATEGORIES=new Set(['fandom','character','relationship','warning','genre']);
const LANES=[['include','Include'],['exclude','Exclude']];
// Search Room refines gathered story/comic results. It never claims to search
// the full archive or infer tags not present in published metadata.
export default function PalaceCompactTagRefiner({facets=[],included=[],excluded=[],onToggle}){
 const [queries,setQueries]=useState({include:'',exclude:''});
 const [expanded,setExpanded]=useState({});
 const allTags=useMemo(()=>{
  const found=new Map();
  for(const group of facets)for(const tag of group.tags||[])
   if(tag?.id&&tag?.name)found.set(String(tag.id),{...tag,category:tag.category||group.category});
  return [...found.values()];
 },[facets]);
 const choice=(tag,mode)=>{
  const selected=(mode==='include'?included:excluded).includes(tag.id);
  const opposite=(mode==='include'?excluded:included).includes(tag.id);
  return <label className={'palace-compact-tag-choice'+(selected?' is-selected':'')} key={tag.id}>
   <input type="checkbox" checked={selected} onChange={()=>onToggle(tag.id,mode)}
    aria-label={(mode==='include'?'Include ':'Exclude ')+tag.name}/>
   <span className="palace-compact-tag-name">{tag.name}</span>
   {tag.count!=null&&<small>({tag.count})</small>}
   {!selected&&opposite&&<small className="palace-compact-tag-opposite">{mode==='include'?'Excluded':'Included'}</small>}
  </label>;
 };
 return <div className="palace-compact-tag-refiner" aria-label="Include and exclude story tags">
  {LANES.map(([mode,label])=>{
   const query=queries[mode].trim().toLocaleLowerCase();
   const selected=mode==='include'?included:excluded;
   const chosen=allTags.filter(tag=>selected.includes(tag.id));
   const terms=splitTagQueries(queries[mode]);
   const matches=query?allTags.filter(tag=>matchesTagQueries(tag.name,queries[mode])).sort((a,b)=>{
    const rank=t=>terms.some(term=>t.name.toLocaleLowerCase()===term)?0:terms.some(term=>t.name.toLocaleLowerCase().startsWith(term))?1:2;
    return rank(a)-rank(b)||a.name.localeCompare(b.name);
   }):[];
   const {matches:exactMatches,unresolved}=exactTagQueryMatches(matches,queries[mode]);
   const exactToAdd=exactMatches.filter(tag=>!selected.includes(tag.id));
   return <details key={mode} className={'palace-compact-tag-lane '+mode} defaultOpen={mode==='include'}>
    <summary><span>{label} tags</span>{selected.length>0&&<small>{selected.length} chosen</small>}</summary>
    <div className="palace-compact-tag-lane-body">
     <label className="palace-compact-tag-search" htmlFor={'search-room-tag-'+mode}>
      Search a tag to {mode}
      <input id={'search-room-tag-'+mode} type="search" value={queries[mode]}
       onChange={e=>setQueries(prev=>({...prev,[mode]:e.target.value}))}
       placeholder="Try Richonne, Slow Burn, Found Family…"/>
     </label>
     {chosen.length>0&&<div className="palace-compact-tag-selected" aria-label={label+' selected tags'}>
      {chosen.map(tag=><button type="button" key={tag.id} onClick={()=>onToggle(tag.id,mode)}
       aria-label={'Remove '+(mode==='include'?'included ':'excluded ')+tag.name}>{tag.name} <span aria-hidden="true">×</span></button>)}
     </div>}
     {query?<div className="palace-compact-tag-matches" role="group" aria-label={label+' matching tags'}>
       <small role="status">{matches.length} matching {matches.length===1?'tag':'tags'} · commas or semicolons separate names</small>
       {exactToAdd.length>0&&<button type="button" onClick={()=>exactToAdd.forEach(tag=>onToggle(tag.id,mode))}>Add {exactToAdd.length} exact {exactToAdd.length===1?'tag':'tags'} to {mode}</button>}
       {unresolved.length>0&&<small>Choose a suggestion for: {unresolved.join(', ')}</small>}
       {matches.map(tag=>choice(tag,mode))}
       {matches.length===0&&<p>No matching tags in these results. Try a shorter name.</p>}
      </div>:<div className="palace-compact-tag-categories">
       {facets.filter(group=>QUICK_CATEGORIES.has(group.category)).map(group=>{
        const key=mode+':'+group.category,showAll=Boolean(expanded[key]);
        const checked=group.tags.filter(tag=>selected.includes(tag.id));
        const rest=group.tags.filter(tag=>!selected.includes(tag.id));
        const visible=showAll?group.tags:[...checked,...rest.slice(0,Math.max(0,5-checked.length))];
        return <details key={key} className="palace-compact-tag-category">
         <summary><span>{group.label}</span><small>{group.tags.length}</small></summary>
         <div className="palace-compact-tag-choices">
          {visible.map(tag=>choice(tag,mode))}
          {group.tags.length>5&&<button type="button" className="palace-compact-tags-more"
           onClick={()=>setExpanded(prev=>({...prev,[key]:!showAll}))}>
           {showAll?'Show fewer':'Show all '+group.tags.length+' '+group.label.toLowerCase()}
          </button>}
         </div>
        </details>;
       })}
       {!facets.some(group=>QUICK_CATEGORIES.has(group.category))&&<p className="palace-compact-tag-note">Search above to find a specific tag.</p>}
      </div>}
     <p className="palace-compact-tag-note">Only tags on gathered story and comic results are shown. Full-archive tag search is in Reading Rooms.</p>
    </div>
   </details>;
  })}
 </div>;
}
