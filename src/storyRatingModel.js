const RATING_LABELS=Object.freeze({
 general:'General',teen:'Teen',mature:'Mature',explicit:'Explicit',not_rated:'Not rated'
});
const clean=rating=>String(rating||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
export function storyRatingInfo(rating){
 const code=clean(rating);
 const key=Object.prototype.hasOwnProperty.call(RATING_LABELS,code)?code:'not_rated';
 return {key,label:RATING_LABELS[key]};
}
