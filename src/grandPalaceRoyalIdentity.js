// Ceremonial language only; no new banners, emblems or sigil changes.
export const ROYAL_HOUSE_IDENTITY=Object.freeze({
'azure-moon':{title:'The Moonbound',motto:'In silence, even stars speak.'},
'violet-star':{title:'The Starlit Makers',motto:'We were born to illuminate.'},
'sapphire-tide':{title:'The Tidefarers',motto:'No horizon shall contain us.'},
'silver-crane':{title:'The Silver Quills',motto:'Grace is our strength.'},
'obsidian-rose':{title:'The Thornkeepers',motto:'Even darkness bears flowers.'},
'celestial-lotus':{title:'The Dawnblossoms',motto:'From still waters, we rise.'},
'midnight-lantern':{title:'The Lightkeepers',motto:'No soul wanders alone.'},
'whispering-comet':{title:'The Startrail Blazers',motto:'The heavens remember our passage.'},
'amethyst-sky':{title:'The Dreamcartographers',motto:'Beyond imagination lies infinity.'},
'winter-phoenix':{title:'The Ever-Risen',motto:'Not even winter shall end us.'}
});
export const royalHouseIdentity=palace=>ROYAL_HOUSE_IDENTITY[typeof palace==='string'?palace:palace?.slug]||null;
