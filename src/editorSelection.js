/**
 * A formatting button should act on the writer's own selection rather than
 * the browser focus position after a toolbar click.
 *
 * Ranges are intentionally scoped to a single live contentEditable element;
 * they cannot be carried into another chapter's editor.
 */
function rangeWithinEditor(editor,range){
 if(!editor||!range)return false;
 try{
  const root=range.commonAncestorContainer;
  return (root===editor||editor.contains(root)) &&
   !!range.startContainer.isConnected && !!range.endContainer.isConnected;
 }catch{return false}
}
export function captureEditorSelection(editor,selection){
 if(!selection||!selection.rangeCount)return null;
 try{
  const range=selection.getRangeAt(0);
  return rangeWithinEditor(editor,range)?{range:range.cloneRange(),start:range.startContainer,end:range.endContainer}:null;
 }catch{return null}
}
export function restoreEditorSelection(editor,range,selection){
 if(!selection||!range||!rangeWithinEditor(editor,range.range)||range.range.startContainer!==range.start||range.range.endContainer!==range.end)return false;
 try{
  selection.removeAllRanges();
  selection.addRange(range.range.cloneRange());
  return true;
 }catch{return false}
}

/** The arrow controls should move a visible amount without changing selection. */
export function toolbarScrollAmount(viewportWidth,direction){
 const width=Math.max(0,Number(viewportWidth)||0);
 return (direction==='left'?-1:1)*Math.max(160,Math.round(width*.72));
}
