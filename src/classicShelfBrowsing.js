/**
 * Client-only Palace Classics library selection. Never changes archival records.
 * Match source-supplied author, title, summary and reviewed collection tags.
 */
export const CLASSIC_LIBRARY_COLLECTIONS=[
 {
  "id": "famous",
  "glyph": "✦",
  "label": "Famous Classics",
  "terms": [
   "pride and prejudice",
   "jane eyre",
   "wuthering heights",
   "frankenstein",
   "dracula",
   "great expectations",
   "a tale of two cities",
   "sherlock holmes",
   "little women",
   "moby-dick",
   "count of monte cristo",
   "don quixote",
   "crime and punishment",
   "brothers karamazov",
   "anna karenina",
   "war and peace",
   "les misérables",
   "les miserables",
   "the great gatsby",
   "alice's adventures",
   "wizard of oz",
   "treasure island",
   "time machine",
   "war of the worlds",
   "peter pan",
   "secret garden",
   "scarlet letter",
   "vanity fair",
   "tess of the d'urbervilles",
   "far from the madding crowd",
   "heart of darkness",
   "carmilla",
   "yellow wallpaper",
   "importance of being earnest",
   "room with a view",
   "howards end",
   "jungle book",
   "robinson crusoe",
   "twenty thousand leagues",
   "around the world in eighty days",
   "hunchback of notre",
   "madame bovary",
   "hamlet",
   "macbeth",
   "romeo and juliet",
   "midsummer night",
   "grimms",
   "andersen",
   "black beauty",
   "little princess",
   "wind in the willows",
   "pinocchio",
   "sleepy hollow",
   "iliad",
   "divine comedy"
  ]
 },
 {
  "id": "all",
  "glyph": "⌁",
  "label": "All Classics",
  "terms": []
 },
 {
  "id": "gothic",
  "glyph": "◐",
  "label": "Gothic & Strange",
  "terms": [
   "gothic",
   "horror",
   "strange",
   "phantom",
   "dracula",
   "frankenstein",
   "jekyll",
   "turn of the screw",
   "dorian"
  ]
 },
 {
  "id": "adventure",
  "glyph": "⚓",
  "label": "Adventure & Epic",
  "terms": [
   "adventure",
   "musketeers",
   "monte cristo",
   "moby",
   "treasure",
   "call of the wild",
   "white fang",
   "quixote"
  ]
 },
 {
  "id": "society",
  "glyph": "☕",
  "label": "Society & Romance",
  "terms": [
   "classic novel",
   "romance",
   "society",
   "austen",
   "brontë",
   "wharton",
   "awakening",
   "middlemarch",
   "gatsby"
  ]
 },
 {
  "id": "wonder",
  "glyph": "✦",
  "label": "Children & Wonder",
  "terms": [
   "childrens",
   "fantasy",
   "wonderland",
   "wizard",
   "anne of green gables"
  ]
 },
 {
  "id": "translated",
  "glyph": "◇",
  "label": "Translated Worlds",
  "terms": [
   "translated",
   "tolstoy",
   "dostoevsky",
   "cervantes",
   "dumas",
   "pu songling"
  ]
 },
 {
  "id": "chinese",
  "glyph": "☾",
  "label": "Chinese Classics",
  "terms": [
   "chinese",
   "luo guanzhong",
   "cao xueqin",
   "pu songling",
   "journey to the west",
   "three kingdoms",
   "red chamber",
   "mission to heaven"
  ]
 },
 {
  "id": "black-caribbean",
  "glyph": "✺",
  "label": "Black & Caribbean",
  "terms": [
   "black caribbean",
   "caribbean folklore",
   "black short fiction",
   "black memoir",
   "black atlantic",
   "black essays",
   "mary prince",
   "mary seacole",
   "jamaican",
   "annancy",
   "chesnutt",
   "douglass",
   "harriet jacobs",
   "equiano",
   "du bois"
  ]
 },
 {
  "id": "short",
  "glyph": "✧",
  "label": "Short Works",
  "terms": [
   "short story",
   "novella",
   "juvenilia",
   "collected works",
   "scandal in bohemia",
   "benjamin button"
  ]
 }
];
export const CLASSIC_SHELF_PAGE_SIZE=8;
export function normalizeClassicSearch(value){
 return String(value??'').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
export function classicBookSearchText(work={}){
 const tags=(work.work_tags||[]).map(x=>x?.tags).filter(x=>x&&['canonical','community'].includes(x.status));
 return normalizeClassicSearch([
  work.title,work.summary,work.language,
  work.creator_name,work.profiles?.display_name,
  ...tags.flatMap(t=>[t.name,t.category])
 ].filter(Boolean).join(' '));
}
export function filterClassicShelf(works=[],collection=CLASSIC_LIBRARY_COLLECTIONS[0],query='',order='author'){
 const words=normalizeClassicSearch(query);
 const terms=(collection?.terms||[]).map(normalizeClassicSearch).filter(Boolean);
 const results=(Array.isArray(works)?works:[]).filter(w=>{
  const hay=classicBookSearchText(w);
  return (!terms.length||terms.some(t=>hay.includes(t)))&&(!words||words.split(' ').every(part=>hay.includes(part)));
 });
 const titles=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),undefined,{sensitivity:'base'});
 const author=(a,b)=>String(a.creator_name||a.profiles?.display_name||'').localeCompare(
  String(b.creator_name||b.profiles?.display_name||''),undefined,{sensitivity:'base'});
 return results.sort((a,b)=>order==='title'?titles(a,b)||author(a,b):author(a,b)||titles(a,b));
}
export function pageClassicShelf(works=[],requestedPage=0,pageSize=CLASSIC_SHELF_PAGE_SIZE){
 const source=Array.isArray(works)?works:[];
 const size=Math.max(1,Math.min(30,Math.floor(Number(pageSize)||CLASSIC_SHELF_PAGE_SIZE)));
 const pages=Math.max(1,Math.ceil(source.length/size));
 const parsed=Number(requestedPage);
 const page=Math.max(0,Math.min(pages-1,Number.isFinite(parsed)?Math.floor(parsed):0));
 const start=page*size;
 return {items:source.slice(start,start+size),page,pages,total:source.length,
  first:source.length?start+1:0,last:Math.min(source.length,start+size),
  hasPrevious:page>0,hasNext:page<pages-1};
}
