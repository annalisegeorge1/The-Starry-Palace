import FineFrameArtwork from './FineFrameArtwork';
import React,{useId} from 'react';

/* Original, scalable gemstone jewellery. The centre stays transparent so a
 * member's avatar remains readable, including when the frame is only 72px. */
export const GEMSTONE_FRAME_DESIGNS=Object.freeze({
 'crown-jewel':{stone:'#d91e64',light:'#ffd6e7',deep:'#600b30',metal:'#ebc16c',shadow:'#66401b',motif:'crown'},
 'midnight-sapphire':{stone:'#175ddf',light:'#b6e4ff',deep:'#081e64',metal:'#b3c9f5',shadow:'#435379',motif:'arch'},
 'starlit-amethyst':{stone:'#8b37e6',light:'#f4caff',deep:'#3c126f',metal:'#e4c3f0',shadow:'#614072',motif:'stars'},
 'black-diamond':{stone:'#384158',light:'#f2faff',deep:'#070b15',metal:'#e1e4f0',shadow:'#4e5668',motif:'diamonds'},
 'emerald-garden':{stone:'#00ae78',light:'#b8ffe0',deep:'#07533e',metal:'#e9c876',shadow:'#62501d',motif:'vine'},
 'ruby-coronation':{stone:'#ec2855',light:'#ffc8ca',deep:'#7d0923',metal:'#ffce70',shadow:'#7f441a',motif:'crown'},
 'rose-palace':{stone:'#ef64a4',light:'#fff0f3',deep:'#8b275c',metal:'#f2c9bf',shadow:'#8e5a6e',motif:'petals'},
 'opal-dream':{stone:'#86bfed',light:'#fff1ff',deep:'#50709a',metal:'#eddbef',shadow:'#7b6489',motif:'pearl'},
 'treasury-relic':{stone:'#f5a72a',light:'#fff8ba',deep:'#845018',metal:'#ffe59b',shadow:'#7a4b25',motif:'crown'},
 'celestial-aquamarine':{stone:'#06b6d7',light:'#ccfff7',deep:'#08677b',metal:'#d5ecfa',shadow:'#55738c',motif:'moon'},
 'golden-topaz':{stone:'#ffa72b',light:'#fff4b4',deep:'#ad5214',metal:'#ffe5a1',shadow:'#7d5026',motif:'diamonds'},
 'violet-empress':{stone:'#bd37c7',light:'#ffe2fa',deep:'#5e146e',metal:'#e3c2f2',shadow:'#604078',motif:'crown'}
});

export default function GemstoneOrnamentalFrame({frame,size='100%',className=''}) {
 const d=GEMSTONE_FRAME_DESIGNS[frame?.slug];
 return d?<FineFrameArtwork frame={frame} style={{...d,gemstone:true}} size={size} className={className}/>:null;
}
