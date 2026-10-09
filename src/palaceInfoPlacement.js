/*
 * Keep Palace help panels inside the visible browser viewport.
 * Popovers are portalled to <body> so transformed/scrolling Palace panels
 * cannot crop or move them outside the phone screen.
 */
export function palaceInfoPlacement(rect,viewport,contentHeight=360){
 const w=Math.max(1,Number(viewport?.width)||360);
 const h=Math.max(1,Number(viewport?.height)||640);
 const margin=Math.min(14,Math.floor(w/8));
 const gap=9;
 const width=Math.max(1,Math.min(360,w-margin*2));
 const centre=Number(rect?.left||0)+Number(rect?.width||0)/2;
 const left=Math.max(margin,Math.min(Math.round(centre-width/2),w-width-margin));
 const above=Math.max(0,(Number(rect?.top)||0)-gap-margin);
 const below=Math.max(0,h-(Number(rect?.bottom)||0)-gap-margin);
 const desired=Math.max(72,Math.min(Number(contentHeight)||360,460));
 const placeBelow=below>=Math.min(desired,220)||below>=above;
 const available=Math.max(70,Math.min(460,placeBelow?below:above));
 const maxHeight=Math.max(1,Math.min(available,h-margin*2));
 const desiredTop=placeBelow?(Number(rect?.bottom)||0)+gap:(Number(rect?.top)||0)-gap-Math.min(desired,maxHeight);
 const top=Math.max(margin,Math.min(Math.round(desiredTop),h-margin-maxHeight));
 return {left,top,width,maxHeight,placement:placeBelow?'below':'above'};
}
