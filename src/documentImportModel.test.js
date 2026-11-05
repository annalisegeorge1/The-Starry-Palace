import {describe,it,expect} from 'vitest';
import {docxXmlToPalaceHtml,convertDocumentFile} from './documentImportModel';
const xml='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chapter One</w:t></w:r></w:p><w:p><w:r><w:t>The </w:t></w:r><w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>silver sky</w:t></w:r><w:r><w:br/><w:t>returns.</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>First</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Second</w:t></w:r></w:p></w:body></w:document>';
describe('Browser-only chapter document import',()=>{
 it('preserves safe Word headings, inline styling, breaks and list structure',()=>{
  const {html}=docxXmlToPalaceHtml(xml);
  expect(html).toContain('<h2>Chapter One</h2>');
  expect(html).toContain('<em><strong>silver sky</strong></em>');
  expect(html).toContain('<br>returns.');
  expect(html).toContain('<ul><li>First</li><li>Second</li></ul>');
 });
 it('does not allow Word XML text to become HTML or scripted content',()=>{
  const doc=xml.replace('silver sky','&lt;img src=x onerror=evil()&gt;');
  const result=docxXmlToPalaceHtml(doc).html;
  expect(result).not.toContain('<img ');
  expect(result).toContain('&lt;img');
 });
 it('converts plain text and basic Markdown without remote document upload',async()=>{
  const txt=new File(['A simple story\n\nNext scene'], 'My_Story.txt');
  const out=await convertDocumentFile(txt);
  expect(out.title).toBe('My Story');
  expect(out.html).toContain('<p>A simple story</p>');
  const md=await convertDocumentFile(new File(['# Heading\n- a\n- b'],'chapters.md'));
  expect(md.html).toContain('<h2>Heading</h2>');
  expect(md.html).toContain('<ul><li>a</li><li>b</li></ul>');
 });
 it('joins long hard-wrapped prose without erasing explicit paragraph breaks',async()=>{
  const first='The distant palace stood behind the mountains, and every traveller remembered how the silver gates had glittered';
  const next='when they reached the hillside and saw the gardens below.';
  const txt=new File([first+'\\n'+next+'\\n\\nA new paragraph begins.'],'wrapped.txt');
  const result=await convertDocumentFile(txt);
  expect(result.html).toContain('<p>'+first+' '+next+'</p>');
  expect(result.html).toContain('<p>A new paragraph begins.</p>');
  expect(result.html).not.toContain('</p><p>'+next);
 });
 it('keeps short lineated poetry and separate Markdown blocks untouched',async()=>{
  const poem=await convertDocumentFile(new File(['Beneath the moon\\nwe dance alone\\n\\nAnother verse'],'verse.txt'));
  expect(poem.html).toContain('<p>Beneath the moon</p><p>we dance alone</p>');
  const md=await convertDocumentFile(new File(['# Chapter One\\n- first\\n- second\\n\\nNew scene.'],'scene.md'));
  expect(md.html).toContain('<h2>Chapter One</h2><ul><li>first</li><li>second</li></ul><p>New scene.</p>');
 });
 it('blocks unsupported old binary .doc and script-filled HTML',async()=>{
  await expect(convertDocumentFile(new File(['old'],'draft.doc'))).rejects.toThrow(/saved as \.docx/);
  const html=await convertDocumentFile(new File(['<h2>Good</h2><script>alert(1)</script><p onclick="bad()">Safe</p>'],'safe.html'));
  expect(html.html).toContain('<h2>Good</h2>');
  expect(html.html).not.toMatch(/script|onclick/);
 });
 it('rejects unreasonably large input',async()=>{
  await expect(convertDocumentFile({name:'massive.docx',size:13*1024*1024})).rejects.toThrow(/12 MB/);
 });
});
