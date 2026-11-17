import { describe, expect, it } from 'vitest';
import { storySeo, chapterSeo, memberSeo, routeSeo } from './palaceSeo';

const work = { title: 'Moonlit Letters', slug: 'moonlit-letters', summary: 'A tale of two worlds.', publication_status: 'published', visibility: 'public', profiles: { display_name: 'Moon Writer' } };
describe('public Palace metadata', () => {
  it('gives a public story an indexable, canonical detail page', () => {
    const seo = storySeo(work);
    expect(seo.url).toBe('https://thestarrypalace.com/work/moonlit-letters');
    expect(seo.title).toContain('Moonlit Letters');
    expect(seo.description).toContain('A tale of two worlds.');
    expect(seo.robots).toBe('index,follow');
  });
  it('keeps drafts, unlisted works, and unpublished chapters out of search', () => {
    expect(storySeo({ ...work, publication_status: 'draft' }).robots).toContain('noindex');
    expect(storySeo({ ...work, visibility: 'unlisted' }).robots).toContain('noindex');
    expect(chapterSeo(work, { id: 'abc-123', title: 'First Night', status: 'draft' }).robots).toContain('noindex');
    expect(chapterSeo(work, { id: 'abc-123', title: 'First Night', status: 'published' }).url)
      .toBe('https://thestarrypalace.com/work/moonlit-letters/chapter/abc-123');
  });
  it('only indexes explicitly public member profiles', () => {
    expect(memberSeo({ username: 'moon-writer', display_name: 'Moon Writer', visibility: 'public' }).robots).toBe('index,follow');
    expect(memberSeo({ username: 'moon-writer', visibility: 'private' }).robots).toContain('noindex');
  });
  it('does not index private account routes or unresolved detail pages', () => {
    expect(routeSeo('/settings').robots).toContain('noindex');
    expect(routeSeo('/writing/my-draft').robots).toContain('noindex');
    expect(routeSeo('/work/unknown').robots).toContain('noindex');
    expect(routeSeo('/reading').robots).toBe('index,follow');
    expect(routeSeo('/search').robots).toContain('noindex');
  });
  it('uses search-specific language for public writing and reading landing pages', () => {
    const writer = routeSeo('/writers');
    expect(writer.title).toContain('Publish Original Fiction & Fanfiction');
    expect(writer.description).toContain('Draft privately');
    expect(writer.url).toBe('https://thestarrypalace.com/writers');
    const reading = routeSeo('/reading');
    expect(reading.title).toContain('Read Original Stories, Fanfiction & Poetry');
    expect(routeSeo('/fandoms').title).toContain('Fanfiction by Fandom');
    expect(routeSeo('/').description).toContain('publish your own stories');
    expect(routeSeo('/tags').robots).toBe('index,follow');
  });
});
