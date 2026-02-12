/**
 * Standalone test runner — no npm dependencies required.
 * Run: node tests/run-tests.mjs
 */
import {
  calculateRevenue,
  calculateAllSavings,
  autoScaleStaff,
  calcOrderAccuracy,
  calcTableTurnover,
  calcUpselling,
  calcFoodWaste,
  calcLaborEfficiency,
  calcBillingEfficiency,
  calculateContextMetrics,
} from '../src/utils/calculations.js';
import { PRESETS } from '../src/config/presets.js';
import { formatCHF, formatNumber, formatPercent, roundTo } from '../src/utils/formatting.js';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  \u2705 ${name}`);
  } else {
    failed++;
    console.log(`  \u274C ${name}`);
  }
}

function closeTo(a, b, tolerance = 50) {
  return Math.abs(a - b) <= tolerance;
}

// ========== Revenue with Occupancy ==========
console.log('\n=== Revenue Calculation (with occupancy) ===');
// Restaurant: 20 × 85 × 2 × 2 × 300 × 0.75 = 1,530,000
assert(calculateRevenue(20, 85, 2, 2, 0.75) === 1530000, 'Restaurant 20 tables (75% occ) = CHF 1,530,000');
// Restaurant: 15 × 85 × 2 × 2 × 300 × 0.75 = 1,147,500
assert(calculateRevenue(15, 85, 2, 2, 0.75) === 1147500, 'Restaurant 15 tables (75% occ) = CHF 1,147,500 (~CHF 96K/mo)');
// Restaurant: 80 × 85 × 2 × 2 × 300 × 0.75 = 6,120,000
assert(calculateRevenue(80, 85, 2, 2, 0.75) === 6120000, 'Restaurant 80 tables (75% occ) = CHF 6,120,000 (not 8M!)');
// Café: 10 × 18 × 3.5 × 2 × 300 × 0.65 = 245,700
assert(calculateRevenue(10, 18, 3.5, 2, 0.65) === 245700, 'Café 10 tables (65% occ) = CHF 245,700');
// Bar: 12 × 45 × 4 × 1 × 300 × 0.70 = 453,600
assert(calculateRevenue(12, 45, 4, 1, 0.70) === 453600, 'Bar 12 tables (70% occ) = CHF 453,600');

// ========== Grand Total with realistic numbers ==========
console.log('\n=== Savings Scenarios (with occupancy) ===');

function testScenario(name, params, minSavings, maxSavings) {
  const r = calculateAllSavings(params);
  const monthly = Math.round(r.annualRevenue / 12);
  const pct = ((r.totalAnnualSavings / r.annualRevenue) * 100).toFixed(1);
  const ok = r.totalAnnualSavings >= minSavings && r.totalAnnualSavings <= maxSavings;
  assert(ok,
    `${name}: rev CHF ${formatNumber(r.annualRevenue)} (${formatNumber(monthly)}/mo), savings CHF ${formatNumber(r.totalAnnualSavings)} (${pct}%) [expect ${formatNumber(minSavings)}–${formatNumber(maxSavings)}]`
  );
  // Print breakdown
  r.breakdown.forEach(b => {
    console.log(`      ${b.emoji} ${b.label}: CHF ${formatNumber(Math.round(b.value))}`);
  });
  return r;
}

// Restaurant 15 tables (default), 5 staff → ~CHF 96K/mo revenue
testScenario('Restaurant 15t default',
  { tables: 15, avgBill: 85, staff: 5, preset: PRESETS.restaurant },
  25000, 42000);

// Restaurant 20 tables, 6 staff → ~CHF 127K/mo
testScenario('Restaurant 20t',
  { tables: 20, avgBill: 85, staff: 6, preset: PRESETS.restaurant },
  35000, 55000);

// Restaurant 12 tables, 4 staff → ~CHF 76K/mo
testScenario('Restaurant 12t',
  { tables: 12, avgBill: 85, staff: 4, preset: PRESETS.restaurant },
  22000, 36000);

// Restaurant 80 tables → CHF 6.12M (was 8.16M without occupancy)
testScenario('Restaurant 80t (large)',
  { tables: 80, avgBill: 85, staff: 24, preset: PRESETS.restaurant },
  100000, 220000);

// Café 10 tables, 2 staff
testScenario('Café 10t',
  { tables: 10, avgBill: 18, staff: 2, preset: PRESETS.cafe },
  7000, 15000);

// Bar 12 tables, 5 staff
testScenario('Bar 12t',
  { tables: 12, avgBill: 45, staff: 5, preset: PRESETS.bar },
  15000, 25000);

// Fast-casual 8 tables, 4 staff
testScenario('Fast-casual 8t',
  { tables: 8, avgBill: 22, staff: 4, preset: PRESETS.fast_casual },
  15000, 25000);

// Hotel restaurant 25 tables, 8 staff
testScenario('Hotel 25t',
  { tables: 25, avgBill: 120, staff: 8, preset: PRESETS.hotel_restaurant },
  45000, 70000);

// Bakery 6 tables, 2 staff
testScenario('Bakery 6t',
  { tables: 6, avgBill: 12, staff: 2, preset: PRESETS.bakery },
  5000, 12000);

// Minimum: Bakery 3 tables, 1 staff
testScenario('Bakery 3t (minimum)',
  { tables: 3, avgBill: 12, staff: 1, preset: PRESETS.bakery },
  3000, 8000);

// ========== Revenue Cap ==========
console.log('\n=== Revenue Cap ===');
const large = calculateAllSavings({ tables: 80, avgBill: 500, staff: 30, preset: PRESETS.hotel_restaurant });
assert(large.annualRevenue > 5000000, `Large hotel revenue = CHF ${formatNumber(large.annualRevenue)} (> 5M)`);
const largePct = large.totalAnnualSavings / large.annualRevenue;
assert(largePct < 0.05, `Savings ${(largePct * 100).toFixed(1)}% of revenue (< 5%)`);

// ========== Breakdown ==========
console.log('\n=== Breakdown ===');
const r = calculateAllSavings({ tables: 15, avgBill: 85, staff: 5, preset: PRESETS.restaurant });
let sorted = true;
for (let i = 0; i < r.breakdown.length - 1; i++) {
  if (r.breakdown[i].value < r.breakdown[i + 1].value) sorted = false;
}
assert(sorted, 'Breakdown sorted largest to smallest');
assert(r.breakdown.length === 6, 'Breakdown has 6 categories');

// ========== Auto-scale Staff ==========
console.log('\n=== Auto-scale Staff ===');
assert(autoScaleStaff(20, PRESETS.restaurant) === 6, 'Restaurant 20t → 6 staff');
assert(autoScaleStaff(15, PRESETS.restaurant) === 5, 'Restaurant 15t → 5 staff');
assert(autoScaleStaff(10, PRESETS.cafe) === 2, 'Café 10t → 2 staff');
assert(autoScaleStaff(3, PRESETS.bakery) >= 1, 'Min 1 staff');

// ========== Formatting ==========
console.log('\n=== Formatting ===');
assert(formatCHF(38300) === "CHF 38'300", `formatCHF(38300) = "${formatCHF(38300)}"`);
assert(formatNumber(1147500) === "1'147'500", `formatNumber(1147500) = "${formatNumber(1147500)}"`);
assert(formatPercent(0.031) === '3.1%', `formatPercent(0.031) = "${formatPercent(0.031)}"`);
assert(roundTo(38347) === 38300, `roundTo(38347) = ${roundTo(38347)}`);

// ========== Summary ==========
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
