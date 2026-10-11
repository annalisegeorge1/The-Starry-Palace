import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import ChamberFramePicker from './ChamberFramePicker';
import {PaintedBadge,WriterAward} from './PaintedPalaceArt';
import {PAINTED_FAMILIES} from './paintedCollection';
const api=vi.hoisted(()=>({save:vi.fn().mockResolvedValue({}),get:vi.fn().mockResolvedValue({user_id:'member',chamber_frame:'bamboo-ink'})}));
vi.mock('./memberChamberDecorData',()=>({savePaintedChamberFrame:api.save,getPrismState:api.get}));
afterEach(()=>{cleanup();vi.clearAllMocks()});
it('allows locked previews without allowing a member to wear an unearned frame',()=>{
 render(<ChamberFramePicker decor={{user_id:'member',unlocks:{}}} onSaved={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:/Jade Fern/}));
 expect(screen.getByRole('button',{name:'Keep creating to unlock'}).disabled).toBe(true);
 expect(api.save).not.toHaveBeenCalled();
});
it('saves an included frame and refreshes the actual member state',async()=>{
 const saved=vi.fn();render(<ChamberFramePicker decor={{user_id:'member',unlocks:{}}} onSaved={saved}/>);
 fireEvent.click(screen.getByRole('button',{name:/Bamboo Ink/}));
 fireEvent.click(screen.getByRole('button',{name:'Wear this frame'}));
 await waitFor(()=>expect(saved).toHaveBeenCalledWith({user_id:'member',chamber_frame:'bamboo-ink'}));
 expect(api.save).toHaveBeenCalledWith('bamboo-ink');
});
it('uses the repaired Comic Constellation painting with its tier frame',()=>{
 const {container}=render(<PaintedBadge family={PAINTED_FAMILIES.find(x=>x.id==='comic-constellation')} tier="emerald"/>);
 expect([...container.querySelectorAll('image')].map(x=>x.getAttribute('href'))).toEqual(['/assets/palace-watercolours/comic-constellation.webp','/assets/palace-watercolours/tier-frames.webp']);
});
it('keeps appreciation icons compact and decorative beside their button text',()=>{
 const {container}=render(<WriterAward kind="crown" size={24}/>);
 expect(container.querySelector('svg').getAttribute('width')).toBe('24');
 expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
});
