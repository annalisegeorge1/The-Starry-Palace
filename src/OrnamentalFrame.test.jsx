import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {CHAMBER_FRAMES} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
afterEach(cleanup);
it('renders every existing owned frame as a centred vector with unique gradient references',()=>{
 const {container}=render(<>{CHAMBER_FRAMES.map(frame=><ChamberFrameArt key={frame.slug} slug={frame.slug}/>)}</>);
 const svgs=container.querySelectorAll('.ornamental-avatar-frame');
 expect(svgs).toHaveLength(35);
 expect(new Set([...svgs].map(s=>s.dataset.tier)).size).toBe(5);
 expect(container.querySelectorAll('[data-ornament="prestige-detail"]')).toHaveLength(14);
 expect(new Set([...svgs].map(s=>s.dataset.style)).size).toBe(7);
 const ids=[...container.querySelectorAll('[id]')].map(n=>n.id);
 expect(new Set(ids).size).toBe(ids.length);
 for(const svg of svgs){expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');expect(svg.querySelector('image')).toBeNull();}
});
it('leaves unknown or removed frames empty',()=>{
 const {container}=render(<ChamberFrameArt slug="not-a-frame"/>);
 expect(container.innerHTML).toBe('');
});
