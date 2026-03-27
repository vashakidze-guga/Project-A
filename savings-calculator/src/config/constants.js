export const CONFIG = {
  // Hidden defaults
  operating_days: 300,
  hourly_wage: 28,
  working_weeks_per_year: 50,

  // Category 1: Order Accuracy
  comp_void_rate: 0.003,
  comp_void_reduction: 0.30,
  error_reduction_factor: 0.20,

  // Category 2: Table Turnover
  variable_overhead_pct: 0.07,
  turnover_occupancy_threshold: 0.80,
  turnover_low_occ_factor: 0.35,

  // Category 3: Upselling
  upsell_margin_rate: 0.65,
  menu_insight_pct: 0.003,
  menu_insight_margin: 0.70,

  // Category 4: Labor
  daily_minutes_saved_per_staff: 10,
  admin_savings_fraction: 0.15,

  // Category 5: Billing
  billing_error_rate: 0.002,
  billing_reduction: 0.50,

  // Context metrics
  assumed_epos_annual_cost: 2400,
  assumed_base_profit_margin: 0.05,

  // Revenue caps (for very large operations)
  large_revenue_threshold: 5000000,
  capped_upsell_pct: 0.008,
  capped_table_turn_pct: 0.006,

  // Hard ceiling: max savings as % of revenue above this threshold
  savings_ceiling_threshold: 10000000,
  savings_ceiling_pct: 0.02,

  // Display
  rounding: 100,
};
