import test from 'node:test';
import assert from 'node:assert/strict';

import { filterListings, REQUIRED_CRITERIA, sortListings } from '../src/domain.js';

const listing = (overrides = {}) => ({
  id: 'antony-001',
  title: 'Maison familiale près du centre',
  city: 'Antony',
  postalCode: '92160',
  type: 'house',
  transaction: 'sale',
  price: 850000,
  area: 132,
  bedrooms: 4,
  rooms: 6,
  landArea: 420,
  neighborhood: 'Centre-ville',
  basement: true,
  basementQuote: 'Sous-sol total, sain et éclairé.',
  description: 'Maison calme avec jardin et sous-sol total.',
  dpe: 'D',
  url: 'https://example.com/maison-001',
  source: 'Agence de test',
  sourceRef: null,
  checkedAt: '2026-09-21T10:00:00.000Z',
  availability: 'listed',
  notes: '',
  ...overrides,
});

test('filters the immutable Antony house baseline, not room count', () => {
  const listings = [
    listing({ id: 'eligible', rooms: 3, bedrooms: 3, price: 749500 }),
    listing({ id: 'wrong-city', city: 'Massy' }),
    listing({ id: 'wrong-type', type: 'apartment' }),
    listing({ id: 'wrong-transaction', transaction: 'rent' }),
    listing({ id: 'too-small', area: 99, bedrooms: 5 }),
    listing({ id: 'too-few-bedrooms', area: 180, bedrooms: 2, rooms: 7 }),
    listing({ id: 'no-basement', basement: false, bedrooms: 5 }),
    listing({ id: 'boundary-accepted', price: 749999 }),
    listing({ id: 'boundary-rejected', price: 750000 }),
  ];

  assert.deepEqual(filterListings(listings).map(({ id }) => id), [
    'eligible',
    'boundary-accepted',
  ]);
  assert.equal(REQUIRED_CRITERIA.minBedrooms, 3);
  assert.equal(REQUIRED_CRITERIA.minArea, 100);
  assert.equal(REQUIRED_CRITERIA.basementRequired, true);
  assert.equal(REQUIRED_CRITERIA.maxPriceExclusive, 750000);
});

test('searches title, neighbourhood, and description without accent sensitivity', () => {
  const listings = [
    listing({
      id: 'cote-dor',
      title: 'Maison lumineuse',
      neighborhood: "Côte d'Or",
      description: 'Jardin arboré et sous-sol complet.',
      price: 700000,
    }),
    listing({
      id: 'description-match',
      title: 'Maison familiale',
      neighborhood: 'Centre',
      description: 'Sous-sol sain à deux pas du parc.',
      price: 710000,
    }),
  ];

  assert.deepEqual(
    filterListings(listings, { keyword: "COTE D'OR" }).map(({ id }) => id),
    ['cote-dor'],
  );
  assert.deepEqual(
    filterListings(listings, { keyword: 'SOUS-SOL' }).map(({ id }) => id),
    ['cote-dor', 'description-match'],
  );
});

test('treats an entered budget as an inclusive cap that cannot loosen 749999', () => {
  const listings = [
    listing({ id: 'under-cap', price: 700000 }),
    listing({ id: 'boundary', price: 749999 }),
    listing({ id: 'baseline-ceiling', price: 750000 }),
  ];

  assert.deepEqual(
    filterListings(listings, { maxPrice: 700000 }).map(({ id }) => id),
    ['under-cap'],
  );
  assert.deepEqual(
    filterListings(listings, { maxPrice: 900000 }).map(({ id }) => id),
    ['under-cap', 'boundary'],
  );
});

test('keeps cent-denominated prices below the strict ceiling in the default selection', () => {
  const listings = [
    listing({ id: 'fractional-under-cap', price: 749999.5 }),
    listing({ id: 'cent-ceiling', price: 749999.99 }),
    listing({ id: 'strict-ceiling', price: 750000 }),
  ];

  assert.deepEqual(filterListings(listings).map(({ id }) => id), [
    'fractional-under-cap',
    'cent-ceiling',
  ]);
});

test('sorts by price, area, and price per square metre', () => {
  const listings = [
    listing({ id: 'small-value', price: 500000, area: 125 }),
    listing({ id: 'largest', price: 650000, area: 180 }),
    listing({ id: 'low-price', price: 450000, area: 110 }),
  ];

  assert.deepEqual(sortListings(listings, 'price-asc').map(({ id }) => id), [
    'low-price',
    'small-value',
    'largest',
  ]);
  assert.deepEqual(sortListings(listings, 'area-desc').map(({ id }) => id), [
    'largest',
    'small-value',
    'low-price',
  ]);
  assert.deepEqual(sortListings(listings, 'price-m2').map(({ id }) => id), [
    'largest',
    'small-value',
    'low-price',
  ]);
});

test('never lets optional area or bedroom filters loosen the required baseline', () => {
  const listings = [
    listing({ id: 'baseline', area: 100, bedrooms: 3, price: 600000 }),
    listing({ id: 'larger', area: 150, bedrooms: 4, price: 620000 }),
    listing({ id: 'too-small', area: 99, bedrooms: 5, price: 610000 }),
    listing({ id: 'too-few-bedrooms', area: 150, bedrooms: 2, price: 610000 }),
  ];

  assert.deepEqual(
    filterListings(listings, { minArea: 80, minBedrooms: 2 }).map(({ id }) => id),
    ['baseline', 'larger'],
  );
  assert.deepEqual(
    filterListings(listings, { minArea: 140, minBedrooms: 4 }).map(({ id }) => id),
    ['larger'],
  );
});

test('filters favorites without changing the immutable criteria', () => {
  const listings = [
    listing({ id: 'favorite', price: 600000 }),
    listing({ id: 'other', price: 610000 }),
  ];

  assert.deepEqual(
    filterListings(listings, { favoritesOnly: true, favoriteIds: new Set(['favorite']) })
      .map(({ id }) => id),
    ['favorite'],
  );
});
