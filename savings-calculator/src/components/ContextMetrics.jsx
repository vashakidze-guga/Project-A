import React from 'react';
import { formatCHF } from '../utils/formatting.js';

export default function ContextMetrics({ metrics }) {
  const { monthlySavings, weeksToROI, newMargin } = metrics;

  const roiText =
    weeksToROI < 8.66
      ? `Pays for itself in ${Math.max(1, Math.round(weeksToROI))} weeks`
      : `Pays for itself in ${Math.round(weeksToROI / 4.33)} months`;

  return (
    <div className="context-metrics">
      <div className="metric-card">
        <span className="metric-value">{formatCHF(Math.round(monthlySavings))}</span>
        <span className="metric-label">saved every month</span>
      </div>
      <div className="metric-card">
        <span className="metric-value">{roiText}</span>
        <span className="metric-label">fast return on investment</span>
      </div>
      <div className="metric-card">
        <span className="metric-value">{newMargin.toFixed(1)}%</span>
        <span className="metric-label">potential profit margin (from 5%)</span>
      </div>
    </div>
  );
}
