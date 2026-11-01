import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const page=readFileSync('src/Treasury.jsx','utf8');
const css=readFileSync('src/treasury-gallery.css','utf8');

describe('Full Treasury catalogue remains artwork-first on mobile',()=>{
 it('keeps badge and gift discovery behind one functional filter sheet',()=>{
  expect(page).toContain('className="treasury-catalogue-toolbar"');
  expect(page).toContain('className="treasury-catalogue-search"');
  expect(page).toContain('aria-controls="treasury-catalogue-filters"');
  expect(page).toContain("className={'treasury-filter-overlay'+(filtersOpen?' is-open':'')}");
  expect(page).toContain('setGiftEditionFilter(e.target.value)');
  expect(page).toContain('setGiftOwnership(e.target.value)');
  expect(page).toContain('setBadgeOwnership(e.target.value)');
  expect(page).toContain('setGiftPreviewTier(e.target.value)');
  expect(page).toContain("if(e.key==='Escape')");
  expect(page).toContain('ref={filterPanelRef}');
  expect(css).toContain('.treasury-filter-overlay.is-open');
  expect(css).toContain('max-height:min(80dvh,680px)');
 });
 it('keeps full illustrated badges and tier progress without a repeated preview line',()=>{
  expect(page).toContain('<PalaceBadge family={b} tier={badgeRank(b)}/>');
  expect(page).toContain('className="treasury-tier-dots"');
  expect(page).toContain("collection==='originals'&&t==='bronze'?'preview':''");
  expect(page).not.toContain('<small>Five collectible tiers · Preview</small>');
  expect(css).toContain('>.badge-card.is-original-collection>small{display:none!important}');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))!important');
  expect(css).toContain('overflow:visible!important');
 });
 it('keeps the global header opaque and clears the fixed bottom dock',()=>{
  expect(css).toContain('padding-bottom:max(152px,calc(120px + env(safe-area-inset-bottom,0px)))!important');
  expect(css).toContain('background-color:#0d142b!important');
  expect(css).toContain('background-color:#f0ecfa!important');
 });
});
