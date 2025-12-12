import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Target, ShoppingCart, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';

// Custom tooltip with glassmorphism
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(36, 36, 36, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>
                    {label || payload[0]?.payload?.fullName || payload[0]?.name}
                </p>
                {payload.map((entry, idx) => (
                    <p key={idx} style={{ margin: 0, fontWeight: 'bold', color: entry.color || '#fff' }}>
                        {entry.name}: {typeof entry.value === 'number'
                            ? entry.value.toLocaleString('es-HN', { minimumFractionDigits: entry.dataKey === 'value' ? 0 : 2 })
                            : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// KPI Card Component with premium styling
const KPICard = ({ title, value, format, icon: Icon, subtitle }) => {
    const formatValue = (val) => {
        if (format === 'currency') {
            return `L ${(val / 1000).toLocaleString('es-HN', { minimumFractionDigits: 2 })} mil`;
        }
        if (format === 'percent') {
            return `${val.toFixed(1)}%`;
        }
        if (format === 'number') {
            return val.toLocaleString('es-HN');
        }
        return val;
    };

    return (
        <div className="agregadores-kpi-card">
            <div className="kpi-header">
                {Icon && <Icon size={20} className="kpi-icon" />}
                <span className="kpi-title">{title}</span>
            </div>
            <div className="kpi-value">{formatValue(value)}</div>
            {subtitle && (
                <div className="kpi-footer">
                    <span className="kpi-subtitle">{subtitle}</span>
                </div>
            )}
        </div>
    );
};

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    const getColor = () => {
        if (percentage >= 100) return '#22c55e';
        if (percentage >= 80) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={getColor()} stopOpacity="1" />
                        <stop offset="100%" stopColor={getColor()} stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                <circle
                    stroke="rgba(255,255,255,0.1)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke="url(#progressGradient)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div className="progress-text">
                <span className="progress-value">{percentage.toFixed(1)}%</span>
                <span className="progress-label">Cumplimiento</span>
            </div>
        </div>
    );
};

const AgregadoresDashboard = ({ metrics, config = {} }) => {
    const [currentPage, setCurrentPage] = useState(1);

    if (!metrics) {
        return (
            <div className="empty-state">
                <p>⚠️ No hay datos de Agregadores cargados</p>
            </div>
        );
    }

    const { kpis, charts } = metrics;
    const metaPedidosPorTienda = config.metaPedidosPorTienda || 30;

    return (
        <div className="dashboard-content agregadores-dashboard">
            {/* Navigation Buttons (Floating) */}
            {currentPage === 1 && (
                <button
                    className="wa-nav-btn next"
                    onClick={() => setCurrentPage(2)}
                    title="Ver Meta por Tienda"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            {currentPage === 2 && (
                <button
                    className="wa-nav-btn prev"
                    onClick={() => setCurrentPage(1)}
                    title="Volver a Resumen"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {currentPage === 1 ? (
                <>
                    {/* Page 1: KPIs + Top Charts */}
                    <div className="agregadores-top-section">
                        <div className="agregadores-kpi-grid">
                            <KPICard title="Venta Total" value={kpis.ventaTotal} format="currency" icon={DollarSign} />
                            <KPICard title="Presupuesto" value={kpis.presupuesto} format="currency" icon={Target} />
                            <KPICard title="Cantidad Tx" value={kpis.cantidadTx} format="number" icon={ShoppingCart} />
                            <KPICard title="Meta Tx" value={kpis.metaTx} format="number" icon={Target} subtitle={`Cumpl: ${kpis.cumplimientoTx}%`} />
                        </div>

                        <div className="agregadores-compliance-card">
                            <CircularProgress percentage={kpis.cumplimientoPct} size={140} strokeWidth={12} />
                            <div className="compliance-details">
                                <div className="compliance-row">
                                    <span className="label">Meta Prorrateada</span>
                                    <span className="value">L {(kpis.metaProrrateada / 1000).toLocaleString('es-HN', { minimumFractionDigits: 2 })} mil</span>
                                </div>
                                <div className="compliance-row">
                                    <span className="label">Diferencia</span>
                                    <span className={`value ${kpis.diferenciaProrrateada >= 0 ? 'positive' : 'negative'}`}>
                                        {kpis.diferenciaProrrateada >= 0 ? '+' : ''}L {(kpis.diferenciaProrrateada / 1000).toLocaleString('es-HN', { minimumFractionDigits: 2 })} mil
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="agregadores-charts-section page1">
                        <div className="chart-card">
                            <h3 className="chart-title">🏆 Top 5 Productos</h3>
                            <div className="chart-container horizontal-bar">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#FE0000" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#ff6b6b" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#888' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="url(#productGradient)" radius={[0, 8, 8, 0]} name="Cantidad" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title">🏪 Top 5 Tiendas</h3>
                            <div className="chart-container horizontal-bar">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.topTiendas} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="storeGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                                <stop offset="100%" stopColor="#38bdf8" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#888' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="url(#storeGradient)" radius={[0, 8, 8, 0]} name="Venta" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="agregadores-page2">
                    <div className="page2-header">
                        <h2 className="page2-title">📊 Meta de Pedidos por Tienda</h2>
                        <p className="page2-subtitle">Meta mensual: {metaPedidosPorTienda} pedidos por tienda</p>
                    </div>

                    <div className="chart-card full-height">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={charts.metaPorTienda} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                    <defs>
                                        <linearGradient id="metaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} angle={-45} textAnchor="end" interval={0} height={80} />
                                    <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span style={{ color: '#666', fontSize: '14px' }}>{value}</span>} />
                                    <Bar dataKey="meta" fill="url(#metaGradient)" radius={[8, 8, 0, 0]} name="Meta" />
                                    <Bar dataKey="actual" fill="url(#actualGradient)" radius={[8, 8, 0, 0]} name="Actual" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgregadoresDashboard;
