import React from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, format = 'number', suffix = '', trend = null }) => {
    const numericValue = parseFloat(value) || 0;

    // Count-up animation
    const animatedValue = useCountUp(numericValue, 1200);

    // Format the animated value
    let displayValue;
    if (format === 'currency') {
        if (Math.abs(animatedValue) >= 1000000) {
            displayValue = (animatedValue / 1000000).toFixed(2);
        } else if (Math.abs(animatedValue) >= 1000 && suffix.trim() === 'mil') {
            displayValue = (animatedValue / 1000).toFixed(2);
        } else {
            displayValue = animatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    } else if (format === 'percent') {
        displayValue = animatedValue.toFixed(2);
    } else if (format === 'decimal') {
        displayValue = animatedValue.toFixed(2);
    } else {
        displayValue = Math.round(animatedValue).toLocaleString();
    }

    return (
        <div className="kpi-card">
            <div className="kpi-title">{title}</div>
            <div className="kpi-value-row">
                <div className="kpi-value">
                    {displayValue} {suffix}
                </div>
                {trend !== null && (
                    <div className={`kpi-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                        {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(trend).toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KPICard;

