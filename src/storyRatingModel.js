const RATING_LABELS=Object.freeze({
 general:'General',teen:'Teen',mature:'Mature',explicit:'Explicit',not_rated:'Not rated'
});
const clean=rating=>String(rating||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
export function storyRatingInfo(rating){
 const code=clean(rating);
 const key=Object.prototype.hasOwnProperty.call(RATING_LABELS,code)?code:'not_rated';
 return {key,label:RATING_LABELS[key]};
}

/** Compact marks for book-cover corners; full labels remain available. */
const RATING_MARKS=Object.freeze({general:'G',teen:'T',mature:'M',explicit:'E',not_rated:'NR'});
export function storyRatingMark(rating){
 return RATING_MARKS[storyRatingInfo(rating).key];
}
