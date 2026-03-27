import React from 'react';

export default function CTASection({ calculatorData }) {
  const handleBookDemo = () => {
    const payload = {
      business_type: calculatorData.businessType,
      tables: calculatorData.tables,
      avg_bill: calculatorData.avgBill,
      staff: calculatorData.staff,
      calculated_revenue: calculatorData.annualRevenue,
      total_savings: calculatorData.totalAnnualSavings,
      breakdown: calculatorData.breakdown,
      timestamp: new Date().toISOString(),
    };
    console.log('CRM payload:', payload);
    // Integration point: send to CRM / booking system
  };

  const handleEmailReport = () => {
    const payload = {
      business_type: calculatorData.businessType,
      tables: calculatorData.tables,
      avg_bill: calculatorData.avgBill,
      staff: calculatorData.staff,
      calculated_revenue: calculatorData.annualRevenue,
      total_savings: calculatorData.totalAnnualSavings,
      breakdown: calculatorData.breakdown,
      timestamp: new Date().toISOString(),
    };
    console.log('Email report payload:', payload);
    // Integration point: trigger email report
  };

  return (
    <div className="cta-section">
      <button className="cta-primary" onClick={handleBookDemo}>
        Book a Free Demo
      </button>
      <button className="cta-secondary" onClick={handleEmailReport}>
        Email me this report
      </button>
    </div>
  );
}
