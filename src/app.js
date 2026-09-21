import { loadDataset } from './data.js';
import {
  filterListings,
  REQUIRED_CRITERIA,
  sortListings,
} from './domain.js';
import {
  DEFAULT_MAX_PRICE,
  formatArea as formatAreaValue,
  formatPrice as formatPriceValue,
  normalizeBudget,
} from './formatting.js';
import { createComparisonState, createFavoritesStore } from './storage.js';
import { isSafeExternalUrl } from './validation.js';

const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });
const DEFAULT_FILTERS = Object.freeze({
  keyword: '',
  maxPrice: DEFAULT_MAX_PRICE,
  minBedrooms: REQUIRED_CRITERIA.minBedrooms,
  minArea: REQUIRED_CRITERIA.minArea,
  favoritesOnly: false,
  sortBy: 'price-asc',
});

const byId = (id) => document.getElementById(id);
const elements = {
  form: byId('filters-form'),
  keyword: byId('keyword'),
  maxPrice: byId('max-price'),
  minBedrooms: byId('min-bedrooms'),
  minArea: byId('min-area'),
  favoritesOnly: byId('favorites-only'),
  sortBy: byId('sort-by'),
  reset: byId('reset-filters'),
  emptyReset: byId('empty-reset'),
  retry: byId('retry-load'),
  loading: byId('loading-state'),
  error: byId('error-state'),
  errorMessage: byId('error-message'),
  empty: byId('empty-state'),
  emptyTitle: byId('empty-title'),
  emptyMessage: byId('empty-message'),
  list: byId('listings-list'),
  resultCount: byId('result-count'),
  datasetMeta: byId('dataset-meta'),
  live: byId('live-region'),
  tray: byId('comparison-tray'),
  comparisonSummary: byId('comparison-summary'),
  comparisonSelections: byId('comparison-selections'),
  clearComparison: byId('clear-comparison'),
  openComparison: byId('open-comparison'),
  dialog: byId('comparison-dialog'),
  dialogIntro: byId('dialog-intro'),
  dialogHead: byId('comparison-table-head'),
  dialogBody: byId('comparison-table-body'),
};

const state = {
  listings: [],
  meta: null,
  loading: true,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  favorites: createFavoritesStore(),
  comparison: createComparisonState(3),
};

