/** Separate durable cloud confirmation from transient UI notices.
 * Never claim an editor's unsaved keystrokes have reached the server.
 */
export function writerSaveDisplay(message='',dirty=false,recoveryAvailable=true){
 const value=String(message||'').trim();
 if(dirty){
  if(/failed|unavailable|cannot|not completed/i.test(value)){
   return {label:recoveryAvailable?'Cloud save failed · device copy kept':'Cloud save failed · download backup',phase:'attention'};
  }
  if(/restored|recovery copy/i.test(value))return {label:recoveryAvailable?'Restored locally · save to Palace':'Restored in editor · save or export',phase:'recovery'};
  if(/waiting/i.test(value))return {label:'New changes not yet saved',phase:'pending'};
  return {label:'Saving to Palace…',phase:'pending'};
 }
 if(/^saved to palace$/i.test(value))return {label:'Saved to Palace',phase:'saved'};
 if(/failed|unavailable|cannot/i.test(value))return {label:recoveryAvailable?'Cloud save issue · device copy available':'Cloud save issue · download backup',phase:'attention'};
 if(/restored locally|unsaved cloud edits/i.test(value))return {label:'Local restore · confirm cloud save',phase:'recovery'};
 return {label:'Cloud draft loaded',phase:'ready'};
}
