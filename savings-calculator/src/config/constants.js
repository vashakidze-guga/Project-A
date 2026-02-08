export const CONFIG = {
  // Hidden defaults
  operating_days: 300,
  hourly_wage: 28,
  working_weeks_per_year: 50,

  // Category 1: Order Accuracy
  comp_void_rate: 0.003,
  comp_void_reduction: 0.30,
  error_reduction_factor: 0.20,

  // Category 3: Upselling
  upsell_margin_rate: 0.65,
  menu_insight_pct: 0.003,
  menu_insight_margin: 0.70,

  // Category 4: Waste
  spoilage_rate: 0.04,
  spoilage_reduction: 0.15,
  purchasing_loss_rate: 0.02,
  purchasing_reduction: 0.15,
  portion_loss_rate: 0.01,
  portion_reduction: 0.10,

  // Category 5: Labor
  daily_minutes_saved_per_staff: 10,
  admin_hours_saved_per_week: 2,

  // Category 6: Billing
  billing_error_rate: 0.002,
  billing_reduction: 0.50,
  checkout_time_saving_pct: 0.001,

  // Context metrics
  assumed_epos_annual_cost: 2400,
  assumed_base_profit_margin: 0.05,

  // Revenue caps (for very large operations)
  large_revenue_threshold: 5000000,
  capped_upsell_pct: 0.008,
  capped_table_turn_pct: 0.006,

  // Display
  rounding: 100,
};