function text(tagName, value, className = '') {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

function button(label, className = 'card-action') {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  return node;
}

function setVisible(node, visible) {
  node.hidden = !visible;
}

function formatPrice(value) {
  return formatPriceValue(value);
}

function formatNumber(value, suffix = '') {
  return `${integer.format(value)}${suffix}`;
}

function formatArea(value) {
  return formatAreaValue(value);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date non communiquée' : dateFormatter.format(date);
}

function formatPricePerM2(listing) {
  return `${integer.format(Math.round(listing.price / listing.area))} €/m²`;
}

function readBudget({ normalize = false } = {}) {
  const rawValue = elements.maxPrice.value.trim();
  if (!normalize && rawValue === '') return undefined;

  const safeValue = normalizeBudget(rawValue);
  if (normalize) elements.maxPrice.value = String(safeValue);
  return safeValue;
}

function readFilters({ normalizeBudgetInput = false } = {}) {
  state.filters = {
    keyword: elements.keyword.value,
    maxPrice: readBudget({ normalize: normalizeBudgetInput }),
    minBedrooms: Number(elements.minBedrooms.value),
    minArea: Number(elements.minArea.value),
    favoritesOnly: elements.favoritesOnly.checked,
    sortBy: elements.sortBy.value,
  };
}

function writeFilters(filters = DEFAULT_FILTERS) {
  elements.keyword.value = filters.keyword;
  elements.maxPrice.value = String(filters.maxPrice);
  elements.minBedrooms.value = String(filters.minBedrooms);
  elements.minArea.value = String(filters.minArea);
  elements.favoritesOnly.checked = filters.favoritesOnly;
  elements.sortBy.value = filters.sortBy;
}

function announce(message) {
  elements.live.textContent = '';
  window.setTimeout(() => {
    elements.live.textContent = message;
  }, 0);
}

function getVisibleListings() {
  const filtered = filterListings(state.listings, {
    ...state.filters,
    favoriteIds: new Set(state.favorites.getIds()),
  });
  return sortListings(filtered, state.filters.sortBy);
}

function createSourceLink(listing, label = 'Voir l’annonce originale') {
  if (!isSafeExternalUrl(listing.url)) {
    return text('span', 'Lien source indisponible', 'source-meta');
  }
  const link = document.createElement('a');
  link.className = 'source-link';
  link.href = listing.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  return link;
}

function createStat(label, value, className = '') {
  const wrapper = document.createElement('div');
  wrapper.className = `stat${className ? ` ${className}` : ''}`;
  wrapper.append(text('dt', label), text('dd', value));
  return wrapper;
}

function createListingCard(listing) {
  const item = document.createElement('li');
  item.className = 'listing-item';

  const article = document.createElement('article');
  article.className = 'listing-card';
  article.dataset.id = listing.id;

  const top = document.createElement('div');
  top.className = 'listing-card-top';
  const headingBlock = document.createElement('div');
  headingBlock.append(
    text('p', `${listing.neighborhood} · Antony`, 'listing-kicker'),
    text('h3', listing.title),
    text('p', listing.description, 'listing-description'),
  );
  const priceBlock = document.createElement('div');
  priceBlock.className = 'listing-price-block';
  priceBlock.append(
    text('strong', formatPrice(listing.price), 'listing-price'),
    text('span', formatPricePerM2(listing), 'price-per-m2'),
  );
  top.append(headingBlock, priceBlock);

  const stats = document.createElement('dl');
  stats.className = 'listing-stats';
  stats.append(
    createStat('Surface', formatArea(listing.area)),
    createStat('Chambres', formatNumber(listing.bedrooms)),
    createStat('Sous-sol', 'Privé · oui'),
    createStat('DPE', listing.dpe ?? 'Non communiqué', listing.dpe ? '' : 'dpe-unknown'),
  );

  const proof = document.createElement('details');
  proof.className = 'listing-proof';
  proof.append(text('summary', 'Voir la preuve du sous-sol'));
  proof.append(text('p', `« ${listing.basementQuote} »`));

  const notes = document.createElement('aside');
  notes.className = 'listing-notes';
  notes.append(
    text('strong', 'À vérifier'),
    text('p', listing.notes),
  );

  const actions = document.createElement('div');
  actions.className = 'listing-actions';
  const actionGroup = document.createElement('div');
  actionGroup.className = 'action-group';

  const favoriteButton = button('');
  favoriteButton.dataset.action = 'favorite';
  favoriteButton.dataset.id = listing.id;
  const isFavorite = state.favorites.has(listing.id);
  favoriteButton.setAttribute('aria-pressed', String(isFavorite));
  favoriteButton.textContent = isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris';

  const compareButton = button('');
  compareButton.dataset.action = 'compare';
  compareButton.dataset.id = listing.id;
  const isCompared = state.comparison.has(listing.id);
  compareButton.setAttribute('aria-pressed', String(isCompared));
  compareButton.textContent = isCompared ? 'Retirer de la comparaison' : 'Comparer';
  actionGroup.append(favoriteButton, compareButton);

  const sourceArea = document.createElement('div');
  sourceArea.className = 'source-area';
  sourceArea.append(
    text('p', `Source : ${listing.source} · vérifiée le ${formatDate(listing.checkedAt)}`, 'source-meta'),
    createSourceLink(listing),
  );
  actions.append(actionGroup, sourceArea);

  article.append(top, stats, proof, notes, actions);
  item.append(article);
  return item;
}

function renderStatus() {
  setVisible(elements.loading, state.loading);
  setVisible(elements.error, !state.loading && Boolean(state.error));
  elements.errorMessage.textContent = state.error ?? 'Le fichier de données est momentanément inaccessible.';
  setVisible(elements.list, !state.loading && !state.error && getVisibleListings().length > 0);
  setVisible(elements.empty, !state.loading && !state.error && getVisibleListings().length === 0);
}

function renderResults() {
  const visible = getVisibleListings();
  const total = visible.length;
  elements.resultCount.textContent = state.loading
    ? 'Chargement des annonces…'
    : `${total} maison${total === 1 ? '' : 's'} dans cette sélection`;

  elements.list.replaceChildren();
  if (!state.loading && !state.error) {
    for (const listing of visible) elements.list.append(createListingCard(listing));
  }

  if (state.listings.length === 0 && !state.loading && !state.error) {
    elements.emptyTitle.textContent = 'La sélection est vide pour le moment.';
    elements.emptyMessage.textContent = 'Les critères sont prêts ; les annonces seront ajoutées après vérification des sources.';
  } else {
    elements.emptyTitle.textContent = 'Aucune maison ne correspond.';
    elements.emptyMessage.textContent = 'Essayez de retirer un filtre optionnel ou réinitialisez la recherche.';
  }

  if (state.meta && !state.loading && !state.error) {
    elements.datasetMeta.hidden = false;
    elements.datasetMeta.textContent = `Sélection mise à jour le ${formatDate(state.meta.updatedAt)}. ${state.meta.disclaimer}`;
  } else {
    elements.datasetMeta.hidden = true;
    elements.datasetMeta.textContent = '';
  }
}

function renderComparisonTray() {
  const selectedIds = state.comparison.getIds();
  const selected = selectedIds
    .map((id) => state.listings.find((listing) => listing.id === id))
    .filter(Boolean);
  setVisible(elements.tray, !state.loading && !state.error && selected.length > 0);
  elements.comparisonSummary.textContent = selected.length === 0
    ? 'Aucune maison sélectionnée · jusqu’à 3 maisons'
    : `${selected.length} sur 3 sélectionnée${selected.length === 1 ? '' : 's'} · choisissez jusqu’à 3 maisons`;

  elements.comparisonSelections.replaceChildren();
  if (selected.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'selection-chip';
    empty.append(text('span', 'Ajoutez une maison depuis la liste.'));
    elements.comparisonSelections.append(empty);
  } else {
    for (const listing of selected) {
      const item = document.createElement('li');
      item.className = 'selection-chip';
      const label = text('span', listing.title);
      label.title = listing.title;
      const remove = button('×', 'remove-selection');
      remove.dataset.action = 'remove-comparison';
      remove.dataset.id = listing.id;
      remove.setAttribute('aria-label', `Retirer ${listing.title} de la comparaison`);
      item.append(label, remove);
      elements.comparisonSelections.append(item);
    }
  }
  elements.openComparison.disabled = selected.length < 2;
  elements.clearComparison.disabled = selected.length === 0;
}

function appendTableValue(row, value) {
  const cell = document.createElement('td');
  if (value instanceof Node) cell.append(value);
  else cell.textContent = value;
  row.append(cell);
}

function createComparisonRow(label, valueFactory, valueClass = '') {
  const row = document.createElement('tr');
  const heading = text('th', label);
  heading.scope = 'row';
  row.append(heading);
  const selected = state.comparison.getIds()
    .map((id) => state.listings.find((listing) => listing.id === id))
    .filter(Boolean);
  selected.forEach((listing) => {
    const value = valueFactory(listing);
    if (valueClass && value instanceof HTMLElement) value.classList.add(valueClass);
    appendTableValue(row, value);
  });
  return row;
}

function renderComparisonDialog() {
  const selected = state.comparison.getIds()
    .map((id) => state.listings.find((listing) => listing.id === id))
    .filter(Boolean);
  elements.dialogIntro.textContent = `${selected.length} maisons · prix et disponibilité à confirmer auprès des agences.`;

  const headerRow = document.createElement('tr');
  const firstHeader = text('th', 'Critère');
  firstHeader.scope = 'col';
  headerRow.append(firstHeader);
  for (const listing of selected) {
    const header = document.createElement('th');
    header.scope = 'col';
    const heading = document.createElement('div');
    heading.className = 'compare-heading';
    heading.append(text('strong', listing.title));
    const remove = button('Retirer', 'table-remove');
    remove.dataset.action = 'remove-comparison';
    remove.dataset.id = listing.id;
    remove.setAttribute('aria-label', `Retirer ${listing.title} de la comparaison`);
    heading.append(remove);
    header.append(heading);
    headerRow.append(header);
  }
  elements.dialogHead.replaceChildren(headerRow);

  elements.dialogBody.replaceChildren();
  elements.dialogBody.append(
    createComparisonRow('Prix', (listing) => text('strong', formatPrice(listing.price), 'table-value-strong')),
    createComparisonRow('Prix / m²', (listing) => formatPricePerM2(listing)),
    createComparisonRow('Surface habitable', (listing) => formatArea(listing.area)),
    createComparisonRow('Chambres', (listing) => formatNumber(listing.bedrooms)),
    createComparisonRow('Quartier', (listing) => listing.neighborhood),
    createComparisonRow('Sous-sol', (listing) => {
      const details = document.createElement('details');
      details.className = 'table-proof';
      details.append(text('summary', 'Preuve'));
      details.append(text('p', listing.basementQuote));
      return details;
    }),
    createComparisonRow('À vérifier', (listing) => listing.notes),
    createComparisonRow('DPE', (listing) => listing.dpe ?? 'Non communiqué'),
    createComparisonRow('Vérifiée le', (listing) => formatDate(listing.checkedAt)),
    createComparisonRow('Source', (listing) => createSourceLink(listing, 'Ouvrir la source')),
  );
}

function render() {
  renderResults();
  renderComparisonTray();
  renderStatus();
}

function findAction(action, id, root = document) {
  return [...root.querySelectorAll('[data-action]')]
    .find((node) => node.dataset.action === action && node.dataset.id === id);
}

function focusFirstAction(action, root) {
  const node = [...root.querySelectorAll('[data-action]')]
    .find((candidate) => candidate.dataset.action === action && !candidate.disabled);
  if (!node) return false;
  node.focus();
  return true;
}

function focusResults() {
  elements.resultCount.tabIndex = -1;
  elements.resultCount.focus();
}

function restoreActionFocus(action, id, { dialogWasOpen = false } = {}) {
  const exact = id ? findAction(action, id) : null;
  if (exact && !exact.disabled) {
    exact.focus();
    return;
  }

  if (action === 'remove-comparison') {
    const context = dialogWasOpen ? elements.dialog : elements.comparisonSelections;
    if (focusFirstAction('remove-comparison', context)) return;
    if (dialogWasOpen) {
      const close = elements.dialog.querySelector('.close-button');
      if (close) {
        close.focus();
        return;
      }
    }
  }

  if (action === 'favorite' && state.filters.favoritesOnly
    && focusFirstAction('favorite', elements.list)) return;
  if (focusFirstAction('compare', elements.list)) return;
  focusResults();
}

function handleAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const id = target.dataset.id;
  if (!id) return;
  const action = target.dataset.action;
  const dialogWasOpen = elements.dialog.open;

  if (action === 'favorite') {
    const selected = state.favorites.toggle(id);
    announce(selected ? 'Maison ajoutée aux favoris.' : 'Maison retirée des favoris.');
    render();
    restoreActionFocus(action, id, { dialogWasOpen });
    return;
  }

  if (action === 'compare' || action === 'remove-comparison') {
    const result = state.comparison.toggle(id);
    if (result.reason === 'limit') {
      announce('La comparaison est limitée à trois maisons.');
      return;
    }
    announce(result.selected ? 'Maison ajoutée à la comparaison.' : 'Maison retirée de la comparaison.');
    render();
    if (dialogWasOpen) renderComparisonDialog();
    restoreActionFocus(action, id, { dialogWasOpen });
  }
}

