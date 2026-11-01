/*
 * Fanfiction discovery: hosting and permission must never be conflated.
 * Historic public-domain hosted works are separate from modern links to
 * author-published editions. Modern links are not mirrored or imported.
 */
export function isHistoricalFanfiction(record){
 return record?.category==='historical_fanfiction'||record?.archive_category==='historical_fanfiction';
}
export function readingArchiveWorkType(record){
 return isHistoricalFanfiction(record)?'fanwork':'archive';
}
export const MODERN_FANFICTION_LINKS=Object.freeze([
 {
  id:'dawn-yule-lights',
  title:'Yule Lights',
  creator:'Dawn Felagund',
  published:'2019',
  fandom:'Tolkien · The Silmarillion',
  description:'Celebrimbor faces a difficult Yule in Ost-in-Edhil, until Annatar arrives with a surprise.',
  sourceUrl:'https://dawnfelagund.com/index.php/yule-lights',
  permissionUrl:'https://dawnfelagund.com/faq',
  permissionLabel:'CC BY-NC-SA 4.0 · author-published',
  contentNote:'Check the source for its own content details.'
 },
 {
  id:'dawn-home-alone',
  title:'Home Alone: Forgotten in Formenos',
  creator:'Dawn Felagund',
  published:'2019',
  fandom:'Tolkien · Home Alone crossover',
  description:'Amrod and Amras are left behind during a family trip, and must defend Fëanor’s treasury.',
  sourceUrl:'https://dawnfelagund.com/index.php/home-alone',
  permissionUrl:'https://dawnfelagund.com/faq',
  permissionLabel:'CC BY-NC-SA 4.0 · author-published',
  contentNote:'Check the source for its own content details.'
 },
 {
  id:'dawn-ordinary-woman',
  title:'An Ordinary Woman',
  creator:'Dawn Felagund',
  published:'2008',
  fandom:'Tolkien · The Silmarillion',
  description:'A reinterpretation of Lúthien’s story, featuring Finrod and the origins of a legend.',
  sourceUrl:'https://dawnfelagund.com/index.php/an-ordinary-woman',
  permissionUrl:'https://dawnfelagund.com/faq',
  permissionLabel:'CC BY-NC-SA 4.0 · author-published',
  contentNote:'Check the source for its own content details.'
 },
 {
  id:'blackwidower-twilights-endgame',
  title:'Twilight’s Endgame',
  creator:'BlackWidower',
  published:'2019 · updated 2024',
  fandom:'My Little Pony · Marvel Avengers crossover',
  description:'After half of Equestria disappears, Twilight sets out to investigate the cause across space.',
  sourceUrl:'https://www.fimfiction.net/story/447860/1/twilights-endgame/prologue-nothing-but-dust-and-blood',
  permissionUrl:'https://www.fanfiction.net/My-Little-Pony-and-Avengers-Crossovers/621/9786/',
  permissionLabel:'CC BY-NC-SA · author-stated, version not specified',
  contentNote:'Teen-rated at its source; contains violence, death and tragedy.'
 }
]);
