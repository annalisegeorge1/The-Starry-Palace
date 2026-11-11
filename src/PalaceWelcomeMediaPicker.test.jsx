import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import PalaceWelcomeMediaPicker from './PalaceWelcomeMediaPicker';
import {PALACE_IMAGE_MAX_BYTES,validatePalaceWelcomeImage,palaceWelcomeFandoms} from './palaceWelcomeMediaModel';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Palace welcome image selection',()=>{
 it('rejects wrong file types, empty files, and files above 6 MB',()=>{
  expect(validatePalaceWelcomeImage(new File(['x'],'x.svg',{type:'image/svg+xml'}))).toMatch(/JPG/);
  expect(validatePalaceWelcomeImage(new File([],'empty.png',{type:'image/png'}))).toMatch(/empty/);
  expect(validatePalaceWelcomeImage({name:'huge.png',type:'image/png',size:PALACE_IMAGE_MAX_BYTES+1})).toMatch(/6 MB/);
  expect(validatePalaceWelcomeImage(new File(['x'],'portrait.png',{type:'image/png'}))).toBe('');
 });
 it('never sends invalid image files to onboarding state',()=>{
  const onChange=vi.fn();
  render(<PalaceWelcomeMediaPicker kind="avatar" label="Avatar" file={null} onChange={onChange}/>);
  fireEvent.change(screen.getByLabelText('Upload avatar image'),{target:{files:[new File(['bad'],'bad.svg',{type:'image/svg+xml'})]}});
  expect(screen.getByRole('alert').textContent).toMatch(/JPG/);
  expect(onChange).not.toHaveBeenCalled();
 });
 it('shows a preview, allows replacement and clearing, and revokes blob URLs',()=>{
  const revoke=vi.fn();
  vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:palace-preview'),revokeObjectURL:revoke});
  const photo=new File(['image'],'portrait.png',{type:'image/png'});
  const onChange=vi.fn();
  const view=render(<PalaceWelcomeMediaPicker kind="avatar" label="Avatar" file={photo} onChange={onChange}/>);
  expect(screen.getByAltText('Selected avatar preview').getAttribute('src')).toBe('blob:palace-preview');
  fireEvent.click(screen.getByRole('button',{name:'Remove selected image'}));
  expect(onChange).toHaveBeenCalledWith(null);
  view.unmount();
  expect(revoke).toHaveBeenCalledWith('blob:palace-preview');
 });
 it('preserves current member artwork until a replacement is selected',()=>{
  render(<PalaceWelcomeMediaPicker kind="cover" label="Chamber cover" file={null} existingImage="https://example.com/current-cover.webp" onChange={vi.fn()}/>);
  expect(screen.getByAltText('Current chamber cover preview').getAttribute('src')).toContain('current-cover.webp');
  expect(screen.getByText('Current image will be kept')).toBeTruthy();
 });
 it('normalizes and deduplicates fandom interests',()=>{
  expect(palaceWelcomeFandoms('Star Wars,  Doctor Who, Star Wars,  ')).toEqual(['Star Wars','Doctor Who']);
 });
});
