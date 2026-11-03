/** Only colour tokens are importable. Never execute uploaded CSS or HTML. */
export const SKIN_DEFAULTS=Object.freeze({
 background:'#121018',surface:'#211d29',text:'#f6f0fc',
 muted:'#d1c6dd',accent:'#c0a4fa',border:'#635574'
});
const KEYS=Object.keys(SKIN_DEFAULTS);
const CSS_KEYS=Object.fromEntries(KEYS.map(key=>['--palace-skin-'+key,key]));
const HEX=/^#[0-9a-fA-F]{6}$/;

function color(value,key){
 const raw=String(value??'').trim();
 const short=/^#([a-f\d]{3})$/i.exec(raw);
 const six=short?'#'+[...short[1]].map(c=>c+c).join(''):raw;
 if(!HEX.test(six))throw Error('Use a six-digit hex colour for '+key+'.');
 return six.toUpperCase();
}
function luminance(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
export function contrastRatio(a,b){
 const first=luminance(color(a,'first')),last=luminance(color(b,'second'));
 return (Math.max(first,last)+.05)/(Math.min(first,last)+.05);
}
export function validatePageSkin(source){
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Import a Palace skin object.');
 const raw=source.colors&&typeof source.colors==='object'?source.colors:source;
 const colors={};
 for(const key of KEYS)colors[key]=color(raw[key]??SKIN_DEFAULTS[key],key);
 if(contrastRatio(colors.text,colors.surface)<4.5 || contrastRatio(colors.text,colors.background)<4.5)
  throw Error('Your text colour needs stronger contrast against both the background and panels.');
 if(contrastRatio(colors.muted,colors.surface)<4.5)
  throw Error('The muted-text colour must be readable on your panels.');
 const name=String(source.name||'Imported colour skin').trim().slice(0,48);
 return {version:1,name,colors};
}
export function parsePageSkin(source,filename=''){
 const value=String(source||'');
 if(value.length>32000)throw Error('Skin files must be smaller than 32 KB.');
 const isCSS=/\.css$/i.test(filename);
 if(!isCSS){
  let parsed;
  try{parsed=JSON.parse(value)}catch{throw Error('This is not a valid Palace skin JSON file.')}
  return validatePageSkin(parsed);
 }
 // A plain custom-property declaration block, not a full CSS stylesheet.
 // No selectors, URLs, @import, media queries or browser-executable CSS.
 const withoutComments=value.replace(/\/\*[\s\S]*?\*\//g,'').trim();
 const wrapped=/^(?::root|\.palace-skin)\s*\{([\s\S]*)\}$/.exec(withoutComments);
 const declarations=(wrapped?wrapped[1]:withoutComments).split(';').map(x=>x.trim()).filter(Boolean);
 if(!declarations.length||declarations.length>6)throw Error('Use up to six Palace skin colour variables.');
 const colors={};
 for(const declaration of declarations){
  const match=/^(--palace-skin-[a-z-]+)\s*:\s*(#[0-9A-Fa-f]{3}|#[0-9A-Fa-f]{6})$/.exec(declaration);
  if(!match||!Object.hasOwn(CSS_KEYS,match[1]))throw Error('Only --palace-skin-* hex colour variables are supported; full CSS cannot be imported.');
  colors[CSS_KEYS[match[1]]]=match[2];
 }
 return validatePageSkin({name:filename.replace(/\.css$/i,'')||'Imported colour skin',colors});
}
export function pageSkinStyle(source){
 if(!source)return undefined;
 try{
  const {colors}=validatePageSkin(source);
  return Object.fromEntries(Object.entries(colors).map(([k,v])=>['--member-skin-'+k,v]));
 }catch{return undefined}
}
export const PAGE_SKIN_SAMPLE=JSON.stringify({version:1,name:'My Moonlit Chamber',colors:SKIN_DEFAULTS},null,2);
