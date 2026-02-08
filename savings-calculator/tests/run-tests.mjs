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

// ========== Revenue ==========
console.log('\n=== Revenue Calculation ===');
assert(calculateRevenue(20, 85, 2, 2) === 2040000, 'Restaurant 20 tables = CHF 2,040,000');
assert(calculateRevenue(12, 85, 2, 2) === 1224000, 'Restaurant 12 tables = CHF 1,224,000');
assert(calculateRevenue(10, 18, 3.5, 2) === 378000, 'Café 10 tables = CHF 378,000');
assert(calculateRevenue(12, 45, 4, 1) === 648000, 'Bar 12 tables = CHF 648,000');

// ========== Category Formulas ==========
console.log('\n=== Category 1: Order Accuracy ===');
const cat1 = calcOrderAccuracy(2040000, PRESETS.restaurant);
assert(closeTo(cat1, 5100), `Restaurant CHF ${cat1.toFixed(0)} ≈ 5,100`);

console.log('\n=== Category 2: Table Turnover ===');
const cat2 = calcTableTurnover(2040000, PRESETS.restaurant);
assert(closeTo(cat2, 14280), `Restaurant CHF ${cat2.toFixed(0)} ≈ 14,280`);

console.log('\n=== Category 3: Upselling ===');
const cat3 = calcUpselling(2040000, PRESETS.restaurant);
assert(closeTo(cat3, 20196), `Restaurant CHF ${cat3.toFixed(0)} ≈ 20,196`);

console.log('\n=== Category 4: Food Waste ===');
const cat4 = calcFoodWaste(2040000, PRESETS.restaurant);
assert(closeTo(cat4, 6120), `Restaurant CHF ${cat4.toFixed(0)} ≈ 6,120`);
assert(calcFoodWaste(648000, { ...PRESETS.bar, food_cost_pct: 0 }) === 0, 'Zero food cost = CHF 0');

console.log('\n=== Category 5: Labor ===');
const cat5 = calcLaborEfficiency(6, PRESETS.restaurant);
assert(closeTo(cat5, 11200), `Restaurant 6 staff CHF ${cat5.toFixed(0)} ≈ 11,200`);

console.log('\n=== Category 6: Billing ===');
const cat6 = calcBillingEfficiency(2040000);
assert(closeTo(cat6, 4080), `Restaurant CHF ${cat6.toFixed(0)} ≈ 4,080`);

// ========== Grand Total Tests ==========
console.log('\n=== Grand Total QA Targets ===');

function testScenario(name, params, expectedRevenue, minSavings, maxSavings) {
  const r = calculateAllSavings(params);
  if (expectedRevenue != null) {
    assert(r.annualRevenue === expectedRevenue, `${name}: revenue = CHF ${r.annualRevenue.toLocaleString()}`);
  }
  assert(
    r.totalAnnualSavings >= minSavings && r.totalAnnualSavings <= maxSavings,
    `${name}: savings = CHF ${r.totalAnnualSavings.toLocaleString()} (expect ${minSavings.toLocaleString()}–${maxSavings.toLocaleString()})`
  );
  const pct = ((r.totalAnnualSavings / r.annualRevenue) * 100).toFixed(1);
  console.log(`    → ${pct}% of revenue`);
  return r;
}

testScenario('Test 1: Restaurant 20t', { tables: 20, avgBill: 85, staff: 6, preset: PRESETS.restaurant }, 2040000, 55000, 66000);
testScenario('Test 2: Restaurant 12t', { tables: 12, avgBill: 85, staff: 4, preset: PRESETS.restaurant }, 1224000, 34000, 42000);
testScenario('Test 3: Café 8t', { tables: 8, avgBill: 18, staff: 3, preset: PRESETS.cafe }, 302400, 10000, 16000);
testScenario('Test 4: Bar 12t', { tables: 12, avgBill: 45, staff: 5, preset: PRESETS.bar }, 648000, 20000, 28000);
testScenario('Test 5: Bakery min', { tables: 3, avgBill: 12, staff: 1, preset: PRESETS.bakery }, 108000, 5000, 11000);
testScenario('Test 6: Fast-casual 8t', { tables: 8, avgBill: 22, staff: 4, preset: PRESETS.fast_casual }, 633600, 20000, 27000);
testScenario('Test 7: Hotel 25t', { tables: 25, avgBill: 120, staff: 8, preset: PRESETS.hotel_restaurant }, 2700000, 70000, 85000);
testScenario('Test 8: Bakery 6t', { tables: 6, avgBill: 12, staff: 2, preset: PRESETS.bakery }, 216000, 8000, 13000);

// Large hotel — revenue cap test
console.log('\n=== Revenue Cap Test ===');
const large = calculateAllSavings({ tables: 80, avgBill: 500, staff: 30, preset: PRESETS.hotel_restaurant });
assert(large.annualRevenue > 5000000, `Large hotel revenue = CHF ${large.annualRevenue.toLocaleString()} (> 5M)`);
const largePct = large.totalAnnualSavings / large.annualRevenue;
assert(largePct < 0.05, `Savings ${(largePct * 100).toFixed(1)}% of revenue (< 5%)`);

// ========== Breakdown ==========
console.log('\n=== Breakdown Ordering ===');
const r = calculateAllSavings({ tables: 20, avgBill: 85, staff: 6, preset: PRESETS.restaurant });
let sorted = true;
for (let i = 0; i < r.breakdown.length - 1; i++) {
  if (r.breakdown[i].value < r.breakdown[i + 1].value) sorted = false;
}
assert(sorted, 'Breakdown sorted largest to smallest');
assert(r.breakdown.length === 6, 'Breakdown has 6 categories');

// ========== Auto-scale Staff ==========
console.log('\n=== Auto-scale Staff ===');
assert(autoScaleStaff(20, PRESETS.restaurant) === 6, 'Restaurant 20t → 6 staff');
assert(autoScaleStaff(12, PRESETS.restaurant) === 4, 'Restaurant 12t → 4 staff');
assert(autoScaleStaff(10, PRESETS.cafe) === 2, 'Café 10t → 2 staff');
assert(autoScaleStaff(3, PRESETS.bakery) >= 1, 'Min 1 staff');

// ========== Context Metrics ==========
console.log('\n=== Context Metrics ===');
const cm = calculateContextMetrics(38300, 1224000);
assert(closeTo(cm.monthlySavings, 38300 / 12, 1), `Monthly: CHF ${cm.monthlySavings.toFixed(0)}`);
assert(cm.monthsToROI < 2, `ROI in ${cm.monthsToROI.toFixed(1)} months (< 2)`);
assert(closeTo(cm.newMargin, 8.13, 0.5), `New margin: ${cm.newMargin.toFixed(1)}%`);

// ========== Formatting ==========
console.log('\n=== Formatting ===');
assert(formatCHF(38300) === "CHF 38'300", `formatCHF(38300) = "${formatCHF(38300)}"`);
assert(formatCHF(1224000) === "CHF 1'224'000", `formatCHF(1224000) = "${formatCHF(1224000)}"`);
assert(formatNumber(2040000) === "2'040'000", `formatNumber(2040000) = "${formatNumber(2040000)}"`);
assert(formatPercent(0.031) === '3.1%', `formatPercent(0.031) = "${formatPercent(0.031)}"`);
assert(roundTo(38347) === 38300, `roundTo(38347) = ${roundTo(38347)}`);
assert(roundTo(38350) === 38400, `roundTo(38350) = ${roundTo(38350)}`);

// ========== Summary ==========
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
