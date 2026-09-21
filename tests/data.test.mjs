import test from 'node:test';
import assert from 'node:assert/strict';

import { loadDataset } from '../src/data.js';
import { REQUIRED_CRITERIA } from '../src/domain.js';

const emptyDataset = {
  meta: {
    title: 'Maisons à comparer — Antony 92160',
    updatedAt: '2026-09-21T10:00:00.000Z',
    criteria: { ...REQUIRED_CRITERIA },
    disclaimer: 'Sélection éditoriale à vérifier auprès des agences.',
  },
  listings: [],
};

test('loads and validates an empty dataset without inventing listings', async () => {
  const fetchStub = async (url) => ({
    ok: true,
    status: 200,
    async json() { return emptyDataset; },
    url,
  });

  const result = await loadDataset(fetchStub, './data/listings.json');
  assert.deepEqual(result.listings, []);
});

test('reports a useful error for a failed data request', async () => {
  const fetchStub = async () => ({ ok: false, status: 503 });

  await assert.rejects(
    loadDataset(fetchStub, './data/listings.json'),
    /Impossible de charger les maisons \(503\)/,
  );
});

test('reports validation errors instead of rendering unsafe data', async () => {
  const fetchStub = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { ...emptyDataset, meta: { ...emptyDataset.meta, criteria: {} } };
    },
  });

  await assert.rejects(
    loadDataset(fetchStub, './data/listings.json'),
    /Données invalides/,
  );
});
