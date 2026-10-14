import {afterEach,describe,it,expect,vi} from 'vitest';
import {safeReaderHtml} from './readerHtmlSanitizer';

afterEach(()=>vi.unstubAllGlobals());

describe('Reader HTML boundary',()=>{
 it('keeps only the Palace reader\'s supported editorial formatting',()=>{
  const html='<div class="wrapper"><p class="intro" onclick="steal()">Hello <strong style="color:red">Moon</strong> <em>and stars</em></p><blockquote><p>Dream softly</p></blockquote></div>';
  expect(safeReaderHtml(html)).toBe('<p>Hello <strong>Moon</strong> <em>and stars</em></p><blockquote><p>Dream softly</p></blockquote>');
 });
 it('drops executable or embedded content altogether, never retaining its attributes',()=>{
  const html='<p>Safe reading</p><script>alert(1)</script><style>body{display:none}</style><iframe src="https://example.test">unsafe embed</iframe><svg onload="alert(1)"><text>invisible</text></svg><p onmouseover="alert(1)">End</p>';
  const result=safeReaderHtml(html);
  expect(result).toBe('<p>Safe reading</p><p>End</p>');
  expect(result).not.toMatch(/script|iframe|onload|onmouseover|display:none|unsafe embed/);
 });
 it('unwraps harmless unsupported elements rather than destroying their prose',()=>{
  expect(safeReaderHtml('<div><p>Read <a href="javascript:alert(1)">this</a> chapter</p><span>Always</span></div>'))
   .toBe('<p>Read this chapter</p>Always');
 });
 it('escapes all markup when no DOM parser is available, instead of trusting a regex',()=>{
  vi.stubGlobal('DOMParser',undefined);
  const result=safeReaderHtml('<img src=x onerror="alert(1)"><b>Keep & read</b>');
  expect(result).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&lt;b&gt;Keep &amp; read&lt;/b&gt;');
  expect(result).not.toContain('<img');
  expect(result).not.toContain('<b>');
 });
 it('handles empty or null content safely',()=>{
  expect(safeReaderHtml()).toBe('');
  expect(safeReaderHtml(null)).toBe('');
 });
});
