/** Stable, shareable tag URLs. Names can change; UUID identity doesn't. */
export const TAG_UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function tagWorldPath(tag){
 const id=typeof tag==='string'?tag:tag?.id;
 return TAG_UUID.test(String(id||''))?'/tag/'+String(id).toLowerCase():null;
}
export const TAG_WORLD_LABELS={
 fandom:'Fandom',character:'Character',relationship:'Relationship',
 warning:'Content warning',genre:'Genre',trope:'Trope',mood:'Mood',
 setting:'Setting',theme:'Theme',additional:'Additional tag',
 identity:'Identity',era:'Era',accessibility:'Accessibility',
 language:'Language',format:'Format'
};
