/** Reader-facing consequences of release settings; no publication action. */
export function writerReleaseVisibility(work={}){
 const visibility=String(work.visibility||'private').toLowerCase();
 const access=visibility==='public'
  ?'The work is set to Public. Once the chapter and work are published, it may be available to public readers.'
  :visibility==='members'
   ?'The work is set to Members. Chapter publication does not make it publicly accessible to everyone.'
   :'The work is Private. Publishing a chapter does not change the work to Public.';
 const workStatus=String(work.publication_status||'').toLowerCase();
 const notice=workStatus&&workStatus!=='published'
  ?'The work itself is not marked published. Check Work settings if you want readers to discover it.'
  :null;
 return {label:visibility==='public'?'Public':visibility==='members'?'Members only':'Private',access,notice};
}
