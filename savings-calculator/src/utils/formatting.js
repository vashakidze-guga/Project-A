/**
 * Format a number as Swiss CHF with apostrophe thousand separators.
 * e.g. 38300 → "CHF 38'300"
 */
export function formatCHF(value) {
  const rounded = Math.round(value);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${formatted}`;
}

/**
 * Format a number with Swiss apostrophe separators (no currency prefix).
 * e.g. 1224000 → "1'224'000"
 */
export function formatNumber(value) {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * Format a percentage to one decimal place.
 * e.g. 0.031 → "3.1%"
 */
export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Round to nearest increment (default CHF 100).
 */
export function roundTo(value, increment = 100) {
  return Math.round(value / increment) * increment;
}
