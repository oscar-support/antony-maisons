const MAX_PRICE_EXCLUSIVE = 750000;
const CENTS_PER_EURO = 100;

export const DEFAULT_MAX_PRICE = (MAX_PRICE_EXCLUSIVE * CENTS_PER_EURO - 1) / CENTS_PER_EURO;

const integerPriceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const fractionalPriceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const areaFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

export function isCentAmount(value) {
  return typeof value === 'number'
    && Number.isFinite(value)
    && Math.abs(value - Math.round(value * CENTS_PER_EURO) / CENTS_PER_EURO) < 1e-9;
}

export function normalizeBudget(value) {
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) return DEFAULT_MAX_PRICE;
  const cents = Math.floor(requested * CENTS_PER_EURO + Number.EPSILON) / CENTS_PER_EURO;
  return cents > 0 ? Math.min(cents, DEFAULT_MAX_PRICE) : DEFAULT_MAX_PRICE;
}

export function formatPrice(value) {
  return (Number.isInteger(value) ? integerPriceFormatter : fractionalPriceFormatter).format(value);
}

export function formatArea(value) {
  return `${areaFormatter.format(value)} m²`;
}
