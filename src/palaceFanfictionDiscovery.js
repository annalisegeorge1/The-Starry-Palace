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
 ,{
  id:'morganaw-cunning-and-compromise',
  title:'Cunning and Compromise',
  creator:'MorganAW',
  published:'2017',
  fandom:'Pride and Prejudice · Jane Austen',
  description:'At the Netherfield ball, Darcy discovers he has misread Wickham, Caroline Bingley and Elizabeth. A complete ten-chapter Austen variation.',
  sourceUrl:'https://archiveofourown.org/works/12395550',
  permissionUrl:'https://www.fanfiction.net/s/12655017/1/Cunning-and-Compromise',
  permissionLabel:'CC BY-SA 4.0 · author-declared; Austen original is public domain',
  contentNote:'Teen on linked AO3 edition; K+ on FanFiction.net · complete, ten chapters.'
 },
 {
  id:'morganaw-more-justified-in-acting',
  title:'More Justified in Acting',
  creator:'MorganAW',
  published:'2017',
  fandom:'Persuasion · Jane Austen',
  description:'Captain Wentworth discovers something in the Kellynch library that changes how he understands Anne Elliot.',
  sourceUrl:'https://archiveofourown.org/works/12480524',
  permissionUrl:'https://archiveofourown.org/works/12480524',
  permissionLabel:'CC BY-SA · licence tagged by the author on AO3',
  contentNote:'Teen-rated on AO3 · complete, nine chapters.'
 },
 {
  id:'squibstress-sweep',
  title:'Sweep',
  creator:'Squibstress',
  published:'2011',
  fandom:'Harry Potter',
  description:'After the Battle of Hogwarts, Argus Filch tries to put things back in order with his broom.',
  sourceUrl:'https://www.fanfiction.net/s/7384091/1/Sweep',
  permissionUrl:'https://www.fanfiction.net/s/7384091/1/Sweep',
  permissionLabel:'CC BY-NC-SA 4.0 · author-stated in story',
  contentNote:'Teen-rated · complete short story · references the aftermath of violence.'
 },
 {
  id:'squibstress-perils-of-eavesdropping',
  title:'The Perils of Eavesdropping',
  creator:'Squibstress',
  published:'2020',
  fandom:'Harry Potter',
  description:'Fred and George test their Extendable Ears and discover things they were never meant to overhear.',
  sourceUrl:'https://www.fanfiction.net/s/13576664/1/The-Perils-of-Eavesdropping',
  permissionUrl:'https://www.fanfiction.net/s/13576664/1/The-Perils-of-Eavesdropping',
  permissionLabel:'CC BY-NC-SA 4.0 · author-stated in story',
  contentNote:'Teen-rated · complete · humorous one-shot.'
 },
 {
  id:'squibstress-not-so-rough-wooing',
  title:'A Not-So-Rough Wooing',
  creator:'Squibstress',
  published:'2026',
  fandom:'Harry Potter',
  description:'A Valentine’s Day romantic comedy featuring Albus Dumbledore and Minerva McGonagall.',
  sourceUrl:'https://www.fanfiction.net/s/14547333/1/A-Not-So-Rough-Wooing',
  permissionUrl:'https://www.fanfiction.net/s/14547333/1/A-Not-So-Rough-Wooing',
  permissionLabel:'CC BY-NC-SA 4.0 · author-stated in story',
  contentNote:'Teen-rated · complete short story.'
 },
 {
  id:'simplynia-irresistible',
  title:'Irresistible',
  creator:'simplynia',
  published:'2024 · ongoing',
  fandom:'The Vampire Diaries',
  description:'In a human-world alternate universe, Bonnie Bennett encounters Elijah Mikaelson at her hotel.',
  sourceUrl:'https://www.fanfiction.net/s/14397141/1/Irresistible',
  permissionUrl:'https://www.fanfiction.net/u/4367617/simplynia',
  permissionLabel:'CC BY-NC-SA 4.0 · author-stated for all their stories',
  contentNote:'Teen-rated · ongoing · romantic power dynamics and angst.'
 },
 {
  id:'blackwidower-my-little-destiny',
  title:'My Little Destiny',
  creator:'BlackWidower',
  published:'2012 · updated 2024',
  fandom:'My Little Pony · Stargate Universe',
  description:'Destiny reaches a new galaxy where the ponies of Equestria face a growing threat.',
  sourceUrl:'https://www.fanfiction.net/s/8039888/1/My-Little-Destiny',
  permissionUrl:'https://www.fanfiction.net/s/8039888/1/My-Little-Destiny',
  permissionLabel:'CC BY-NC-SA · author-stated in story summary',
  contentNote:'Teen-rated · seventeen chapters · science fiction adventure.'
 },
 {
  id:'blackwidower-a-waking-dragon',
  title:'A Waking Dragon',
  creator:'BlackWidower',
  published:'2012 · updated 2019',
  fandom:'My Little Pony · Awake',
  description:'Spike finds himself between two different realities and cannot tell which is his own.',
  sourceUrl:'https://www.fanfiction.net/s/8102275/1/A-Waking-Dragon',
  permissionUrl:'https://www.fanfiction.net/s/8102275/1/A-Waking-Dragon',
  permissionLabel:'CC BY-NC-SA · author-stated in story summary',
  contentNote:'Teen-rated · nine chapters · grief and alternate realities.'
 },
 {
  id:'alixe-les-survivants',
  title:'Les Survivants — Harry Potter 7¾',
  creator:'Alixe',
  published:'2007–2017 series',
  fandom:'Harry Potter · French language',
  description:'The first volume of a four-part French fanfiction exploring the nineteen years after the final battle.',
  sourceUrl:'https://creationsdefans.org/hp734/telechargement',
  permissionUrl:'https://creationsdefans.org/hp734/download/HP734_1.pdf',
  permissionLabel:'CC BY-NC-SA · stated in the original edition; French',
  contentNote:'French-language series · downloadable in multiple formats at the author’s archive.'
 },
 {
  id:'starholder-song-of-lost-heart',
  title:'Song of the Lost Heart',
  creator:'Star Holder Commander',
  published:'2009',
  fandom:'Anime / Yu-Gi-Oh! · fan poem',
  description:'A short fan poem about finding hope and drawing someone back from the darkness.',
  sourceUrl:'https://www.fanfiction.net/s/5524585/1/Song_of_the_Lost_Heart',
  permissionUrl:'https://www.fanfiction.net/u/999304/Star-Holder-Commander',
  permissionLabel:'CC BY-NC-ND 3.0 · specifically stated for this poem',
  contentNote:'General-rated fan poem · no derivatives under the writer’s licence.'
 }
 ,{
  id:'morganaw-depravity-comparison',
  title:'A Depravity That Can Bear No Comparison',
  creator:'MorganAW',
  published:'2019 · updated 2021',
  fandom:'Pride and Prejudice · Sense and Sensibility',
  description:'Elizabeth Darcy investigates the wrong done to Margaret Dashwood’s family in a crossover of two Austen novels.',
  sourceUrl:'https://www.fanfiction.net/s/13386635/1/A-Depravity-That-Can-Bear-no-Comparison',
  permissionUrl:'https://www.fanfiction.net/s/13386635/1/A-Depravity-That-Can-Bear-no-Comparison',
  permissionLabel:'CC BY-SA 4.0 · author-declared original contribution',
  contentNote:'T-rated historical drama · unfinished series.'
 },
 {
  id:'morganaw-paws-and-prejudice',
  title:'Paws and Prejudice',
  creator:'MorganAW',
  published:'2019',
  fandom:'Pride and Prejudice · modern AU',
  description:'Elizabeth and Darcy clash at a dog park, although their pets have other ideas.',
  sourceUrl:'https://www.fanfiction.net/s/13229369/1/Paws-and-Prejudice',
  permissionUrl:'https://www.fanfiction.net/s/13229369/1/Paws-and-Prejudice',
  permissionLabel:'CC BY-SA 4.0 · author-declared original contribution',
  contentNote:'K+ rated · romance and humour. Contains quotations from Austen and film adaptations; author licence covers original writing only.'
 },
 {
  id:'cateliot-inner-demons',
  title:'inner demons',
  creator:'cateliot',
  published:'2015',
  fandom:'Percy Jackson and the Olympians',
  description:'Annabeth asks about a scar from Thalia’s time on the run with Luke.',
  sourceUrl:'https://www.fanfiction.net/s/11268811/1/inner-demons',
  permissionUrl:'https://www.fanfiction.net/s/11268811/1/inner-demons',
  permissionLabel:'CC BY-NC-SA 3.0 · author-declared original contribution',
  contentNote:'Teen-rated one-shot · scars, past trauma, and an implied Thalia/Luke relationship.'
 },
 {
  id:'what-contented-men-desire-last-adventure',
  title:'The Last Adventure',
  creator:'What contented men desire',
  published:'2007 · updated 2012',
  fandom:'Harry Potter',
  description:'Harry, Ron and Hermione return to Hogwarts to finish destroying the last remnants of Voldemort’s soul.',
  sourceUrl:'https://www.fanfiction.net/s/3811214/1/The-Last-Adventure',
  permissionUrl:'https://www.fanfiction.net/s/3811214/1/The-Last-Adventure',
  permissionLabel:'CC BY-NC-SA 3.0 · author-declared original contribution',
  contentNote:'Teen-rated · adventure, war aftermath, danger and romance.'
 },
 {
  id:'mjware-american-muggle',
  title:'An American Muggle in Slytherin House',
  creator:'MJWare',
  published:'2015',
  fandom:'Harry Potter',
  description:'A newcomer from America discovers magic and finds himself sorted into Slytherin.',
  sourceUrl:'https://www.fanfiction.net/s/11083706/1/An-American-Muggle-in-Slytherin-House',
  permissionUrl:'https://www.fanfiction.net/s/11083706/1/An-American-Muggle-in-Slytherin-House',
  permissionLabel:'CC BY-NC-SA 4.0 · author-declared original contribution',
  contentNote:'K-rated at source · school adventure and romance.'
 },
 {
  id:'greame-nevernever-story',
  title:'A Nevernever Story',
  creator:'Greame',
  published:'2013',
  fandom:'The Dresden Files',
  description:'An original wizard is drawn into an increasingly dangerous mission through the Nevernever.',
  sourceUrl:'https://www.fanfiction.net/s/9102776/1/A-Nevernever-Story',
  permissionUrl:'https://www.fanfiction.net/s/9102776/1/A-Nevernever-Story',
  permissionLabel:'Creative Commons noncommercial · author-stated; exact version unspecified',
  contentNote:'Teen-rated · supernatural danger, violence and adventure.'
 },
 {
  id:'jrush-v-for-vengeance',
  title:'V for Vengeance',
  creator:'JRush',
  published:'2011 · updated 2012',
  fandom:'The Dresden Files',
  description:'Harry and Lash help a young woman in trouble with vampires.',
  sourceUrl:'https://www.fanfiction.net/s/6928484/1/V-for-Vengeance',
  permissionUrl:'https://www.fanfiction.net/s/6928484/1/V-for-Vengeance',
  permissionLabel:'Creative Commons noncommercial · author-stated; exact version unspecified',
  contentNote:'Teen-rated · vampires, danger and horror.'
 },
 {
  id:'ken1245632-naruto-dragon-chronicles',
  title:'Naruto: Dragon Chronicles Part 1',
  creator:'Ken1245632',
  published:'2021 · updated 2022',
  fandom:'Naruto · Dark Souls crossover',
  description:'Naruto’s world collides with a darker fantasy setting on a quest involving Priscilla.',
  sourceUrl:'https://www.fanfiction.net/s/14013574/1/Naruto-Dragon-Chronicles-Part-1',
  permissionUrl:'https://www.fanfiction.net/s/14013574/1/Naruto-Dragon-Chronicles-Part-1',
  permissionLabel:'CC BY-NC-SA 4.0 · author-declared original contribution',
  contentNote:'M-rated at source · violence, dark fantasy and adventure.'
 }
]);
