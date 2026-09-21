import { REQUIRED_CRITERIA } from './domain.js';
import { isCentAmount } from './formatting.js';

const REQUIRED_STRING_FIELDS = [
  'id',
  'title',
  'city',
  'postalCode',
  'type',
  'transaction',
  'neighborhood',
  'basementQuote',
  'description',
  'source',
  'availability',
  'notes',
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value) {
  return typeof value === 'string'
    && value.includes('T')
    && Number.isFinite(Date.parse(value));
}

function isNullableNumber(value) {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function hasRequiredCriteria(criteria) {
  return criteria && Object.entries(REQUIRED_CRITERIA)
    .every(([key, expected]) => criteria[key] === expected);
}

export function isSafeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function validateListing(listing, index, ids, urls) {
  const errors = [];
  const label = `listings[${index}]`;
  if (!listing || typeof listing !== 'object' || Array.isArray(listing)) {
    return [`${label} must be an object`];
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(listing[field])) {
      errors.push(`${label}.${field} must be a non-empty string`);
    }
  }

  if (ids.has(listing.id)) errors.push(`${label} has a non-unique id`);
  if (isNonEmptyString(listing.id)) ids.add(listing.id);
  if (urls.has(listing.url)) errors.push(`${label} has a non-unique URL`);
  if (isNonEmptyString(listing.url)) urls.add(listing.url);

  if (listing.city !== REQUIRED_CRITERIA.city) errors.push(`${label}.city must be Antony`);
  if (listing.postalCode !== REQUIRED_CRITERIA.postalCode) errors.push(`${label}.postalCode must be 92160`);
  if (listing.type !== REQUIRED_CRITERIA.type) errors.push(`${label}.type must be house`);
  if (listing.transaction !== REQUIRED_CRITERIA.transaction) errors.push(`${label}.transaction must be sale`);
  if (typeof listing.price !== 'number' || !Number.isFinite(listing.price)
    || !isCentAmount(listing.price)
    || listing.price < 0 || listing.price >= REQUIRED_CRITERIA.maxPriceExclusive) {
    errors.push(`${label}.price must be a cent-denominated number strictly below ${REQUIRED_CRITERIA.maxPriceExclusive}`);
  }
  if (typeof listing.area !== 'number' || !Number.isFinite(listing.area)
    || listing.area < REQUIRED_CRITERIA.minArea) {
    errors.push(`${label}.area must be at least ${REQUIRED_CRITERIA.minArea}`);
  }
  if (!Number.isInteger(listing.bedrooms) || listing.bedrooms < REQUIRED_CRITERIA.minBedrooms) {
    errors.push(`${label}.bedrooms must be an integer of at least ${REQUIRED_CRITERIA.minBedrooms}`);
  }
  if (!isNullableNumber(listing.rooms)) errors.push(`${label}.rooms must be a number or null`);
  if (!isNullableNumber(listing.landArea)) errors.push(`${label}.landArea must be a number or null`);
  if (listing.basement !== true) errors.push(`${label}.basement must be true`);
  if (listing.dpe !== null && !/^[A-G]$/.test(listing.dpe)) errors.push(`${label}.dpe must be A-G or null`);
  if (!isSafeExternalUrl(listing.url)) errors.push(`${label}.url must be a safe https URL`);
  if (listing.sourceRef !== null && !isNonEmptyString(listing.sourceRef)) {
    errors.push(`${label}.sourceRef must be a string or null`);
  }
  if (!isIsoTimestamp(listing.checkedAt)) errors.push(`${label}.checkedAt must be an ISO timestamp`);
  if (listing.availability !== 'listed') errors.push(`${label}.availability must be listed`);

  return errors;
}

export function validateDataset(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['dataset must be an object'] };
  }

  const meta = payload.meta;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    errors.push('meta must be an object');
  } else {
    if (!isNonEmptyString(meta.title)) errors.push('meta.title must be a non-empty string');
    if (!isIsoTimestamp(meta.updatedAt)) errors.push('meta.updatedAt must be an ISO timestamp');
    if (!hasRequiredCriteria(meta.criteria)) errors.push('meta.criteria must match the required criteria');
    if (!isNonEmptyString(meta.disclaimer)) errors.push('meta.disclaimer must be a non-empty string');
  }

  if (!Array.isArray(payload.listings)) {
    errors.push('listings must be an array');
  } else {
    const ids = new Set();
    const urls = new Set();
    payload.listings.forEach((listing, index) => {
      errors.push(...validateListing(listing, index, ids, urls));
    });
  }

  return { valid: errors.length === 0, errors };
}
