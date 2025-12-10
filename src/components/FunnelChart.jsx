import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const FunnelChart = ({ data }) => {
    // Calculate percentages relative to the first item (Clicks)
    const maxVal = data[0]?.value || 1;
    const processedData = data.map(d => ({
        ...d,
        percentage: ((d.value / maxVal) * 100).toFixed(2) + ' %'
    }));

    return (
        <div className="chart-container">
            {/* <h3>Conversion Funnel</h3> */}
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={processedData}
                        margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                        barCategoryGap={5}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 12, fill: '#666' }}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#242424', borderRadius: '5px', border: 'none', color: '#fff' }}
                        />
                        <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={30}>
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="percentage" position="right" fill="#fff" fontSize={12} offset={10} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FunnelChart;
