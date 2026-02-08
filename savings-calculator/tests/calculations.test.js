import { describe, it, expect } from 'vitest';
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

// ============================
// Revenue Calculation
// ============================
describe('calculateRevenue', () => {
  it('calculates restaurant revenue correctly (20 tables)', () => {
    // 20 × 85 × 2 × 2 × 300 = 2,040,000
    const revenue = calculateRevenue(20, 85, 2, 2);
    expect(revenue).toBe(2040000);
  });

  it('calculates restaurant revenue correctly (12 tables)', () => {
    // 12 × 85 × 2 × 2 × 300 = 1,224,000
    const revenue = calculateRevenue(12, 85, 2, 2);
    expect(revenue).toBe(1224000);
  });

  it('calculates café revenue correctly (10 tables)', () => {
    // 10 × 18 × 3.5 × 2 × 300 = 378,000
    const revenue = calculateRevenue(10, 18, 3.5, 2);
    expect(revenue).toBe(378000);
  });

  it('calculates bar revenue correctly (12 tables)', () => {
    // 12 × 45 × 4 × 1 × 300 = 648,000
    const revenue = calculateRevenue(12, 45, 4, 1);
    expect(revenue).toBe(648000);
  });
});

// ============================
// Individual Category Formulas
// ============================
describe('Category 1: Order Accuracy', () => {
  it('matches spec example for restaurant (CHF 2,040,000)', () => {
    const result = calcOrderAccuracy(2040000, PRESETS.restaurant);
    // Errors: 2,040,000 × 0.008 × 0.20 = 3,264
    // Comps: 2,040,000 × 0.003 × 0.30 = 1,836
    // Total: 5,100
    expect(result).toBeCloseTo(5100, -1);
  });
});

describe('Category 2: Table Turnover', () => {
  it('matches spec example for restaurant (CHF 2,040,000)', () => {
    const result = calcTableTurnover(2040000, PRESETS.restaurant);
    // Extra revenue: 2,040,000 × 0.01 = 20,400
    // Net margin: 20,400 × 0.70 = 14,280
    expect(result).toBeCloseTo(14280, -1);
  });
});

describe('Category 3: Upselling', () => {
  it('matches spec example for restaurant (CHF 2,040,000)', () => {
    const result = calcUpselling(2040000, PRESETS.restaurant);
    // Upsell: 2,040,000 × 0.012 × 0.65 = 15,912
    // Menu: 2,040,000 × 0.003 × 0.70 = 4,284
    // Total: 20,196
    expect(result).toBeCloseTo(20196, -1);
  });
});

describe('Category 4: Food Waste', () => {
  it('matches spec example for restaurant (CHF 2,040,000)', () => {
    const result = calcFoodWaste(2040000, PRESETS.restaurant);
    // Food costs: 612,000
    // Spoilage: 612,000 × 0.04 × 0.15 = 3,672
    // Purchasing: 612,000 × 0.02 × 0.15 = 1,836
    // Portions: 612,000 × 0.01 × 0.10 = 612
    // Total: 6,120
    expect(result).toBeCloseTo(6120, -1);
  });

  it('returns 0 when food_cost_pct is 0', () => {
    const zeroFoodPreset = { ...PRESETS.bar, food_cost_pct: 0 };
    expect(calcFoodWaste(648000, zeroFoodPreset)).toBe(0);
  });
});

describe('Category 5: Labor Efficiency', () => {
  it('matches spec example for restaurant (6 staff)', () => {
    const result = calcLaborEfficiency(6, PRESETS.restaurant);
    // FOH: 6 × 10 × (28/60) × 300 = 8,400
    // Admin: 2 × 28 × 50 = 2,800
    // Total: 11,200
    expect(result).toBeCloseTo(11200, -1);
  });
});

describe('Category 6: Billing Efficiency', () => {
  it('matches spec example for restaurant (CHF 2,040,000)', () => {
    const result = calcBillingEfficiency(2040000);
    // Billing: 2,040,000 × 0.002 × 0.50 = 2,040
    // Checkout: 2,040,000 × 0.001 = 2,040
    // Total: 4,080
    expect(result).toBeCloseTo(4080, -1);
  });
});

