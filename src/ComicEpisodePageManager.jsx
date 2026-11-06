import React,{useEffect,useState} from 'react';
import {getComicStudioPagePreviews} from './palaceData';
import {PalaceDialog} from './PalaceLivePrimitives';
import './comic-page-manager.css';

export function movedComicPageIds(pages,fromId,toId){
 const ids=(pages||[]).map(p=>p.id);
 const from=ids.indexOf(fromId),to=ids.indexOf(toId);
 if(from<0||to<0||from===to)return ids;
 const [moved]=ids.splice(from,1);ids.splice(ids.indexOf(toId),0,moved);
 return ids;
}

/** Private editor: page assets are requested only after the creator opens the visual view. */
export default function ComicEpisodePageManager({userId,comicId,episode,pages,onReorder,onEdit,onRemove}){
 const [visual,setVisual]=useState(false),[urls,setUrls]=useState({});
 const [loading,setLoading]=useState(false),[loadError,setLoadError]=useState('');
 const [preview,setPreview]=useState(null),[dragged,setDragged]=useState(null);
 const [saving,setSaving]=useState(false);
 const pathSignature=pages.map(x=>x.reader_path).join('|');
 useEffect(()=>{
  if(!visual)return;
  let active=true;
  setLoading(true);setLoadError('');setUrls({});
  getComicStudioPagePreviews(userId,comicId,episode.id,pages)
   .then(next=>{if(active)setUrls(next)})
   .catch(e=>{if(active)setLoadError(String(e?.message||'Could not load page previews.'))})
   .finally(()=>{if(active)setLoading(false)});
  return ()=>{active=false};
 },[visual,userId,comicId,episode.id,pathSignature]);
 const commit=async ids=>{
  if(saving||ids.every((x,i)=>x===pages[i]?.id))return;
  setSaving(true);
  try{await onReorder(ids)}catch{/* The episode editor displays the save error. */}finally{setSaving(false)}
 };
 const move=async (index,offset)=>{
  const target=index+offset;
  if(target<0||target>=pages.length)return;
  const ids=pages.map(x=>x.id);[ids[index],ids[target]]=[ids[target],ids[index]];await commit(ids);
 };
 return <section className="comic-visual-manager" aria-label={'Page manager for '+episode.title}>
  <header className="comic-visual-manager-heading">
   <div><strong>Episode pages</strong><p>{pages.length} page{pages.length===1?'':'s'} · {visual?'Select a thumbnail to inspect it. Drag a page to reorder, or use the arrow buttons.':'Open the visual view to inspect your uploaded artwork and page order.'}</p></div>
   {pages.length>0&&<button type="button" className="outline-button" aria-pressed={visual} onClick={()=>setVisual(v=>!v)}>{visual?'Compact list':'Show page thumbnails'}</button>}
  </header>
  {loading&&<p role="status">Loading your private page previews…</p>}
  {loadError&&<p role="alert">{loadError} Page captions and ordering remain available.</p>}
  {saving&&<p role="status">Saving page order…</p>}
  {pages.length===0?<p className="comic-pages-empty">No artwork uploaded yet. Use <strong>Add comic pages</strong> above to add the first page.</p>:
   <div className={visual?'comic-page-tiles':'comic-page-list'}>
   {pages.map((page,index)=><article key={page.id} className="comic-page-tile"
    draggable={visual&&!saving}
    onDragStart={e=>{if(!visual||saving)return;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(page.id));setDragged(page.id)}}
    onDragOver={e=>{if(visual&&dragged&&dragged!==page.id)e.preventDefault()}}
    onDrop={e=>{e.preventDefault();if(dragged&&dragged!==page.id)void commit(movedComicPageIds(pages,dragged,page.id));setDragged(null)}}
    onDragEnd={()=>setDragged(null)}>
    <div className="comic-page-tile-top">
     {visual&&<button type="button" className="comic-page-thumbnail" disabled={!urls[page.reader_path]} onClick={()=>setPreview(page)} aria-label={'Preview page '+(index+1)}>
      {urls[page.reader_path]?<img src={urls[page.reader_path]} alt="" loading="lazy"/>:<span aria-hidden="true">▤</span>}
     </button>}
     <div className="comic-page-tile-detail"><small>PAGE {String(index+1).padStart(2,'0')}</small>
      <strong>{page.caption||page.alt_text||'Untitled comic page'}</strong>
      <small>{page.decorative?'Decorative artwork':page.alt_text?'Image description added':'Description missing'}</small>
     </div>
    </div>
    <div className="comic-page-tile-actions">
     <button type="button" disabled={saving||index===0} onClick={()=>move(index,-1)} aria-label={'Move page '+(index+1)+' earlier'}>↑</button>
     <button type="button" disabled={saving||index===pages.length-1} onClick={()=>move(index,1)} aria-label={'Move page '+(index+1)+' later'}>↓</button>
     <button type="button" onClick={()=>onEdit(page)}>Edit</button>
     <button type="button" onClick={()=>onRemove(page)}>Remove</button>
    </div>
   </article>)}
   </div>}
  <PalaceDialog open={!!preview} title={'Preview · Page '+(preview?pages.findIndex(p=>p.id===preview.id)+1:0)} eyebrow="PRIVATE COMIC STUDIO PREVIEW" onClose={()=>setPreview(null)}
   actions={<button type="button" onClick={()=>setPreview(null)}>Close preview</button>}>
   {preview&&urls[preview.reader_path]&&<div className="comic-page-lightbox"><img src={urls[preview.reader_path]} alt={preview.alt_text||'Comic page preview'}/>{preview.caption&&<p>{preview.caption}</p>}</div>}
  </PalaceDialog>
 </section>;
}
