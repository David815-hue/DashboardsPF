import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import KPICard from './KPICard';

const COLORS = ['#FE0000', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#242424', padding: '10px', borderRadius: '5px', color: '#fff' }}>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{label || payload[0]?.name}</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                    {payload[0]?.value?.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

const EcommerceDashboard = ({ metrics }) => {
    if (!metrics) {
        return (
            <div className="empty-state">
                <p>⚠️ No hay datos de E-commerce cargados</p>
            </div>
        );
    }

    const { kpis, charts } = metrics;

    return (
        <div className="dashboard-content">
            <div className="ecommerce-grid-layout">
                {/* Quadrant 1 (Top-Left): KPIs */}
                <div className="ecommerce-quadrant">
                    <div className="ecommerce-kpi-grid-quadrant">
                        <KPICard title="Venta Total" value={kpis.ventaTotal} format="currency" suffix=" mil" />
                        <KPICard title="Cantidad de Pedidos" value={kpis.cantidadPedidos} format="number" />
                        <KPICard title="Venta APP" value={kpis.ventaAPP} format="currency" suffix=" mil" />
                        <KPICard title="Ticket Promedio" value={kpis.ticketPromedio} format="currency" />
                        <KPICard title="Venta Ecommerce" value={kpis.ventaEcommerce} format="currency" suffix=" mil" />
                        <KPICard title="Pedidos Cancelados" value={kpis.pedidosCancelados} format="number" />
                    </div>
                </div>

                {/* Quadrant 2 (Top-Right): Top Productos */}
                <div className="ecommerce-quadrant">
                    <div className="chart-wrapper">
                        <h3 className="chart-title">Top Productos</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.topProductos} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="ecommerceBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FE0000" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#990000" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 9, fill: '#666' }}
                                        angle={0}
                                        textAnchor="middle"
                                        interval={0}
                                        height={60}
                                        tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#ecommerceBarGradient)">
                                        {charts.topProductos.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#ecommerceBarGradient)" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quadrant 3 (Bottom-Left): Motivo de Cancelación */}
                <div className="ecommerce-quadrant">
                    <div className="chart-wrapper">
                        <h3 className="chart-title">Motivo de Cancelación</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.motivosCancelacion} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                                    <defs>
                                        <linearGradient id="ecommerceBarGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FE0000" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#990000" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 9, fill: '#666' }}
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="url(#ecommerceBarGradient)">
                                        {charts.motivosCancelacion.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="url(#ecommerceBarGradient)" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quadrant 4 (Bottom-Right): Venta por Ciudad */}
                <div className="ecommerce-quadrant">
                    <div className="chart-wrapper">
                        <h3 className="chart-title">Venta por Ciudad</h3>
                        <div className="chart-container pie-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.ventaPorCiudad}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                                        labelLine={false}
                                    >
                                        {charts.ventaPorCiudad.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        iconType="circle"
                                        formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#333' }}>{value}</span>}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EcommerceDashboard;
