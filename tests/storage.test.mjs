import test from 'node:test';
import assert from 'node:assert/strict';

import { createFavoritesStore, createComparisonState } from '../src/storage.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('favorites recover from malformed storage and persist toggles', () => {
  const storage = memoryStorage({ 'antony:favorites': '{not-json' });
  const favorites = createFavoritesStore({ storage, key: 'antony:favorites' });

  assert.deepEqual(favorites.getIds(), []);
  assert.equal(favorites.toggle('house-001'), true);
  assert.equal(favorites.has('house-001'), true);
  assert.deepEqual(JSON.parse(storage.getItem('antony:favorites')), ['house-001']);
  assert.equal(favorites.toggle('house-001'), false);
  assert.equal(favorites.has('house-001'), false);
});

test('favorites ignore invalid persisted shapes and storage failures', () => {
  const malformed = memoryStorage({ 'antony:favorites': '{"unexpected":true}' });
  const favorites = createFavoritesStore({ storage: malformed, key: 'antony:favorites' });
  assert.deepEqual(favorites.getIds(), []);

  const brokenStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const fallback = createFavoritesStore({ storage: brokenStorage, key: 'antony:favorites' });
  assert.equal(fallback.toggle('house-002'), true);
  assert.deepEqual(fallback.getIds(), ['house-002']);
});

test('comparison selection stops at three and reports the limit', () => {
  const comparison = createComparisonState(3);

  assert.deepEqual(comparison.toggle('one'), { selected: true, reason: null });
  assert.deepEqual(comparison.toggle('two'), { selected: true, reason: null });
  assert.deepEqual(comparison.toggle('three'), { selected: true, reason: null });
  assert.deepEqual(comparison.toggle('four'), { selected: false, reason: 'limit' });
  assert.deepEqual(comparison.getIds(), ['one', 'two', 'three']);
  assert.deepEqual(comparison.toggle('two'), { selected: false, reason: null });
  assert.deepEqual(comparison.getIds(), ['one', 'three']);
});
