import React, { useState, useMemo, useCallback } from 'react';
import { PRESETS } from '../config/presets.js';
import {
  calculateAllSavings,
  calculateContextMetrics,
  autoScaleStaff,
} from '../utils/calculations.js';
import InputPanel from './InputPanel.jsx';
import ResultsPanel from './ResultsPanel.jsx';
import CTASection from './CTASection.jsx';

const DEFAULT_TYPE = 'restaurant';

export default function Calculator() {
  const [businessType, setBusinessType] = useState(DEFAULT_TYPE);
  const [tables, setTables] = useState(15);
  const [avgBill, setAvgBill] = useState(PRESETS[DEFAULT_TYPE].avg_bill);
  const [staff, setStaff] = useState(
    autoScaleStaff(15, PRESETS[DEFAULT_TYPE])
  );
  const [staffOverridden, setStaffOverridden] = useState(false);

  const preset = PRESETS[businessType];

  const handleBusinessTypeChange = useCallback(
    (type) => {
      const newPreset = PRESETS[type];
      setBusinessType(type);
      setAvgBill(newPreset.avg_bill);
      if (!staffOverridden) {
        setStaff(autoScaleStaff(tables, newPreset));
      }
    },
    [tables, staffOverridden]
  );

  const handleTablesChange = useCallback(
    (newTables) => {
      setTables(newTables);
      if (!staffOverridden) {
        setStaff(autoScaleStaff(newTables, preset));
      }
    },
    [preset, staffOverridden]
  );

  const handleAvgBillChange = useCallback((value) => {
    setAvgBill(value);
  }, []);

  const handleStaffChange = useCallback((value) => {
    setStaff(value);
    setStaffOverridden(true);
  }, []);

  const results = useMemo(
    () => calculateAllSavings({ tables, avgBill, staff, preset }),
    [tables, avgBill, staff, preset]
  );

  const contextMetrics = useMemo(
    () =>
      calculateContextMetrics(results.totalAnnualSavings, results.annualRevenue),
    [results.totalAnnualSavings, results.annualRevenue]
  );

  const crmData = useMemo(
    () => ({
      businessType,
      tables,
      avgBill,
      staff,
      annualRevenue: results.annualRevenue,
      totalAnnualSavings: results.totalAnnualSavings,
      breakdown: results.breakdown,
    }),
    [businessType, tables, avgBill, staff, results]
  );

  return (
    <div className="calculator-wrapper">
      <header className="calculator-header">
        <h1 className="calculator-headline">
          How much could your business save with a modern EPOS?
        </h1>
        <p className="calculator-subheadline">
          Move the sliders to see your personalized savings estimate
        </p>
      </header>

      <div className="calculator-body">
        <InputPanel
          businessType={businessType}
          tables={tables}
          avgBill={avgBill}
          staff={staff}
          onBusinessTypeChange={handleBusinessTypeChange}
          onTablesChange={handleTablesChange}
          onAvgBillChange={handleAvgBillChange}
          onStaffChange={handleStaffChange}
        />
        <ResultsPanel
          totalAnnualSavings={results.totalAnnualSavings}
          annualRevenue={results.annualRevenue}
          breakdown={results.breakdown}
          contextMetrics={contextMetrics}
        />
      </div>

      <CTASection calculatorData={crmData} />
    </div>
  );
}
