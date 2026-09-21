import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_MAX_PRICE,
  formatArea,
  formatPrice,
  normalizeBudget,
} from '../src/formatting.js';

test('formats area with up to two decimal places without rounding away precision', () => {
  assert.equal(formatArea(140.95), '140,95 m²');
  assert.equal(formatArea(141), '141 m²');
});

test('formats fractional euro values without rounding cents away', () => {
  assert.match(formatPrice(749999.5), /749.?999,50/);
});

test('normalizes budgets to cents while preserving the strict exclusive ceiling', () => {
  assert.equal(DEFAULT_MAX_PRICE, 749999.99);
  assert.equal(normalizeBudget('600000'), 600000);
  assert.equal(normalizeBudget('749999.999'), DEFAULT_MAX_PRICE);
  assert.equal(normalizeBudget(''), DEFAULT_MAX_PRICE);
});