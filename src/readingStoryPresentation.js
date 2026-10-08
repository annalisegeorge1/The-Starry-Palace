/**
 * Reader-facing labels share one source of truth across featured shelves and
 * the main Reading Room. Never infer a fandom or completion status.
 */
const RATINGS={general:'General',teen:'Teen',mature:'Mature',explicit:'Explicit'};
const STATES={complete:'Complete',in_progress:'In progress',hiatus:'On hiatus'};
const TYPES={original:'Original work',fanwork:'Fanwork',poetry:'Poetry',essay:'Essay',other:'Other'};
export function readingStoryPresentation(work={}){
 const tags=(work.work_tags||[]).map(x=>x?.tags).filter(t=>t?.name&&['canonical','community'].includes(t.status));
 const fandoms=[...new Set(tags.filter(t=>t.category==='fandom').map(t=>String(t.name).trim()).filter(Boolean))];
 return {
  kind:work.is_archive?'Palace Classic':TYPES[work.work_type]||'Story',
  fandoms,
  rating:RATINGS[work.rating]||'Not rated',
  status:STATES[work.completion_status]||'Status not specified',
  language:String(work.language||'').trim()||null,
  summary:String(work.summary||'').trim()||(work.is_archive?'A classic from the Palace archives.':'No summary provided by the writer yet.')
 };
}
