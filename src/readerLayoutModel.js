/** Presentation-only reader page modes shared by stories and hosted classics.
 * A saved preference is never content or publication state.
 */
export const READER_LAYOUTS=Object.freeze([
 {value:'book',label:'Book',short:'Classic page',description:'A comfortable centred page with a gentle book frame.'},
 {value:'full',label:'Full Page',short:'Open canvas',description:'A spacious, open reading surface that uses more of your screen.'},
 {value:'journal',label:'Journal',short:'Soft margins',description:'A quiet manuscript-style page with a subtle left accent and breathing room.'},
 {value:'compact',label:'Compact',short:'Less scrolling',description:'Tighter paragraph gaps and less surrounding decoration.'}
]);
export const READER_LAYOUT_VALUES=Object.freeze(READER_LAYOUTS.map(x=>x.value));
export function readerLayoutLabel(value){return READER_LAYOUTS.find(x=>x.value===value)?.label||'Book'}
