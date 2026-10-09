/** A poll is a real conversation, not a set of duplicate or empty options. */
export function validateCommonsPollChoices(source=[]){
 const options=(Array.isArray(source)?source:[]).map(x=>String(x||'').trim()).filter(Boolean);
 if(options.length<2)return {valid:false,choices:options,message:'Add at least two poll choices.'};
 if(options.length>6)return {valid:false,choices:options,message:'A Palace poll can have at most six choices.'};
 if(options.some(x=>x.length>120))return {valid:false,choices:options,message:'Keep each poll choice within 120 characters.'};
 const keys=options.map(x=>x.toLocaleLowerCase().replace(/\s+/g,' '));
 if(new Set(keys).size!==keys.length)return {valid:false,choices:options,message:'Each poll choice needs to be different.'};
 return {valid:true,choices:options,message:''};
}
export function restoreCommonsPollOptions(value){
 if(!Array.isArray(value))return ['',''];
 const entries=value.slice(0,6).map(x=>typeof x==='string'?x.slice(0,120):'');
 return [...entries,...Array(Math.max(0,2-entries.length)).fill('')];
}
