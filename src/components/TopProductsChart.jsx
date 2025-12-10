import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip" style={{ backgroundColor: '#242424', padding: '10px', borderRadius: '5px', color: '#fff' }}>
                <p className="label" style={{ margin: 0, fontSize: '0.8rem' }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                    <Package size={16} color="#d4a574" />
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].value} pedidos</p>
                </div>
            </div>
        );
    }
    return null;
};

const TopProductsChart = ({ data }) => {
    return (
        <div className="chart-container">
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        {/* <CartesianGrid strokeDasharray="3 3" vertical={false} /> */}
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: '#666' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#0ea5e9" /> // Sky blue color
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopProductsChart;
