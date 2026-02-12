import React from 'react';
import { formatCHF } from '../utils/formatting.js';

const CATEGORY_COLORS = {
  upselling: '#FFE235',
  tableTurnover: '#111825',
  laborEfficiency: '#5D737E',
  foodWaste: '#E6C800',
  orderAccuracy: '#8A9DA6',
  billingEfficiency: '#C4B000',
};

export default function BreakdownChart({ breakdown, totalAnnualSavings }) {
  const visibleItems = breakdown.filter((item) => item.value > 0);

  if (visibleItems.length === 0) return null;

  const maxValue = visibleItems[0]?.value || 1;

  return (
    <div className="breakdown-chart">
      <h3 className="breakdown-title">Savings Breakdown</h3>
      <div className="breakdown-bars">
        {visibleItems.map((item) => {
          const pct = (item.value / totalAnnualSavings) * 100;
          const barWidth = (item.value / maxValue) * 100;
          return (
            <div key={item.key} className="breakdown-row">
              <div className="breakdown-label">
                <span className="breakdown-emoji">{item.emoji}</span>
                <span className="breakdown-name">{item.label}</span>
              </div>
              <div className="breakdown-bar-container">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: CATEGORY_COLORS[item.key],
                  }}
                />
              </div>
              <div className="breakdown-amount">
                <span className="breakdown-chf">{formatCHF(Math.round(item.value))}</span>
                <span className="breakdown-pct">{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