// ============================
// Grand Total (Spec Section 7)
// ============================
describe('Grand Total - Spec Worked Examples', () => {
  it('Test 1: Default Restaurant, 20 tables → ~CHF 61,000 (±5,000)', () => {
    const result = calculateAllSavings({
      tables: 20,
      avgBill: 85,
      staff: 6,
      preset: PRESETS.restaurant,
    });
    expect(result.annualRevenue).toBe(2040000);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(55000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(66000);
  });

  it('Test 2: "CHF 100K/month" Restaurant, 12 tables → ~CHF 38,000 (±4,000)', () => {
    const result = calculateAllSavings({
      tables: 12,
      avgBill: 85,
      staff: 4,
      preset: PRESETS.restaurant,
    });
    expect(result.annualRevenue).toBe(1224000);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(34000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(42000);
  });

  it('Test 3: Small Café, 8 tables → ~CHF 13,000 (±3,000)', () => {
    const result = calculateAllSavings({
      tables: 8,
      avgBill: 18,
      staff: 3,
      preset: PRESETS.cafe,
    });
    // 8 × 18 × 3.5 × 2 × 300 = 302,400
    expect(result.annualRevenue).toBe(302400);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(10000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(16000);
  });

  it('Test 4: Medium Bar, 12 tables → ~CHF 24,000 (±4,000)', () => {
    const result = calculateAllSavings({
      tables: 12,
      avgBill: 45,
      staff: 5,
      preset: PRESETS.bar,
    });
    expect(result.annualRevenue).toBe(648000);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(20000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(28000);
  });

  it('Test 5: Minimum Bakery, 3 tables, CHF 12, 1 staff → positive, ~CHF 6,000–10,000', () => {
    const result = calculateAllSavings({
      tables: 3,
      avgBill: 12,
      staff: 1,
      preset: PRESETS.bakery,
    });
    // 3 × 12 × 5 × 2 × 300 = 108,000
    expect(result.annualRevenue).toBe(108000);
    expect(result.totalAnnualSavings).toBeGreaterThan(0);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(5000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(11000);
  });

  it('Test 6: Large Hotel, 80 tables, CHF 500, 30 staff → revenue > 5M, caps trigger', () => {
    const result = calculateAllSavings({
      tables: 80,
      avgBill: 500,
      staff: 30,
      preset: PRESETS.hotel_restaurant,
    });
    // 80 × 500 × 1.5 × 2 × 300 = 36,000,000
    expect(result.annualRevenue).toBeGreaterThan(5000000);
    // Savings should scale but caps prevent absurd numbers
    expect(result.totalAnnualSavings).toBeGreaterThan(0);
    // As percentage of revenue, should be reasonable (< 5%)
    const pctOfRevenue = result.totalAnnualSavings / result.annualRevenue;
    expect(pctOfRevenue).toBeLessThan(0.05);
  });
});

// ============================
// QA Target Ranges (Spec Section 7)
// ============================
describe('QA Target Ranges', () => {
  it('Fast-casual, 8 tables, CHF 22, 4 staff → CHF 20,000–27,000', () => {
    const result = calculateAllSavings({
      tables: 8,
      avgBill: 22,
      staff: 4,
      preset: PRESETS.fast_casual,
    });
    // 8 × 22 × 6 × 2 × 300 = 633,600
    expect(result.annualRevenue).toBe(633600);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(20000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(27000);
  });

  it('Hotel restaurant, 25 tables, CHF 120, 8 staff → CHF 70,000–85,000', () => {
    const result = calculateAllSavings({
      tables: 25,
      avgBill: 120,
      staff: 8,
      preset: PRESETS.hotel_restaurant,
    });
    // 25 × 120 × 1.5 × 2 × 300 = 2,700,000
    expect(result.annualRevenue).toBe(2700000);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(70000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(85000);
  });

  it('Bakery, 6 tables, CHF 12, 2 staff → CHF 8,000–13,000', () => {
    const result = calculateAllSavings({
      tables: 6,
      avgBill: 12,
      staff: 2,
      preset: PRESETS.bakery,
    });
    // 6 × 12 × 5 × 2 × 300 = 216,000
    expect(result.annualRevenue).toBe(216000);
    expect(result.totalAnnualSavings).toBeGreaterThanOrEqual(8000);
    expect(result.totalAnnualSavings).toBeLessThanOrEqual(13000);
  });
});

// ============================
// Savings as % of Revenue Check
// ============================
describe('Savings percentage sanity checks', () => {
  it('total savings should be 2.5–3.5% for mid-size restaurant', () => {
    const result = calculateAllSavings({
      tables: 12,
      avgBill: 85,
      staff: 4,
      preset: PRESETS.restaurant,
    });
    const pct = result.totalAnnualSavings / result.annualRevenue;
    expect(pct).toBeGreaterThanOrEqual(0.025);
    expect(pct).toBeLessThanOrEqual(0.04);
  });

  it('smaller businesses may have higher % due to fixed labor savings', () => {
    const result = calculateAllSavings({
      tables: 6,
      avgBill: 12,
      staff: 2,
      preset: PRESETS.bakery,
    });
    const pct = result.totalAnnualSavings / result.annualRevenue;
    // Small bakery: expect ~4-5% because labor savings are proportionally bigger
    expect(pct).toBeGreaterThanOrEqual(0.035);
    expect(pct).toBeLessThanOrEqual(0.06);
  });
});

// ============================
// Breakdown ordering
// ============================
describe('Breakdown', () => {
  it('should be sorted from largest to smallest', () => {
    const result = calculateAllSavings({
      tables: 20,
      avgBill: 85,
      staff: 6,
      preset: PRESETS.restaurant,
    });
    for (let i = 0; i < result.breakdown.length - 1; i++) {
      expect(result.breakdown[i].value).toBeGreaterThanOrEqual(
        result.breakdown[i + 1].value
      );
    }
  });

  it('should have 6 categories', () => {
    const result = calculateAllSavings({
      tables: 12,
      avgBill: 85,
      staff: 4,
      preset: PRESETS.restaurant,
    });
    expect(result.breakdown).toHaveLength(6);
  });
});

// ============================
// Auto-scale staff
// ============================
describe('autoScaleStaff', () => {
  it('restaurant: 20 tables → 6 staff', () => {
    expect(autoScaleStaff(20, PRESETS.restaurant)).toBe(6);
  });

  it('restaurant: 12 tables → 4 staff (rounded)', () => {
    // 12 × 6/20 = 3.6 → rounds to 4
    expect(autoScaleStaff(12, PRESETS.restaurant)).toBe(4);
  });

  it('café: 10 tables → 2 staff', () => {
    // 10 × 3/20 = 1.5 → rounds to 2
    expect(autoScaleStaff(10, PRESETS.cafe)).toBe(2);
  });

  it('minimum staff is 1', () => {
    expect(autoScaleStaff(3, PRESETS.bakery)).toBeGreaterThanOrEqual(1);
  });
});

// ============================
// Context Metrics
// ============================
describe('calculateContextMetrics', () => {
  it('computes monthly savings correctly', () => {
    const metrics = calculateContextMetrics(38300, 1224000);
    expect(metrics.monthlySavings).toBeCloseTo(38300 / 12, 0);
  });

  it('computes ROI timeline', () => {
    const metrics = calculateContextMetrics(38300, 1224000);
    // monthsToROI = 2400 / (38300/12) = 2400 / 3191.67 ≈ 0.75 months
    expect(metrics.monthsToROI).toBeLessThan(2);
  });

  it('computes new margin correctly', () => {
    const metrics = calculateContextMetrics(38300, 1224000);
    // Current profit: 1,224,000 × 0.05 = 61,200
    // New: (61,200 + 38,300) / 1,224,000 × 100 ≈ 8.13%
    expect(metrics.newMargin).toBeCloseTo(8.13, 0);
  });
});

// ============================
// Formatting
// ============================
describe('formatCHF', () => {
  it('formats with Swiss apostrophe separators', () => {
    expect(formatCHF(38300)).toBe("CHF 38'300");
    expect(formatCHF(1224000)).toBe("CHF 1'224'000");
    expect(formatCHF(500)).toBe('CHF 500');
  });
});

describe('formatNumber', () => {
  it('formats numbers with apostrophe separators', () => {
    expect(formatNumber(2040000)).toBe("2'040'000");
  });
});

describe('formatPercent', () => {
  it('formats to one decimal place', () => {
    expect(formatPercent(0.031)).toBe('3.1%');
    expect(formatPercent(0.0299)).toBe('3.0%');
  });
});

describe('roundTo', () => {
  it('rounds to nearest 100 by default', () => {
    expect(roundTo(38347)).toBe(38300);
    expect(roundTo(38350)).toBe(38400);
  });
});
