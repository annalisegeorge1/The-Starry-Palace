// Validate the dynamic-import contract before React.lazy reads module.default.
// A cancelled Vite preload error can otherwise resolve to undefined.
export function loadPalaceRoomModule(importer,timeoutMs=12000){
 let timer;
 const timeout=new Promise((_,reject)=>{
  timer=setTimeout(()=>reject(new Error('Palace room load timeout')),timeoutMs);
 });
 return Promise.race([Promise.resolve().then(importer),timeout]).then(module=>{
  if(module?.default==null)throw new Error('Palace room failed to fetch a valid module (missing default export)');
  return module;
 }).finally(()=>clearTimeout(timer));
}
