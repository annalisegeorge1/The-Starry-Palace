/**
 * The RPC returns only giving/receiving/participation subtotals.
 * Chapter-reading rewards enter the earlier 'legacy' channel. Display the
 * remaining lifetime points rather than an incomplete three-column sum.
 */
const whole=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0};
export function celestialPointBreakdown(account){
 const lifetime=whole(account?.lifetime_points);
 const giving=whole(account?.giving_points);
 const receiving=whole(account?.receiving_points);
 const participation=whole(account?.participation_points);
 const earlierAndReading=Math.max(0,lifetime-giving-receiving-participation);
 return [
  {id:'giving',label:'Giving light',points:giving},
  {id:'receiving',label:'Light received',points:receiving},
  {id:'participation',label:'Participation',points:participation},
  {id:'legacy',label:'Reading & earlier points',points:earlierAndReading}
 ];
}
export const CELESTIAL_CREATIVE_RULES=[
 {id:'publish',name:'Publish a chapter',reward:'+20',detail:'At least 150 words in a published chapter of a public work. Writing rewards are capped at 60 per UTC day.'},
 {id:'revise',name:'Grow a published chapter',reward:'+10',detail:'At least 150 additional words when you save an already published chapter. At most once per chapter in 24 hours, within the writing daily cap.'},
 {id:'read',name:'Finish an eligible chapter',reward:'+2',detail:'At least 200 words, another author, public and published. Spend at least 90 seconds reading; one reward per chapter, up to 20 reading points per UTC day.'}
];
