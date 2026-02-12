import React from 'react';
import { PRESETS, BUSINESS_TYPES } from '../config/presets.js';
import { formatNumber } from '../utils/formatting.js';

const ICONS = {
  restaurant: '\u{1F37D}\uFE0F',
  cafe: '\u2615',
  bar: '\u{1F377}',
  fast_casual: '\u{1F6CD}\uFE0F',
  hotel_restaurant: '\u{1F3E8}',
  bakery: '\u{1F35E}',
};

function Slider({ label, value, min, max, step, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-group">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">
          {unit === 'CHF' ? `CHF ${formatNumber(value)}` : value}
        </span>
      </div>
      <input
        type="range"
        className="styled-slider"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-track) ${pct}%, var(--color-track) 100%)`,
        }}
      />
      <div className="slider-range">
        <span>{unit === 'CHF' ? `CHF ${min}` : min}</span>
        <span>{unit === 'CHF' ? `CHF ${max}` : max}</span>
      </div>
    </div>
  );
}

export default function InputPanel({
  businessType,
  tables,
  avgBill,
  staff,
  onBusinessTypeChange,
  onTablesChange,
  onAvgBillChange,
  onStaffChange,
}) {
  return (
    <div className="input-panel">
      <div className="business-type-section">
        <label className="section-label">Business Type</label>
        <div className="business-type-grid">
          {BUSINESS_TYPES.map((key) => (
            <button
              key={key}
              className={`business-type-card ${businessType === key ? 'active' : ''}`}
              onClick={() => onBusinessTypeChange(key)}
            >
              <span className="business-type-icon">{ICONS[key]}</span>
              <span className="business-type-label">{PRESETS[key].label}</span>
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={businessType === 'fast_casual' ? 'Number of Tables / Points of Service' : 'Number of Tables'}
        value={tables}
        min={1}
        max={80}
        onChange={onTablesChange}
      />

      <Slider
        label="Average Bill per Table"
        value={avgBill}
        min={10}
        max={500}
        step={5}
        unit="CHF"
        onChange={onAvgBillChange}
      />

      <Slider
        label="Number of Staff"
        value={staff}
        min={1}
        max={30}
        onChange={onStaffChange}
      />
    </div>
  );
}
