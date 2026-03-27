/**
 * Standalone test runner — no npm dependencies required.
 * Run: node tests/run-tests.mjs
 *
 * v2: Updated for agent-reviewed model changes:
 *   - Removed food waste category (no inventory module)
 *   - Restaurant occupancy 75%→65%, fast-casual 80%→72%
 *   - Café avg bill 18→22, fast-casual 22→26
 *   - Table turnover gated by occupancy (<80% → ×0.35)
 *   - Variable overhead 7% added to turnover margin
 *   - Admin savings scaled by preset admin_hours_week × 15%
 *   - Billing: removed faster-checkout (double-counting with turns)
 *   - Hard ceiling: max 2% of revenue above CHF 10M
 *   - 5 categories instead of 6
 */
import {
  calculateRevenue,
  calculateAllSavings,
  autoScaleStaff,
  calcOrderAccuracy,
  calcTableTurnover,
  calcUpselling,
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

// ========== Revenue Formula ==========
console.log('\n=== Revenue Calculation ===');
// Formula: tables × bill × turns × services × 300 × occupancy
assert(calculateRevenue(20, 85, 2, 2, 0.65) === 1326000, 'Restaurant 20t (65% occ) = CHF 1,326,000');
assert(calculateRevenue(15, 85, 2, 2, 0.65) === 994500, 'Restaurant 15t (65% occ) = CHF 994,500 (~CHF 83K/mo)');
assert(calculateRevenue(80, 85, 2, 2, 0.65) === 5304000, 'Restaurant 80t (65% occ) = CHF 5,304,000');
assert(calculateRevenue(10, 22, 3.5, 2, 0.65) === 300300, 'Café 10t (65% occ, bill 22) = CHF 300,300');
assert(calculateRevenue(12, 45, 4, 1, 0.70) === 453600, 'Bar 12t (70% occ) = CHF 453,600');
assert(calculateRevenue(8, 26, 6, 2, 0.72) === 539136, 'Fast-casual 8t (72% occ, bill 26) = CHF 539,136');

// ========== Preset Verification ==========
console.log('\n=== Preset Defaults ===');
assert(PRESETS.restaurant.occupancy_rate === 0.65, 'Restaurant occupancy = 65%');
assert(PRESETS.fast_casual.occupancy_rate === 0.72, 'Fast-casual occupancy = 72%');
assert(PRESETS.cafe.avg_bill === 22, 'Café avg bill = CHF 22');
assert(PRESETS.fast_casual.avg_bill === 26, 'Fast-casual avg bill = CHF 26');

// ========== Savings Scenarios ==========
console.log('\n=== Savings Scenarios ===');

function testScenario(name, params, minSavings, maxSavings) {
  const r = calculateAllSavings(params);
  const monthly = Math.round(r.annualRevenue / 12);
  const pct = ((r.totalAnnualSavings / r.annualRevenue) * 100).toFixed(1);
  const ok = r.totalAnnualSavings >= minSavings && r.totalAnnualSavings <= maxSavings;
  assert(ok,
    `${name}: rev CHF ${formatNumber(r.annualRevenue)} (${formatNumber(monthly)}/mo), savings CHF ${formatNumber(r.totalAnnualSavings)} (${pct}%) [expect ${formatNumber(minSavings)}\u2013${formatNumber(maxSavings)}]`
  );
  r.breakdown.forEach(b => {
    console.log(`      ${b.emoji} ${b.label}: CHF ${formatNumber(Math.round(b.value))}`);
  });
  return r;
}

// Restaurant 15t / 5 staff → rev ~CHF 83K/mo, savings ~CHF 23,700
testScenario('Restaurant 15t default',
  { tables: 15, avgBill: 85, staff: 5, preset: PRESETS.restaurant },
  20000, 28000);

// Restaurant 20t / 6 staff → rev ~CHF 110K/mo, savings ~CHF 29,900
testScenario('Restaurant 20t',
  { tables: 20, avgBill: 85, staff: 6, preset: PRESETS.restaurant },
  26000, 35000);

// Restaurant 12t / 4 staff → rev ~CHF 66K/mo, savings ~CHF 19,500
testScenario('Restaurant 12t',
  { tables: 12, avgBill: 85, staff: 4, preset: PRESETS.restaurant },
  16000, 23000);

// Restaurant 80t / 24 staff → rev CHF 5.3M (caps apply), savings ~CHF 100K
testScenario('Restaurant 80t (large)',
  { tables: 80, avgBill: 85, staff: 24, preset: PRESETS.restaurant },
  85000, 115000);

// Café 10t / 2 staff → rev ~CHF 25K/mo, savings ~CHF 7,900
testScenario('Café 10t',
  { tables: 10, avgBill: 22, staff: 2, preset: PRESETS.cafe },
  5500, 10500);

// Bar 12t / 5 staff → rev ~CHF 38K/mo, savings ~CHF 15,900
testScenario('Bar 12t',
  { tables: 12, avgBill: 45, staff: 5, preset: PRESETS.bar },
  13000, 19000);

// Fast-casual 8t / 4 staff → rev ~CHF 45K/mo, savings ~CHF 14,200
testScenario('Fast-casual 8t',
  { tables: 8, avgBill: 26, staff: 4, preset: PRESETS.fast_casual },
  11000, 18000);

// Hotel restaurant 25t / 8 staff → rev ~CHF 146K/mo, savings ~CHF 38,700
testScenario('Hotel 25t',
  { tables: 25, avgBill: 120, staff: 8, preset: PRESETS.hotel_restaurant },
  33000, 45000);

// Bakery 6t / 2 staff → rev ~CHF 10.8K/mo, savings ~CHF 5,400
testScenario('Bakery 6t',
  { tables: 6, avgBill: 12, staff: 2, preset: PRESETS.bakery },
  3500, 7000);

// Minimum: Bakery 3t / 1 staff → savings ~CHF 3,400
testScenario('Bakery 3t (minimum)',
  { tables: 3, avgBill: 12, staff: 1, preset: PRESETS.bakery },
  2000, 5000);

// ========== Revenue Cap & Savings Ceiling ==========
console.log('\n=== Revenue Cap & Ceiling ===');
const large = calculateAllSavings({ tables: 80, avgBill: 500, staff: 30, preset: PRESETS.hotel_restaurant });
assert(large.annualRevenue > 5000000, `Large hotel revenue = CHF ${formatNumber(large.annualRevenue)} (> 5M)`);
const largePct = large.totalAnnualSavings / large.annualRevenue;
assert(largePct < 0.03, `Savings ${(largePct * 100).toFixed(1)}% of revenue (< 3%)`);

// Savings ceiling: very large revenue (>10M) capped at 2%
assert(large.annualRevenue > 10000000, `Revenue ${formatNumber(large.annualRevenue)} exceeds 10M ceiling threshold`);
assert(largePct <= 0.02 + 0.001, `Savings capped at ≤2% for very large operations (actual: ${(largePct * 100).toFixed(2)}%)`);

// ========== Table Turnover Occupancy Gating ==========
console.log('\n=== Table Turnover Occupancy Gating ===');
const rev1M = 1000000;
const lowOccPreset = { ...PRESETS.restaurant, occupancy_rate: 0.60 };
const highOccPreset = { ...PRESETS.restaurant, occupancy_rate: 0.85 };
const lowTurn = calcTableTurnover(rev1M, lowOccPreset);
const highTurn = calcTableTurnover(rev1M, highOccPreset);
assert(highTurn > lowTurn * 2, `High occ turnover (${Math.round(highTurn)}) > 2× low occ (${Math.round(lowTurn)})`);

// ========== Breakdown ==========
console.log('\n=== Breakdown ===');
const r = calculateAllSavings({ tables: 15, avgBill: 85, staff: 5, preset: PRESETS.restaurant });
let sorted = true;
for (let i = 0; i < r.breakdown.length - 1; i++) {
  if (r.breakdown[i].value < r.breakdown[i + 1].value) sorted = false;
}
assert(sorted, 'Breakdown sorted largest to smallest');
assert(r.breakdown.length === 5, 'Breakdown has 5 categories (no food waste)');
const keys = r.breakdown.map(b => b.key);
assert(!keys.includes('foodWaste'), 'No foodWaste category in breakdown');
assert(keys.includes('upselling'), 'Has upselling category');
assert(keys.includes('laborEfficiency'), 'Has laborEfficiency category');

// ========== Admin Scaling ==========
console.log('\n=== Admin Savings Scaling ===');
// Bakery: admin = max(1, min(8, 6 × 0.15)) = 1 hr/wk → CHF 1,400/yr
// Hotel: admin = max(1, min(8, 15 × 0.15)) = 2.25 hr/wk → CHF 3,150/yr
const bakeryLabor = calcLaborEfficiency(1, PRESETS.bakery);
const hotelLabor = calcLaborEfficiency(1, PRESETS.hotel_restaurant);
// Both have 1 FOH staff = CHF 1,400, so diff is admin only
const bakeryAdmin = bakeryLabor - 1400;
const hotelAdmin = hotelLabor - 1400;
assert(closeTo(bakeryAdmin, 1400, 10), `Bakery admin = CHF ${Math.round(bakeryAdmin)} (~1,400 = 1hr/wk)`);
assert(closeTo(hotelAdmin, 3150, 10), `Hotel admin = CHF ${Math.round(hotelAdmin)} (~3,150 = 2.25hr/wk)`);

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
