import { getCounterColor } from './charCounter';
import { expect, test } from 'vitest';

test('getCounterColor returns primary for length < 260', () => {
  expect(getCounterColor(100)).toBe('primary');
  expect(getCounterColor(0)).toBe('primary');
});

test('getCounterColor returns warning for length between 260 and 279', () => {
  expect(getCounterColor(265)).toBe('warning');
  expect(getCounterColor(279)).toBe('warning');
});

test('getCounterColor returns error for length >= 280', () => {
  expect(getCounterColor(280)).toBe('error');
  expect(getCounterColor(300)).toBe('error');
});
