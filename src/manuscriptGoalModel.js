/** Chapter goals are browser preferences, never a cloud manuscript edit. */
export function cleanManuscriptGoal(input){
 const digits=String(input??'').replace(/[^0-9]/g,'').slice(0,10);
 if(!digits)return '';
 return String(Math.min(1000000,Number(digits)));
}
export function manuscriptGoalProgress(words,goal){
 const count=Number.isFinite(Number(words))?Math.max(0,Math.floor(Number(words))):0;
 const target=Number(cleanManuscriptGoal(goal))||0;
 const percent=target?Math.min(100,Math.round(count/target*100)):0;
 return{target,percent,remaining:Math.max(0,target-count)};
}
