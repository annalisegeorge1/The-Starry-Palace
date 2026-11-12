import {invitationPalettes} from './royalWelcomeGifts';
import {useEffect,useState} from 'react';
import {getMemberAppearance} from './memberChamberDecorData';
import {prismAppearance} from './prismAppearance';

export const APPEARANCE_CHANGED='palace:appearance-changed';

export function useMemberAppearance(memberId,viewerId=memberId){
 const [saved,setSaved]=useState(null);
 useEffect(()=>{
  if(!memberId)return;
  let active=true,revision=0;
  function apply(decor){setSaved({memberId,viewerId,appearance:Object.hasOwn(invitationPalettes,decor?.prism_palette)&&decor?.personal_skin?.appearance_mode!=='skin'?null:prismAppearance(decor)})}
  function changed(event){
   if(event.detail?.user_id!==memberId)return;
   revision++;
   apply(event.detail);
  }
  function refresh(){
   const request=++revision;
   getMemberAppearance(memberId).then(decor=>{if(active&&revision===request)apply(decor)}).catch(()=>{});
  }
  refresh();
  window.addEventListener(APPEARANCE_CHANGED,changed);
  window.addEventListener('focus',refresh);
  return ()=>{active=false;window.removeEventListener(APPEARANCE_CHANGED,changed);window.removeEventListener('focus',refresh)};
 },[memberId,viewerId]);
 return memberId&&saved?.memberId===memberId&&saved.viewerId===viewerId?saved.appearance:null;
}
