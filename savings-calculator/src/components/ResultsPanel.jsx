import React, { useEffect, useRef, useState } from 'react';
import { formatCHF, formatNumber } from '../utils/formatting.js';
import BreakdownChart from './BreakdownChart.jsx';
import ContextMetrics from './ContextMetrics.jsx';

function useAnimatedNumber(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) return;

    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  // Keep fromRef in sync when animation completes
  useEffect(() => {
    fromRef.current = display;
  });

  return display;
}

export default function ResultsPanel({
  totalAnnualSavings,
  annualRevenue,
  breakdown,
  contextMetrics,
}) {
  const animatedTotal = useAnimatedNumber(totalAnnualSavings);

  return (
    <div className="results-panel">
      <div className="total-savings">
        <span className="total-savings-amount">{formatCHF(animatedTotal)}</span>
        <span className="total-savings-label">estimated annual savings</span>
      </div>

      <p className="revenue-context">
        Based on estimated revenue of CHF {formatNumber(Math.round(annualRevenue))}/year
      </p>

      <BreakdownChart
        breakdown={breakdown}
        totalAnnualSavings={totalAnnualSavings}
      />

      <ContextMetrics metrics={contextMetrics} />

      <p className="credibility-line">
        Estimates based on conservative industry assumptions. Actual results vary by operation.
      </p>
    </div>
  );
}
