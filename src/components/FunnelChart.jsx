import React from 'react';

const FunnelChart = ({ data }) => {
    // Find absolute max value to normalize bar widths
    // The first item (Clics) is usually the largest in a funnel
    const maxVal = Math.max(...data.map(d => d.value)) || 1;

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
                                        // Dynamic opacity for cleaner look? Or solid colors from data.
                                    }}
                                    title={`${item.name}: ${item.value}`}
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
        </div>
    );
};

export default FunnelChart;
