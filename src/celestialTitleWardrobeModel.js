/** A visible point threshold is not the same thing as a recorded title grant. */
export function celestialTitleWearState(title,points=0,currentTitle=''){
 if(!title||!title.title)return 'locked';
 if(title.title===currentTitle)return 'worn';
 if(title.entitled===true)return 'available';
 const need=Math.max(0,Number(title.celestial_points_required)||0);
 return Number(points)>=need?'pending':'locked';
}
export function availableTitleChoices(options=[]){
 const titles=Array.isArray(options)?options:[];
 const unique=new Set();
 return titles.filter(t=>{
  if(!t||typeof t.title!=='string'||!t.title.trim()||unique.has(t.title))return false;
  unique.add(t.title);return t.public_selectable===true||t.entitled===true;
 });
}
