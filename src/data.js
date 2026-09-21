import { validateDataset } from './validation.js';

export async function loadDataset(fetchImpl = globalThis.fetch, url = './data/listings.json') {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Impossible de charger les maisons (fetch indisponible)');
  }

  let response;
  try {
    response = await fetchImpl(url);
  } catch {
    throw new Error('Impossible de charger les maisons (réseau indisponible)');
  }

  if (!response?.ok) {
    throw new Error(`Impossible de charger les maisons (${response?.status ?? 'réponse inconnue'})`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Données invalides (JSON illisible)');
  }

  const validation = validateDataset(payload);
  if (!validation.valid) {
    throw new Error(`Données invalides (${validation.errors.slice(0, 2).join('; ')})`);
  }

  return payload;
}
