const DEFAULT_FAVORITES_KEY = 'antony-maisons:favorites';

function resolveDefaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readStoredIds(storage, key) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === 'string' && id.trim()))];
  } catch {
    return [];
  }
}

export function createFavoritesStore({
  storage = resolveDefaultStorage(),
  key = DEFAULT_FAVORITES_KEY,
} = {}) {
  let ids = readStoredIds(storage, key);

  function persist() {
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify(ids));
    } catch {
      // A private browsing or quota error must not break the comparison UI.
    }
  }

  return {
    getIds() {
      return [...ids];
    },
    has(id) {
      return ids.includes(id);
    },
    toggle(id) {
      if (typeof id !== 'string' || !id.trim()) return false;
      const index = ids.indexOf(id);
      if (index >= 0) {
        ids = ids.filter((currentId) => currentId !== id);
        persist();
        return false;
      }
      ids = [...ids, id];
      persist();
      return true;
    },
    clear() {
      ids = [];
      persist();
    },
  };
}

export function createComparisonState(limit = 3) {
  const max = Number.isInteger(limit) && limit > 0 ? limit : 3;
  let ids = [];

  return {
    getIds() {
      return [...ids];
    },
    has(id) {
      return ids.includes(id);
    },
    toggle(id) {
      if (typeof id !== 'string' || !id.trim()) {
        return { selected: false, reason: 'invalid' };
      }
      if (ids.includes(id)) {
        ids = ids.filter((currentId) => currentId !== id);
        return { selected: false, reason: null };
      }
      if (ids.length >= max) {
        return { selected: false, reason: 'limit' };
      }
      ids = [...ids, id];
      return { selected: true, reason: null };
    },
    remove(id) {
      ids = ids.filter((currentId) => currentId !== id);
    },
    clear() {
      ids = [];
    },
    get limit() {
      return max;
    },
  };
}
