/** Center a Library tab horizontally without scrolling the entire page. */
export function libraryTabScrollLeft({railWidth=0,railLeft=0,tabLeft=0,tabWidth=0}={}){
 const w=Number(railWidth),l=Number(railLeft),t=Number(tabLeft),tw=Number(tabWidth);
 if(![w,l,t,tw].every(Number.isFinite)||w<=0)return 0;
 return Math.max(0,Math.round(t-l-(w-tw)/2));
}
