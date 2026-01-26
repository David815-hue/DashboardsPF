import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package } from 'lucide-react';

import CustomTooltip from './CustomTooltip';
import ChartZoomWrapper from './ChartZoomWrapper';

const TopProductsChart = ({ data }) => {
    return (
        <ChartZoomWrapper title="Top Productos">
            <div className="chart-container" style={{ animation: 'fadeInScale 0.6s ease-out backwards', animationDelay: '0.3s' }}>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.map(d => ({ ...d, value: d.count || d.value || 0 }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: '#666' }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Bar
                                dataKey="value"
                                name="Pedidos"
                                radius={[8, 8, 0, 0]}
                                fill="url(#barGradient)"
                                animationDuration={1000}
                                animationEasing="ease-out"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartZoomWrapper>
    );
};

export default TopProductsChart;

