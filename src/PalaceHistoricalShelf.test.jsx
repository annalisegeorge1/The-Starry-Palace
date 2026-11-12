import React from 'react';
import {expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceFanfictionShelf from './PalaceFanfictionShelf';
import {toHostedReadingWork} from './hostedReadingWork';

it('uses the reviewed edition rating and literary relationship on the historical shelf',()=>{
 const work=toHostedReadingWork({id:'fixture',slug:'edisons-conquest-of-mars-garrett-p-serviss',title:"Edison's Conquest of Mars",
  category:'historical_fanfiction',source_notes:JSON.stringify({rating:'teen',fandom:'The War of the Worlds'})});
 render(<MemoryRouter><PalaceFanfictionShelf archiveWorks={[work]}/></MemoryRouter>);
 const card=screen.getByText(work.title).closest('article');
 expect(card.textContent).toContain('Literary sequel');
 expect(card.textContent).toContain('Teen');
 expect(card.textContent).toContain('The War of the Worlds');
 expect(card.textContent).not.toContain('Anime & Manga');
});
