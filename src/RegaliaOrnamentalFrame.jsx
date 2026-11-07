import FineFrameArtwork from './FineFrameArtwork';
import React,{useId} from 'react';

/* Statement portrait jewellery: six broad settings and six lighter artisanal
 * designs. The centre is always transparent; no artwork or member image is
 * embedded in these frames. Stones are deliberate accents, not compulsory. */
export const REGALIA_FRAME_DESIGNS=Object.freeze({
 'grand-coronation':{metal:'#f2c86b',shadow:'#684219',highlight:'#fff0bf',stone:'#de3155',stoneLight:'#ffbad0',motif:'crown',thickness:'grand',gems:8},
 'sapphire-cathedral':{metal:'#b4d4ed',shadow:'#29466e',highlight:'#ffffff',stone:'#2961dd',stoneLight:'#b4ddff',motif:'arch',thickness:'grand',gems:6},
 'emerald-fortress':{metal:'#d6bd80',shadow:'#375e44',highlight:'#fcffd7',stone:'#159b71',stoneLight:'#c5ffda',motif:'shield',thickness:'grand',gems:4},
 'black-diamond-throne':{metal:'#a6aabd',shadow:'#262734',highlight:'#f5f4fa',stone:'#39435d',stoneLight:'#e5f7ff',motif:'diamond',thickness:'grand',gems:4},
 'amethyst-empress':{metal:'#d5a5e9',shadow:'#4d2866',highlight:'#fef0ff',stone:'#9337cf',stoneLight:'#f7cbff',motif:'crown',thickness:'grand',gems:6},
 'treasury-vault':{metal:'#f7c662',shadow:'#72400d',highlight:'#fff9c3',stone:'#eea42d',stoneLight:'#fff2b0',motif:'sun',thickness:'grand',gems:8},
 'rose-palace-deluxe':{metal:'#ecc0ac',shadow:'#7d445e',highlight:'#fff7f2',stone:'#dc569c',stoneLight:'#ffe2f0',motif:'flower',thickness:'medium',gems:3},
 'moonstone-halo':{metal:'#c4d3e6',shadow:'#54667c',highlight:'#ffffff',stone:'#9cb8e9',stoneLight:'#faffff',motif:'moon',thickness:'medium',gems:1},
 'opal-bloom':{metal:'#e4cadd',shadow:'#72778f',highlight:'#fffdfa',stone:'#9dc6db',stoneLight:'#fff6ff',motif:'flower',thickness:'medium',gems:2},
 'star-garland':{metal:'#b9b4ef',shadow:'#515078',highlight:'#f6f1ff',stone:'#8f83e5',stoneLight:'#e1d9ff',motif:'star',thickness:'delicate',gems:0},
 'golden-ivy':{metal:'#ddbf73',shadow:'#755926',highlight:'#fff8be',stone:'#5ca77c',stoneLight:'#c8f5d4',motif:'vine',thickness:'delicate',gems:0},
 'twilight-pearl':{metal:'#c8a8c6',shadow:'#5c496e',highlight:'#f9ebfa',stone:'#9ba9de',stoneLight:'#f7f5ff',motif:'pearl',thickness:'medium',gems:0}
});

export default function RegaliaOrnamentalFrame({frame,size='100%',className=''}) {
 const d=REGALIA_FRAME_DESIGNS[frame?.slug];
 return d?<FineFrameArtwork frame={frame} style={d} size={size} className={className}/>:null;
}
