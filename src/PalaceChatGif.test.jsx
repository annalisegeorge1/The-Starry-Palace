import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import PalaceChatGif from './PalaceChatGif';
describe('chat quote presentation',()=>{
 it('separates a quoted line from its reply without interpreting message HTML',()=>{
  const html=renderToStaticMarkup(<PalaceChatGif body={'↩ Quoting you: “Testing”\n\nTesting quote <script>no</script>'}/>);
  expect(html).toContain('<blockquote class="palace-chat-inline-quote">');
  expect(html).toContain('</blockquote><p>Testing quote &lt;script&gt;no&lt;/script&gt;</p>');
 });
 it('leaves ordinary multiline messages as plain text',()=>{
  const html=renderToStaticMarkup(<PalaceChatGif body={'Hello\nSecond line'}/>);
  expect(html).toBe('<p>Hello\nSecond line</p>');
 });
});
