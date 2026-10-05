import catalogue from './originalCollectibles.json';

// Stable artwork identities also serve as database gift keys. Collection rank is
// independent of an artwork's original edition (e.g. Celestial or Sapphire).
export const treasures = [...catalogue.prizes, ...catalogue.gifts].map((item, index) => ({
 ...item,
 gift_key: `treasure:${item.id}`,
 catalogue_number: index + 1,
 court_name: item.court || 'Palace Keepsakes',
 collection_type: item.court ? 'Court treasures' : 'Palace keepsakes',
 artEdition: (item.court ? catalogue.prizeTiers : catalogue.giftTiers)[item.tier],
 description: item.description || `An original ${catalogue.giftTiers[item.tier]} watercolour edition from the Palace Keepsakes collection.`
}));
const byKey = new Map(treasures.map(item => [item.gift_key, item]));
const byName = new Map(treasures.map(item => [item.name, item]));
export function treasureForGift(gift) {
 return byKey.get(gift?.gift_key) || byName.get(gift?.name) || null;
}
export const treasureCourts = [...new Set(treasures.map(item => item.court_name))].map((name, index) => ({
 name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
 sigil: index === 20 ? '☾' : '✦',
 motto: index === 20 ? '100 painted keepsakes' : '25 court treasures',
 accent: ['#8396b8','#a49bc8','#80a9ad'][index % 3], glow: '#65769d'
}));
