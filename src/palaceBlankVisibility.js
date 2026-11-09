const NON_RENDERING=new Set(['STYLE','SCRIPT','TEMPLATE','NOSCRIPT']);

function hasVisibleSurface(node,isInvisible){
 if(node.nodeType===Node.TEXT_NODE){
  if(!node.textContent.trim())return false;
  const range=node.ownerDocument.createRange();
  range.selectNodeContents(node);
  return Array.from(range.getClientRects()).some(rect=>rect.width>0&&rect.height>0);
 }
 if(node.nodeType!==Node.ELEMENT_NODE||NON_RENDERING.has(node.tagName))return false;
 if(!isInvisible(node))return true;
 // A display:contents wrapper has no box. Its children supply the boxes
 // (and sometimes bare text) that are actually painted in the room.
 if(getComputedStyle(node).display==='contents'){
  return Array.from(node.childNodes).some(child=>hasVisibleSurface(child,isInvisible));
 }
 return false;
}

export function isPalaceRoomVisuallyBlank(content,isInvisible){
 if(!content||typeof isInvisible!=='function')return false;
 if(isInvisible(content))return !hasVisibleSurface(content,isInvisible);
 const surfaces=Array.from(content.childNodes).filter(node=>
  node.nodeType===Node.ELEMENT_NODE&&!NON_RENDERING.has(node.tagName)||
  node.nodeType===Node.TEXT_NODE&&node.textContent.trim()
 );
 return surfaces.length>0&&!surfaces.some(node=>hasVisibleSurface(node,isInvisible));
}
