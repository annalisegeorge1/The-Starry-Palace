import React from 'react';
import fs from 'node:fs';
import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {CHAMBER_FRAMES} from './paintedCollection';
import {ChamberFrameArt} from './PaintedPalaceArt';
afterEach(cleanup);
it('renders every illustrated frame under its existing identity',()=>{
 const {container}=render(<>{CHAMBER_FRAMES.map(frame=><ChamberFrameArt key={frame.slug} slug={frame.slug}/>)}</>);
 const svgs=container.querySelectorAll('.ornamental-avatar-frame');
 expect(svgs).toHaveLength(59);
 expect(new Set([...svgs].map(s=>s.dataset.tier)).size).toBe(5);
 const classics=[...container.querySelectorAll('.classic-circular-frame')];
 expect(classics).toHaveLength(35);
 for(const svg of classics){const path=svg.querySelector('image').getAttribute('href');expect(path).toContain('/'+svg.dataset.frameSlug+'.webp');expect(fs.existsSync('public'+path)).toBe(true);}
 expect(new Set([...svgs].map(s=>s.dataset.style)).size).toBe(10);
 expect(container.querySelectorAll('[data-regalia="true"]')).toHaveLength(12);
 expect(container.querySelectorAll('[data-gemstone="true"]')).toHaveLength(12);
 const ids=[...container.querySelectorAll('[id]')].map(n=>n.id);
 expect(new Set(ids).size).toBe(ids.length);
 for(const svg of svgs){expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');expect(Boolean(svg.querySelector('image'))).toBe(svg.dataset.artQuality==='illustrated');}
});
it('leaves unknown or removed frames empty',()=>{
 const {container}=render(<ChamberFrameArt slug="not-a-frame"/>);
 expect(container.innerHTML).toBe('');
});
