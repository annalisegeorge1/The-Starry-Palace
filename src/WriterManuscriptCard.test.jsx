import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import WriterManuscriptCard,{manuscriptCardDetails} from './WriterManuscriptCard';
afterEach(cleanup);
const work={id:'work-1',slug:'moon-story',title:'Moon Story',publication_status:'published',visibility:'public',chapters:[
 {id:'published',title:'One',status:'published',word_count:100,updated_at:'2026-10-10'},
 {id:'draft',title:'Two',status:'draft',word_count:'200',updated_at:'2026-10-11'},
 {id:'later',title:'Three',status:'draft',word_count:50,scheduled_for:'2026-12-20',updated_at:'2026-10-09'},
 {id:'sooner',title:'Four',status:'draft',word_count:25,scheduled_for:'2026-12-10',updated_at:'2026-10-09'}
]};
it('sums numeric counts and orders the release queue chronologically',()=>{
 const details=manuscriptCardDetails(work);
 expect(details.words).toBe(375);expect(details.published).toBe(1);expect(details.unpublished).toBe(3);
 expect(details.scheduled[0].id).toBe('sooner');
});
it('resumes the latest draft and opens the exact scheduled chapter',()=>{
 const invite=vi.fn();render(<MemoryRouter><WriterManuscriptCard work={work} onInvite={invite}/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Continue chapter/}).getAttribute('href')).toBe('/writing/moon-story?chapter=draft');
 expect(screen.getByRole('link',{name:/Four Scheduled/}).getAttribute('href')).toBe('/writing/moon-story?chapter=sooner');
 fireEvent.click(screen.getByLabelText('More actions for Moon Story'));
 fireEvent.click(screen.getByRole('button',{name:'Invite co-writer'}));expect(invite).toHaveBeenCalledWith('work-1');
});
it('keeps archived manuscripts manageable without offering them as current drafts',()=>{
 render(<MemoryRouter><WriterManuscriptCard work={{...work,publication_status:'archived'}} onInvite={vi.fn()}/></MemoryRouter>);
 expect(screen.getByRole('link',{name:/Manage archived work/}).getAttribute('href')).toBe('/writing/moon-story');
 expect(screen.queryByRole('link',{name:/Continue chapter/})).toBeNull();
});
