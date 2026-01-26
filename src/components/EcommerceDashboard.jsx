import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import KPICard from './KPICard';
import TiltedCard from './TiltedCard';

const COLORS = ['#FE0000', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

import CustomTooltip from './CustomTooltip';

const EcommerceDashboard = ({ metrics, trends, topProductsCount = 6 }) => {
    const [topProductsMode, setTopProductsMode] = useState('pedidos'); // 'pedidos' or 'venta'
    const [currentPage, setCurrentPage] = useState(1);

    if (!metrics) {
        return (
            <div className="empty-state">
                <p>⚠️ No hay datos de E-commerce cargados</p>
            </div>
        );
    }

    const { kpis, charts } = metrics;
    const allProductos = charts.topProductos || [];

    // Prepare data based on selected mode - sort FIRST, then slice
    // Keep 'cantidad' (units) available for tooltip in both modes
    const topProductosData = topProductsMode === 'pedidos'
        ? [...allProductos].sort((a, b) => b.value - a.value).slice(0, topProductsCount)
        : [...allProductos]
            .sort((a, b) => (b.totalVenta || 0) - (a.totalVenta || 0))
            .slice(0, topProductsCount)
            .map(p => ({ ...p, cantidad: p.value, value: p.totalVenta || 0 }));

    // Prepare Pie Data for New/Recurring
    const calculatePercent = (data) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return data.map(item => ({
            ...item,
            percent: total > 0 ? (item.value / total) * 100 : 0
        }));
    };

    const nuevosGlobalData = calculatePercent(charts.clientesNuevos || []);
    const nuevosCiudadData = charts.clientesNuevosCiudad || []; // Let Recharts calculate percent

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, percentVal }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        // Calculate percent if passed directly or from data
        const p = percentVal !== undefined ? percentVal : (percent * 100);

        if (p < 5) return null; // Don't show label for small slices

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold">
                {`${p.toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="dashboard-content ecommerce-dashboard">
            {/* Navigation Buttons */}
            {currentPage === 1 && (
                <button className="wa-nav-btn next" onClick={() => setCurrentPage(2)} title="Ver Análisis Clientes">
                    <ChevronRight size={24} />
                </button>
            )}
            {currentPage === 2 && (
                <button className="wa-nav-btn prev" onClick={() => setCurrentPage(1)} title="Volver a Resumen">
                    <ChevronLeft size={24} />
                </button>
            )}

            {currentPage === 1 ? (
                <div className="ecommerce-grid-layout">
                    {/* Quadrant 1 (Top-Left): KPIs */}
                    <div className="ecommerce-quadrant">
                        <div className="ecommerce-kpi-grid-quadrant">
                            <TiltedCard><KPICard title="Venta Total" value={kpis.ventaTotal} format="currency" suffix="" trend={trends?.ventaTotal} /></TiltedCard>
                            <TiltedCard><KPICard title="Cantidad de Pedidos" value={kpis.cantidadPedidos} format="number" trend={trends?.cantidadPedidos} /></TiltedCard>
                            <TiltedCard><KPICard title="Venta APP" value={kpis.ventaAPP} format="currency" suffix="" trend={trends?.ventaAPP} /></TiltedCard>
                            <TiltedCard><KPICard title="Ticket Promedio" value={kpis.ticketPromedio} format="currency" trend={trends?.ticketPromedio} /></TiltedCard>
                            <TiltedCard><KPICard title="Venta Ecommerce" value={kpis.ventaEcommerce} format="currency" suffix="" trend={trends?.ventaEcommerce} /></TiltedCard>
                            <TiltedCard><KPICard title="Pedidos Cancelados" value={kpis.pedidosCancelados} format="number" trend={trends?.pedidosCancelados} /></TiltedCard>
                        </div>
                    </div>

                    {/* Quadrant 2 (Top-Right): Top Productos */}
                    <div className="ecommerce-quadrant">
                        <div className="chart-wrapper">
                            <div className="chart-header-with-toggle">
                                <h3 className="chart-title">Top Productos</h3>
                                <div className="chart-toggle">
                                    <button
                                        className={`toggle-btn ${topProductsMode === 'pedidos' ? 'active' : ''}`}
                                        onClick={() => setTopProductsMode('pedidos')}
                                    >
                                        Pedidos
                                    </button>
                                    <button
                                        className={`toggle-btn ${topProductsMode === 'venta' ? 'active' : ''}`}
                                        onClick={() => setTopProductsMode('venta')}
                                    >
                                        Venta
                                    </button>
                                </div>
                            </div>
                            <div className="chart-container" style={{ padding: '20px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProductosData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                        <defs>
                                            <linearGradient id="ecommerceBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#FE0000" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#990000" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 9, fill: '#666' }}
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                            height={80}
                                            tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            tickFormatter={topProductsMode === 'venta' ? (val) => `L ${val.toLocaleString()}` : undefined}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name={topProductsMode === 'pedidos' ? 'Cantidad' : 'Venta'} radius={[8, 8, 0, 0]} fill="url(#ecommerceBarGradient)">
                                            {topProductosData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="url(#ecommerceBarGradient)" />
                                            ))}
                                        </Bar>
                                        {/* Hidden bar to include units in tooltip when in Venta mode */}
                                        {topProductsMode === 'venta' && (
                                            <Bar dataKey="cantidad" name="Unidades" hide={true} />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Quadrant 3 (Bottom-Left): Motivo de Cancelación */}
                    <div className="ecommerce-quadrant" style={{ overflow: 'visible' }}>
                        <div className="chart-wrapper" style={{ maxHeight: '100%', overflow: 'visible' }}>
                            <h3 className="chart-title">Motivo de Cancelación</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.motivosCancelacion} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="ecommerceBarGradient2" x1="0" y1="0" x2="0" y2="1">
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
                                            tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                                        />
                                        <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Cantidad" radius={[8, 8, 0, 0]} fill="url(#ecommerceBarGradient2)">
                                            {charts.motivosCancelacion.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="url(#ecommerceBarGradient2)" />
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
                                        <defs>
                                            {/* Gradients for Pie Chart Slices */}
                                            <linearGradient id="grad-0" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ff4d4d" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#990000" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-1" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#16a34a" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-3" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-4" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-5" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f472b6" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#db2777" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={charts.ventaPorCiudad}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={65}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {charts.ventaPorCiudad.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`url(#grad-${index % 6})`} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                            iconType="circle"
                                            formatter={(value) => <span style={{ fontSize: '0.7rem', color: '#333' }}>{value}</span>}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="ecommerce-grid-layout">
                    {/* Page 2: Client Analysis */}

                    {/* Quadrant 1 (Top-Left): Distribución Clientes Nuevos */}
                    <div className="ecommerce-quadrant">
                        <div className="chart-wrapper">
                            <h3 className="chart-title">Distribución Clientes Nuevos</h3>
                            <div className="chart-container pie-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            {/* Gradients matching Page 1 */}
                                            <linearGradient id="grad-p2-0" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ff4d4d" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#990000" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="grad-p2-1" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={nuevosCiudadData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={65}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {nuevosCiudadData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    // Map index 0 to Red, index 1 to Blue explicitly or by order
                                                    fill={index === 0 ? 'url(#grad-p2-0)' : 'url(#grad-p2-1)'}
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                            iconType="circle"
                                            formatter={(value) => <span style={{ fontSize: '0.7rem', color: '#333' }}>{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Quadrant 2 (Top-Right): Empty */}
                    <div className="ecommerce-quadrant">
                    </div>

                    {/* Quadrant 3 (Bottom-Left): Empty */}
                    <div className="ecommerce-quadrant">
                    </div>

                    {/* Quadrant 4 (Bottom-Right): Empty */}
                    <div className="ecommerce-quadrant">
                    </div>
                </div>
            )}
        </div>
    );
};

export default EcommerceDashboard;
