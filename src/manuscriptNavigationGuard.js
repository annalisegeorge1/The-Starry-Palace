/**
 * Only same-tab internal route changes need our SPA editor warning; browser
 * reloads and external links are handled by the native beforeunload guard.
 */
export function shouldWarnOnWriterLink({currentUrl,href,dirty=false,modified=false,download=false,target=''}={}){
 if(!dirty||modified||download||(target&&target!=='_self'))return false;
 try{
  const current=new URL(currentUrl);
  const next=new URL(href,current);
  return next.origin===current.origin&&(next.pathname!==current.pathname||next.search!==current.search);
 }catch{return false}
}