async function load() {
  state.loading = true;
  state.error = null;
  render();
  try {
    const payload = await loadDataset(window.fetch.bind(window), './data/listings.json');
    state.listings = payload.listings;
    state.meta = payload.meta;
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Erreur inconnue';
  } finally {
    state.loading = false;
    render();
  }
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  readFilters({ normalizeBudgetInput: true });
  announce('Filtres appliqués.');
  render();
});
elements.form.addEventListener('input', () => {
  readFilters();
  render();
});
elements.form.addEventListener('change', (event) => {
  if (event.target === elements.maxPrice) return;
  readFilters();
  render();
});
function normalizeBudgetField() {
  const before = elements.maxPrice.value;
  readFilters({ normalizeBudgetInput: true });
  if (elements.maxPrice.value !== before) render();
}
elements.maxPrice.addEventListener('blur', normalizeBudgetField);
elements.maxPrice.addEventListener('change', normalizeBudgetField);
elements.sortBy.addEventListener('change', () => {
  readFilters();
  render();
});
elements.reset.addEventListener('click', () => {
  writeFilters();
  state.filters = { ...DEFAULT_FILTERS };
  announce('Filtres réinitialisés.');
  render();
});
elements.emptyReset.addEventListener('click', () => {
  writeFilters();
  state.filters = { ...DEFAULT_FILTERS };
  announce('Filtres réinitialisés.');
  render();
});
elements.retry.addEventListener('click', load);
elements.list.addEventListener('click', handleAction);
elements.comparisonSelections.addEventListener('click', handleAction);
elements.dialog.addEventListener('click', handleAction);
elements.clearComparison.addEventListener('click', () => {
  const dialogWasOpen = elements.dialog.open;
  state.comparison.clear();
  announce('Comparaison vidée.');
  render();
  if (dialogWasOpen) renderComparisonDialog();
  restoreActionFocus('clear', null, { dialogWasOpen });
});
elements.openComparison.addEventListener('click', () => {
  renderComparisonDialog();
  if (typeof elements.dialog.showModal === 'function') elements.dialog.showModal();
  elements.dialog.querySelector('.close-button')?.focus();
});
elements.dialog.addEventListener('close', () => {
  if (!elements.openComparison.disabled && !elements.openComparison.hidden) {
    elements.openComparison.focus();
    return;
  }
  focusResults();
});

writeFilters();
render();
load();
