import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip" style={{
                backgroundColor: 'rgba(36, 36, 36, 0.95)',
                padding: '12px 16px',
                borderRadius: '12px',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
                <p className="label" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <Package size={16} color="#22d3ee" />
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{payload[0].value} pedidos</p>
                </div>
            </div>
        );
    }
    return null;
};

const TopProductsChart = ({ data }) => {
    return (
        <div className="chart-container" style={{ animation: 'fadeInScale 0.6s ease-out backwards', animationDelay: '0.3s' }}>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                            dataKey="count"
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
    );
};

export default TopProductsChart;

