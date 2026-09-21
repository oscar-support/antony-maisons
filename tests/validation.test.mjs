import test from 'node:test';
import assert from 'node:assert/strict';

import { REQUIRED_CRITERIA } from '../src/domain.js';
import { isSafeExternalUrl, validateDataset } from '../src/validation.js';

const criteria = { ...REQUIRED_CRITERIA };

const validListing = (overrides = {}) => ({
  id: 'antony-001',
  title: 'Maison familiale avec sous-sol',
  city: 'Antony',
  postalCode: '92160',
  type: 'house',
  transaction: 'sale',
  price: 749999,
  area: 120,
  bedrooms: 4,
  rooms: 6,
  landArea: 300,
  neighborhood: 'Centre-ville',
  basement: true,
  basementQuote: 'Sous-sol total accessible depuis la maison.',
  description: 'Maison lumineuse avec jardin.',
  dpe: 'D',
  url: 'https://example.com/maison-001',
  source: 'Agence de test',
  sourceRef: 'annonce-001',
  checkedAt: '2026-09-20T10:00:00.000Z',
  availability: 'listed',
  notes: 'Vérifier la disponibilité.',
  ...overrides,
});

const validDataset = (listings = [validListing()]) => ({
  meta: {
    title: 'Maisons à comparer — Antony 92160',
    updatedAt: '2026-09-21T10:00:00.000Z',
    criteria,
    disclaimer: 'Sélection éditoriale à vérifier auprès des agences.',
  },
  listings,
});

test('validates the data contract and strict price boundary', () => {
  const result = validateDataset(validDataset());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(REQUIRED_CRITERIA.maxPriceExclusive, 750000);

  const rejected = validateDataset(validDataset([
    validListing({ id: 'exact-ceiling', url: 'https://example.com/exact', price: 750000 }),
  ]));
  assert.equal(rejected.valid, false);
  assert.ok(rejected.errors.some((error) => error.includes('price')));
});

test('accepts prices with at most two decimal places below the strict ceiling', () => {
  assert.equal(validateDataset(validDataset([
    validListing({ id: 'fractional', price: 749999.5 }),
  ])).valid, true);

  const tooPrecise = validateDataset(validDataset([
    validListing({ id: 'too-precise', price: 749999.999 }),
  ]));
  assert.equal(tooPrecise.valid, false);
  assert.ok(tooPrecise.errors.some((error) => error.includes('price')));
});

test('rejects unsafe links, duplicate identifiers, and missing source timestamps', () => {
  const result = validateDataset(validDataset([
    validListing({
      id: 'duplicate',
      url: 'https://example.com/maison-001',
      checkedAt: 'not-a-date',
    }),
    validListing({
      id: 'duplicate',
      url: 'https://example.com/maison-001',
    }),
    validListing({
      id: 'unsafe',
      url: 'javascript:alert(1)',
    }),
  ]));

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('unique id')));
  assert.ok(result.errors.some((error) => error.includes('unique URL')));
  assert.ok(result.errors.some((error) => error.includes('checkedAt')));
});

test('allows only external https source links', () => {
  assert.equal(isSafeExternalUrl('https://agency.example/listing'), true);
  assert.equal(isSafeExternalUrl('http://agency.example/listing'), false);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('/relative/listing'), false);
  assert.equal(isSafeExternalUrl('https://'), false);
});
