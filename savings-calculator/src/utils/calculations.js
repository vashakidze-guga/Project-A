import { CONFIG } from '../config/constants.js';

/**
 * Calculate annual revenue from inputs and preset parameters.
 * Includes occupancy rate to account for empty tables during
 * off-peak hours, time between seatings, and slow periods.
 */
export function calculateRevenue(tables, avgBill, tableTurns, servicesPerDay, occupancyRate) {
  return tables * avgBill * tableTurns * servicesPerDay * CONFIG.operating_days * occupancyRate;
}

/**
 * Derive effective preset rates, applying revenue caps for large operations.
 */
function getEffectiveRates(annualRevenue, preset) {
  const isLarge = annualRevenue > CONFIG.large_revenue_threshold;
  return {
    upsell_pct: isLarge
      ? Math.min(preset.upsell_pct, CONFIG.capped_upsell_pct)
      : preset.upsell_pct,
    table_turn_improvement: isLarge
      ? Math.min(preset.table_turn_improvement, CONFIG.capped_table_turn_pct)
      : preset.table_turn_improvement,
  };
}

/**
 * Category 1: Order Accuracy & Error Reduction
 */
export function calcOrderAccuracy(annualRevenue, preset) {
  const orderErrorSavings =
    annualRevenue * preset.order_error_rate * CONFIG.error_reduction_factor;
  const compVoidSavings =
    annualRevenue * CONFIG.comp_void_rate * CONFIG.comp_void_reduction;
  return orderErrorSavings + compVoidSavings;
}

/**
 * Category 2: Faster Table Turnover
 */
export function calcTableTurnover(annualRevenue, preset) {
  const rates = getEffectiveRates(annualRevenue, preset);
  const extraRevenue = annualRevenue * rates.table_turn_improvement;
  return extraRevenue * (1 - preset.food_cost_pct);
}

/**
 * Category 3: Upselling & Average Check Increase
 */
export function calcUpselling(annualRevenue, preset) {
  const rates = getEffectiveRates(annualRevenue, preset);
  const upsellMargin =
    annualRevenue * rates.upsell_pct * CONFIG.upsell_margin_rate;
  const menuEngineering =
    annualRevenue * CONFIG.menu_insight_pct * CONFIG.menu_insight_margin;
  return upsellMargin + menuEngineering;
}

/**
 * Category 4: Inventory & Food Waste Reduction
 * Returns 0 if food_cost_pct is 0.
 */
export function calcFoodWaste(annualRevenue, preset) {
  if (preset.food_cost_pct === 0) return 0;

  const totalFoodCosts = annualRevenue * preset.food_cost_pct;
  const spoilageSavings =
    totalFoodCosts * CONFIG.spoilage_rate * CONFIG.spoilage_reduction;
  const purchasingSavings =
    totalFoodCosts * CONFIG.purchasing_loss_rate * CONFIG.purchasing_reduction;
  const portionSavings =
    totalFoodCosts * CONFIG.portion_loss_rate * CONFIG.portion_reduction;
  return spoilageSavings + purchasingSavings + portionSavings;
}

/**
 * Category 5: Labor Efficiency & Time Savings
 */
export function calcLaborEfficiency(staff, preset) {
  const fohTimeSavings =
    staff *
    CONFIG.daily_minutes_saved_per_staff *
    (CONFIG.hourly_wage / 60) *
    CONFIG.operating_days;
  const adminTimeSavings =
    CONFIG.admin_hours_saved_per_week *
    CONFIG.hourly_wage *
    CONFIG.working_weeks_per_year;
  return fohTimeSavings + adminTimeSavings;
}

/**
 * Category 6: Payment Processing & Billing Efficiency
 */
export function calcBillingEfficiency(annualRevenue) {
  const billingAccuracy =
    annualRevenue * CONFIG.billing_error_rate * CONFIG.billing_reduction;
  const fasterCheckout = annualRevenue * CONFIG.checkout_time_saving_pct;
  return billingAccuracy + fasterCheckout;
}

/**
 * Calculate all savings categories and the grand total.
 *
 * @param {Object} params
 * @param {number} params.tables
 * @param {number} params.avgBill
 * @param {number} params.staff
 * @param {Object} params.preset - Business type preset from PRESETS
 * @returns {Object} Breakdown and total savings
 */
export function calculateAllSavings({ tables, avgBill, staff, preset }) {
  const annualRevenue = calculateRevenue(
    tables,
    avgBill,
    preset.table_turns,
    preset.services_per_day,
    preset.occupancy_rate
  );

  const orderAccuracy = calcOrderAccuracy(annualRevenue, preset);
  const tableTurnover = calcTableTurnover(annualRevenue, preset);
  const upselling = calcUpselling(annualRevenue, preset);
  const foodWaste = calcFoodWaste(annualRevenue, preset);
  const laborEfficiency = calcLaborEfficiency(staff, preset);
  const billingEfficiency = calcBillingEfficiency(annualRevenue);

  const rawTotal =
    orderAccuracy +
    tableTurnover +
    upselling +
    foodWaste +
    laborEfficiency +
    billingEfficiency;

  const totalAnnualSavings =
    Math.round(rawTotal / CONFIG.rounding) * CONFIG.rounding;

  return {
    annualRevenue,
    breakdown: [
      { key: 'upselling', label: 'Upselling & Check Growth', emoji: '\u{1F4C8}', value: upselling },
      { key: 'tableTurnover', label: 'Faster Table Turns', emoji: '\u{1F37D}\uFE0F', value: tableTurnover },
      { key: 'laborEfficiency', label: 'Labor & Time Savings', emoji: '\u{1F477}', value: laborEfficiency },
      { key: 'foodWaste', label: 'Food Waste Reduction', emoji: '\u{1F957}', value: foodWaste },
      { key: 'orderAccuracy', label: 'Order Accuracy', emoji: '\u2705', value: orderAccuracy },
      { key: 'billingEfficiency', label: 'Billing Efficiency', emoji: '\u{1F4B3}', value: billingEfficiency },
    ].sort((a, b) => b.value - a.value),
    totalAnnualSavings,
  };
}

/**
 * Calculate auto-scaled staff count from tables and preset.
 */
export function autoScaleStaff(tables, preset) {
  const ratio = preset.staff_per_20_tables / 20;
  return Math.max(1, Math.round(tables * ratio));
}

/**
 * Generate context metrics for the results panel.
 */
export function calculateContextMetrics(totalAnnualSavings, annualRevenue) {
  const monthlySavings = totalAnnualSavings / 12;
  const dailySavings = totalAnnualSavings / CONFIG.operating_days;
  const monthsToROI =
    CONFIG.assumed_epos_annual_cost / (totalAnnualSavings / 12);
  const weeksToROI = monthsToROI * 4.33;
  const currentProfit = annualRevenue * CONFIG.assumed_base_profit_margin;
  const newMargin =
    ((currentProfit + totalAnnualSavings) / annualRevenue) * 100;

  return {
    monthlySavings,
    dailySavings,
    monthsToROI,
    weeksToROI,
    newMargin,
  };
}
