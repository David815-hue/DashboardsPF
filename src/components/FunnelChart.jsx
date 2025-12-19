import React, { useState } from 'react';

const FunnelChart = ({ data }) => {
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Find absolute max value to normalize bar widths
    // The first item (Clics) is usually the largest in a funnel
    const maxVal = Math.max(...data.map(d => d.value)) || 1;

    const handleMouseMove = (e, item, percentageLabel) => {
        setTooltipPos({
            x: e.clientX,
            y: e.clientY
        });
        setHoveredItem({
            name: item.name,
            value: item.value,
            percentage: percentageLabel
        });
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    return (
        <div className="funnel-container">
            <div className="funnel-bars-centered">
                {data.map((item, index) => {
                    // Calculate relative percentage for width of the bar
                    const widthPercent = Math.max((item.value / maxVal) * 100, 1); // Min 1% visibility
                    const percentageLabel = ((item.value / data[0].value) * 100).toFixed(2) + ' %';

                    return (
                        <div key={index} className="funnel-row-centered">
                            {/* Label: Clics, Conversaciones, etc */}
                            <div className="funnel-label-col">{item.name}</div>

                            {/* Bar Area: Centered */}
                            <div className="funnel-bar-wrapper">
                                <div
                                    className="funnel-bar-centered"
                                    style={{
                                        width: `${widthPercent}%`,
                                        backgroundColor: item.fill || '#06b6d4',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseMove={(e) => handleMouseMove(e, item, percentageLabel)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Optional: Value inside bar if it clears width */}
                                    {/* <span className="bar-value-text">{item.value}</span> */}
                                </div>
                            </div>

                            {/* Percentage Label on right */}
                            <div style={{
                                width: '70px',
                                paddingLeft: '10px',
                                fontSize: '0.8rem',
                                color: '#555',
                                fontWeight: '600'
                            }}>
                                {percentageLabel}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Tooltip */}
            {hoveredItem && (
                <div style={{
                    position: 'fixed',
                    left: tooltipPos.x + 15,
                    top: tooltipPos.y - 15,
                    background: 'rgba(36, 36, 36, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    pointerEvents: 'none',
                    zIndex: 1000
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{hoveredItem.name}</div>
                    <div style={{ marginBottom: '2px' }}>Cantidad: {hoveredItem.value.toLocaleString()}</div>
                    <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Porcentaje: {hoveredItem.percentage}</div>
                </div>
            )}
        </div>
    );
};

export default FunnelChart;
