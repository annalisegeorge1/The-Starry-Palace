import React from 'react';
import {afterEach, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import RoyalWelcomeChest from './RoyalWelcomeChest';

afterEach(cleanup);

it('requires a deliberate confirmation and shows all three frames and both palettes', () => {
  const onChoose = vi.fn();
  render(<RoyalWelcomeChest onChoose={onChoose}/>);
  expect(screen.getAllByRole('button')).toHaveLength(6);
  expect(screen.getByRole('button', {name: 'Choose a gift first'}).disabled).toBe(true);
  expect(screen.getAllByRole('img', {hidden: true}).length).toBe(0);
  expect(document.querySelectorAll('img.royal-welcome-option-frame')).toHaveLength(3);
  expect(document.querySelectorAll('.royal-welcome-option-palette')).toHaveLength(2);
  expect(onChoose).not.toHaveBeenCalled();

  const frame = screen.getByRole('button', {name: /Starforged Circlet.*Exclusive portrait frame/i});
  fireEvent.click(frame);
  expect(frame.getAttribute('aria-pressed')).toBe('true');
  expect(onChoose).not.toHaveBeenCalled();
  const confirm = screen.getByRole('button', {name: /Confirm Starforged Circlet as my permanent gift/});
  expect(confirm.disabled).toBe(false);
  fireEvent.click(confirm);
  expect(onChoose).toHaveBeenCalledExactlyOnceWith('starforged-circlet');
});

it('lets members change their preview before confirmation', () => {
  const onChoose = vi.fn();
  render(<RoyalWelcomeChest onChoose={onChoose}/>);
  fireEvent.click(screen.getByRole('button', {name: /Moonlit Heirloom.*Exclusive portrait frame/i}));
  const midnight = screen.getByRole('button', {name: /Royal Midnight.*Exclusive Chamber palette/i});
  fireEvent.click(midnight);
  expect(midnight.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', {name: /Moonlit Heirloom.*Exclusive portrait frame/i}).getAttribute('aria-pressed')).toBe('false');
  expect(onChoose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name: /Confirm Royal Midnight as my permanent gift/}));
  expect(onChoose).toHaveBeenCalledExactlyOnceWith('royal-midnight');
});

it('disables selection and confirmation while a gift choice is being saved', () => {
  const onChoose = vi.fn();
  render(<RoyalWelcomeChest busy onChoose={onChoose}/>);
  expect(document.querySelector('.royal-welcome-chest').disabled).toBe(true);
  expect(screen.getAllByRole('button').every(button => button.disabled)).toBe(true);
  expect(onChoose).not.toHaveBeenCalled();
});
