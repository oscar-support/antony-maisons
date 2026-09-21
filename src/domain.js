import { DEFAULT_MAX_PRICE, normalizeBudget } from './formatting.js';

export const REQUIRED_CRITERIA = Object.freeze({
  city: 'Antony',
  postalCode: '92160',
  type: 'house',
  transaction: 'sale',
  minArea: 100,
  minBedrooms: 3,
  basementRequired: true,
  maxPriceExclusive: 750000,
});

function meetsRequiredBaseline(listing) {
  return listing?.city === REQUIRED_CRITERIA.city
    && listing?.postalCode === REQUIRED_CRITERIA.postalCode
    && listing?.type === REQUIRED_CRITERIA.type
    && listing?.transaction === REQUIRED_CRITERIA.transaction
    && listing?.area >= REQUIRED_CRITERIA.minArea
    && listing?.bedrooms >= REQUIRED_CRITERIA.minBedrooms
    && listing?.basement === REQUIRED_CRITERIA.basementRequired
    && listing?.price < REQUIRED_CRITERIA.maxPriceExclusive;
}

export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .trim();
}

function matchesKeyword(listing, keyword) {
  if (!keyword) return true;
  const haystack = normalizeSearch([
    listing.title,
    listing.neighborhood,
    listing.description,
  ].join(' '));
  return haystack.includes(keyword);
}

function getEffectiveMaxPrice(value) {
  return normalizeBudget(value);
}

function getRequiredOrHigher(value, required) {
  const requested = Number(value);
  return Number.isFinite(requested) ? Math.max(requested, required) : required;
}

export function filterListings(listings, options = {}) {
  const keyword = normalizeSearch(options.keyword);
  const maxPrice = getEffectiveMaxPrice(options.maxPrice);
  const minArea = getRequiredOrHigher(options.minArea, REQUIRED_CRITERIA.minArea);
  const minBedrooms = getRequiredOrHigher(options.minBedrooms, REQUIRED_CRITERIA.minBedrooms);
  const favoriteIds = options.favoriteIds instanceof Set
    ? options.favoriteIds
    : new Set(Array.isArray(options.favoriteIds) ? options.favoriteIds : []);

  return listings.filter((listing) => meetsRequiredBaseline(listing)
    && listing.area >= minArea
    && listing.bedrooms >= minBedrooms
    && listing.price <= maxPrice
    && matchesKeyword(listing, keyword)
    && (!options.favoritesOnly || favoriteIds.has(listing.id)));
}

export function sortListings(listings, sortBy = 'price-asc') {
  const indexed = listings.map((listing, index) => ({ listing, index }));
  const compareNumber = (left, right, direction = 1) => {
    const difference = left - right;
    return difference === 0 ? 0 : difference * direction;
  };

  indexed.sort((left, right) => {
    let result = 0;
    if (sortBy === 'price-desc') {
      result = compareNumber(right.listing.price, left.listing.price);
    } else if (sortBy === 'area-desc') {
      result = compareNumber(right.listing.area, left.listing.area);
    } else if (sortBy === 'price-m2') {
      result = compareNumber(
        left.listing.price / left.listing.area,
        right.listing.price / right.listing.area,
      );
    } else {
      result = compareNumber(left.listing.price, right.listing.price);
    }
    return result || left.index - right.index;
  });

  return indexed.map(({ listing }) => listing);
}
