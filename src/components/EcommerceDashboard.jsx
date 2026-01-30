import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label } from 'recharts';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import KPICard from './KPICard';
import TiltedCard from './TiltedCard';
import ChartZoomWrapper from './ChartZoomWrapper';

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
                            <ChartZoomWrapper title="Top Productos">
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
                            </ChartZoomWrapper>
                        </div>
                    </div>

                    {/* Quadrant 3 (Bottom-Left): Motivo de Cancelación */}
                    <div className="ecommerce-quadrant" style={{ overflow: 'visible' }}>
                        <div className="chart-wrapper" style={{ maxHeight: '100%', overflow: 'visible' }}>
                            <h3 className="chart-title">Motivo de Cancelación</h3>
                            <ChartZoomWrapper title="Motivo de Cancelación">
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
                            </ChartZoomWrapper>
                        </div>
                    </div>

                    {/* Quadrant 4 (Bottom-Right): Venta por Ciudad */}
                    <div className="ecommerce-quadrant">
                        <div className="chart-wrapper">
                            <h3 className="chart-title">Venta por Ciudad</h3>
                            <ChartZoomWrapper title="Venta por Ciudad">
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
                                                outerRadius="90%"
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
                            </ChartZoomWrapper>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="ecommerce-page-2-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', paddingBottom: '10px' }}>
                    {/* Top Section: New vs Recurring Customers */}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ChartZoomWrapper title="Clientes nuevos vs. clientes recurrentes">
                            <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', height: '100%', padding: '0 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                                {(() => {
                                    const totalClientes = (nuevosGlobalData || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
                                    const getColor = (index) => index === 0 ? "#ff0040" : "#ffe4e6";

                                    return (
                                        <>
                                            <div style={{ width: '40%', height: '100%', minHeight: '250px', position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={nuevosGlobalData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius="65%"
                                                            outerRadius="85%"
                                                            paddingAngle={0}
                                                            dataKey="value"
                                                            startAngle={90}
                                                            endAngle={-270}
                                                            stroke="none"
                                                        >
                                                            {nuevosGlobalData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={getColor(index)} />
                                                            ))}
                                                            <Label
                                                                value={totalClientes.toLocaleString()}
                                                                position="center"
                                                                dy={-10}
                                                                style={{ fontSize: '2rem', fontWeight: 'bold', fill: '#1e293b' }}
                                                            />
                                                            <Label
                                                                value="Total de clientes"
                                                                position="center"
                                                                dy={20}
                                                                style={{ fontSize: '0.8rem', fill: '#64748b' }}
                                                            />
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {nuevosGlobalData.map((item, index) => (
                                                    <div key={index} style={{
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        padding: '20px',
                                                        minWidth: '220px',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px',
                                                        border: '1px solid rgba(255,255,255,0.8)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: getColor(index) }}></div>
                                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                                                                {item.name || (index === 0 ? 'Pedidos de nuevos clientes' : 'Ordenes de clientes recurrentes')}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>
                                                            {item.value.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </ChartZoomWrapper>
                    </div>

                    {/* Bottom Section: Payment Error Recovery */}
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ChartZoomWrapper title="Pedidos cancelados por Error de Pago - Recuperación">
                            <div className="chart-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', height: '100%', padding: '0 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                                {(() => {
                                    const dataPkg = charts.errorPagoRecovery || {};
                                    // Handle both new object format and old array format for backward compatibility
                                    const errorPagoData = Array.isArray(dataPkg) ? dataPkg : (dataPkg.chartData || []);
                                    const insights = !Array.isArray(dataPkg) ? dataPkg.insights : null;

                                    const totalPedidos = errorPagoData.reduce((acc, curr) => acc + (curr.value || 0), 0);
                                    const getColor = (index) => index === 0 ? "#22c55e" : "#ef4444";

                                    return (
                                        <>
                                            {/* LEFT: Customer Insights */}
                                            {insights && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '30px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '150px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                    justifyContent: 'center',
                                                    zIndex: 10,
                                                    pointerEvents: 'none'
                                                }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0px' }}>
                                                        ANÁLISIS
                                                    </div>

                                                    {/* Unique Customers */}
                                                    <div>
                                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>
                                                            {insights.totalClientesUnicos} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>clientes</span>
                                                        </div>
                                                    </div>

                                                    {/* Multiple Attempts */}
                                                    <div>
                                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>
                                                            {insights.clientesMultiplesIntentos} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>reintentaron</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* RIGHT: Chart & Metrics */}
                                            <div style={{ width: '40%', height: '100%', minHeight: '250px', position: 'relative' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={errorPagoData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius="65%"
                                                            outerRadius="85%"
                                                            paddingAngle={0}
                                                            dataKey="value"
                                                            startAngle={90}
                                                            endAngle={-270}
                                                            stroke="none"
                                                        >
                                                            {errorPagoData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={getColor(index)} />
                                                            ))}
                                                            <Label
                                                                value={totalPedidos.toLocaleString()}
                                                                position="center"
                                                                dy={-10}
                                                                style={{ fontSize: '2rem', fontWeight: 'bold', fill: '#1e293b' }}
                                                            />
                                                            <Label
                                                                value="Total pedidos"
                                                                position="center"
                                                                dy={20}
                                                                style={{ fontSize: '0.8rem', fill: '#64748b' }}
                                                            />
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
                                                {errorPagoData.map((item, index) => (
                                                    <div key={index} style={{
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        padding: '15px 20px',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px',
                                                        border: '1px solid rgba(255,255,255,0.8)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: getColor(index) }}></div>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                                                                {item.name.includes('completó') ? (item.name.includes('no') ? 'No Recuperados' : 'Recuperados') : item.name}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
                                                            {item.value.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </ChartZoomWrapper>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EcommerceDashboard;
