/** Content labels supply visual themes; this never infers anyone's identity. */
const QUEER_TERMS=/\b(?:lgbtqia?|lgbtq|lgbt|queer|sapphic|achillean|lesbian|gay|bisexual|pansexual|asexual|aromantic|aroace|transgender|trans|nonbinary|non-binary|genderfluid|genderqueer|intersex|two-spirit|same-sex|rainbow families|pride month|pride parade|pride festival|world pride)\b\+?/i;

function flattenLabels(input){
 if(Array.isArray(input))return input.flatMap(flattenLabels);
 if(input&&typeof input==='object'){
  if(input.tags)return flattenLabels(input.tags);
  return [String(input.name||input.title||input.summary||input.community_key||input.context_notes||'')];
 }
 return [String(input||'')];
}
export function isLgbtqContent(...labels){
 return QUEER_TERMS.test(labels.flatMap(flattenLabels).join(' '));
}
export function heritageVisualTheme(record={}){
 if(isLgbtqContent(record.title,record.summary,record.community_key,record.context_notes))return 'rainbow';
 const source=[record.title,record.summary,record.community_key,record.region_key,record.observance_type].filter(Boolean).join(' ').toLowerCase();
 if(/\b(?:christmas|yuletide|advent|boxing day|three kings)\b/.test(source))return 'winter';
 if(/\b(?:easter|good friday|holy week|resurrection sunday)\b/.test(source))return 'spring';
 if(/\b(?:carnival|masquerade|mas band|jouvert|j'ouvert)\b/.test(source))return 'carnival';
 if(/\b(?:diwali|divali|deepavali|festival of lights)\b/.test(source))return 'lamplight';
 if(/\b(?:eid|ramadan|mawlid|islamic new year)\b/.test(source))return 'crescent';
 if(/\b(?:lunar new year|chinese new year|seollal|tết|tet nguyen dan|spring festival)\b/.test(source))return 'lunar';
 if(/\b(?:halloween|all hallows|samhain|day of the dead|día de muertos)\b/.test(source))return 'twilight';
 if(/\b(?:new year|new year's|new years|watch night)\b/.test(source))return 'midnight';
 if(/\b(?:palestin|nakba|gaza|west bank)\b/.test(source))return 'olive';
 if(/\b(?:congo|congolese|kinshasa)\b/.test(source))return 'river';
 if(/\b(?:independence|emancipation|freedom day|republic day)\b/.test(source))return 'horizon';
 const type=String(record.observance_type||'heritage').toLowerCase();
 return {festival:'festival',history:'sepia',language:'sapphire',awareness:'mint',heritage:'heritage',commemoration:'twilight'}[type]||'heritage';
}
