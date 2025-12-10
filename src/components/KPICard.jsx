import React from 'react';

const KPICard = ({ title, value, format = 'number', suffix = '' }) => {
    let displayValue;

    // Formatting logic simplified for clarity
    if (format === 'currency') {
        const val = parseFloat(value) || 0;
        // Check for millions/thousands logic if needed
        if (Math.abs(val) >= 1000000) {
            displayValue = (val / 1000000).toFixed(2); // suffix 'mil' usually passed from parent or handled here
        } else if (Math.abs(val) >= 1000) {
            // If 'mil' suffix is expected for thousands:
            if (suffix.trim() === 'mil') {
                displayValue = (val / 1000).toFixed(2);
            } else {
                displayValue = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        } else {
            displayValue = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    } else if (format === 'percent') {
        displayValue = (parseFloat(value) || 0).toFixed(2);
    } else {
        displayValue = value;
    }

    return (
        <div className="kpi-card">
            <div className="kpi-title">{title}</div>
            <div className="kpi-value">
                {displayValue} {suffix}
            </div>
        </div>
    );
};

export default KPICard;
