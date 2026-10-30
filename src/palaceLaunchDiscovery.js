/**
 * Find an honest first reading recommendation from already-public works.
 * This is a deterministic discovery suggestion, not a paid placement,
 * popularity ranking, editor endorsement or claim of short length.
 */
export function choosePalaceStartingStory(works=[]) {
 const candidates=(Array.isArray(works)?works:[]).filter(w=>
  w && w.slug && w.title && typeof w.summary==='string' && w.summary.trim() &&
  w.publication_status==='published' && w.visibility==='public' &&
  w.completion_status==='complete' &&
  w.rating==='general' && ['original','poetry','fanwork'].includes(w.work_type)
 );
 // Existing query is chronological. Keep that order; don't invent statistics.
 return candidates[0]||null;
}
export function palaceStoryPath(slug) {
 const safe=String(slug||'').trim();
 if(!safe||safe==='.'||safe==='..'||safe.includes('/')||safe.includes('\\')||safe.includes('?')||safe.includes('#'))return '/reading';
 return '/work/'+encodeURIComponent(safe);
}
export const PALACE_FIRST_READING_DOORS=Object.freeze([
 {id:'original',symbol:'✦',title:'Original fiction',description:'Find a new world and its storyteller.',href:'/reading'},
 {id:'fanworks',symbol:'◈',title:'Fanfiction & fandoms',description:'Meet familiar worlds through new voices.',href:'/fandoms'},
 {id:'comics',symbol:'▤',title:'Comics & visual stories',description:'Read stories told in pictures.',href:'/comics'}
]);
