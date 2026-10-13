import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {ReadingCatalogueControls,ReadingCatalogueMore} from './ReadingCatalogueControls';
afterEach(cleanup);
it('exposes each layout and reports the chosen presentation accessibly',()=>{
 const choose=vi.fn();
 render(<ReadingCatalogueControls layout="compact" onLayout={choose} shown={24} total={80}/>);
 expect(screen.getByRole('button',{name:/Compact layout/}).getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:/Gallery layout/}));
 expect(choose).toHaveBeenCalledWith('gallery');
 expect(screen.getByRole('status').textContent).toContain('24');
 expect(screen.getByRole('status').textContent).toContain('80');
});
it('shows the real remaining batch and removes the control when complete',()=>{
 const more=vi.fn();
 const {rerender}=render(<ReadingCatalogueMore shown={24} total={29} onMore={more}/>);
 fireEvent.click(screen.getByRole('button',{name:/Show 5 more stories/}));
 expect(more).toHaveBeenCalledTimes(1);
 rerender(<ReadingCatalogueMore shown={29} total={29} onMore={more}/>);
 expect(screen.queryByRole('button')).toBeNull();
});
