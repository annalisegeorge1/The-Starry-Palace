import React from 'react';
import PalaceIcon from './PalaceIcon';
import {createPortal} from 'react-dom';

export function PalaceDialog({open,title,eyebrow,children,onClose,actions,className=''}) {
 if(!open)return null;
 const dialog=<div className="palace-dialog-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
  <section className={"palace-dialog "+className} role="dialog" aria-modal="true" aria-label={title}>
   <header><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div><button className="dialog-close" onClick={onClose} aria-label="Close"><PalaceIcon name="x"/></button></header>
   <div className="palace-dialog-body">{children}</div>
   {actions&&<footer>{actions}</footer>}
  </section>
 </div>;
 return typeof document!=='undefined'?createPortal(dialog,document.body):dialog
}

export function State({children,error,loading,empty}){
 if(loading)return <div className="live-state palace-state palace-state-loading" role="status"><span className="palace-state-sigil" aria-hidden="true"><PalaceIcon name="moon"/></span><div><strong>Gathering the room beneath the stars…</strong><small>Your place will remain here while the Palace opens.</small></div></div>;
 if(error)return <div className="live-state error-state palace-state palace-state-error" role="alert"><span className="palace-state-sigil" aria-hidden="true"><PalaceIcon name="shield"/></span><div><strong>This room could not be gathered.</strong><small>{error}</small><button className="outline-button" onClick={()=>window.location.reload()}>Try this room again</button></div></div>;
 if(empty)return <div className="live-state palace-state palace-state-empty">{typeof empty==='string'?<><span className="palace-state-sigil" aria-hidden="true"><PalaceIcon name="moon"/></span><div><strong>A quiet room.</strong><small>{empty}</small></div></>:empty}</div>;
 return children
}

