import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LabelList, AreaChart, Area, PieChart, Pie, Cell, Treemap
} from 'recharts';
import { TrendingUp, TrendingDown, Target, ShoppingCart, DollarSign, ChevronRight, ChevronLeft, Maximize2, X, Minus } from 'lucide-react';
import TiltedCard from './TiltedCard';

import CustomTooltip from './CustomTooltip';
import { useCountUp } from '../hooks/useCountUp';

// KPI Card Component with premium styling
const KPICard = ({ title, value, format, icon: Icon, subtitle, chart, trend = null }) => {
    const numericValue = parseFloat(value) || 0;
    const animatedValue = useCountUp(numericValue, 1200);

    const formatValue = (val) => {
        if (format === 'currency') {
            return `L ${Math.round(val).toLocaleString('es-HN')}`;
        }
        if (format === 'percent') {
            return `${val.toFixed(1)}%`;
        }
        if (format === 'number') {
            return Math.round(val).toLocaleString('es-HN');
        }
        return Math.round(val).toLocaleString('es-HN');
    };

    return (
        <div className="agregadores-kpi-card" style={{ position: 'relative' }}>
            <div className="kpi-header">
                {Icon && <Icon size={20} className="kpi-icon" />}
                <span className="kpi-title">{title}</span>
            </div>
            <div className="kpi-value">{formatValue(animatedValue)}</div>

            {/* Trend Indicator */}
            {trend !== null && trend !== undefined && (
                <div className={`trend-indicator ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`} style={{ marginTop: '2px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280' }}>
                    {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}

            {subtitle && (
                <div className="kpi-footer">
                    <span className="kpi-subtitle">{subtitle}</span>
                </div>
            )}
            {chart && (
                <div style={{ position: 'absolute', right: '5px', top: '55%', transform: 'translateY(-50%)' }}>
                    {chart}
                </div>
            )}
        </div>
    );
};

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, minimal = false }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    // Create unique gradient ID to avoid conflicts when multiple CircularProgress exist
    const gradientId = `progressGradient-${size}-${minimal ? 'mini' : 'main'}-${Math.random().toString(36).substr(2, 9)}`;

    const getColor = () => {
        if (percentage >= 100) return '#22c55e';
        if (percentage >= 80) return '#f59e0b';
        return '#ef4444';
    };

    const color = getColor();

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
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
                    stroke={`url(#${gradientId})`}
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
            <div className="progress-text" style={minimal ? { gap: '0' } : {}}>
                <span
                    className="progress-value"
                    style={minimal ? {
                        fontSize: `${size * 0.28}px`,
                    } : {}}
                >
                    {percentage.toFixed(1)}%
                </span>
                {!minimal && <span className="progress-label">Cumplimiento</span>}
            </div>
        </div>
    );
};

const AgregadoresDashboard = ({ metrics, trends, config = {}, zoneFilter = 'all', setZoneFilter }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [trendMetric, setTrendMetric] = useState('venta');
    const [cityMetric, setCityMetric] = useState('venta'); // 'venta' | 'pedidos'
    const [isFlipped, setIsFlipped] = useState(false); // Flip card state for compliance
    const [isProductsFlipped, setIsProductsFlipped] = useState(false); // Flip card state for products
    const [isTreeMapFullscreen, setIsTreeMapFullscreen] = useState(false); // Fullscreen modal for TreeMap

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
            {/* Zone Filter - Top Right with Glassmorphism */}
            {setZoneFilter && (
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '140px', /* Increased to 140px to fully clear Zen/Config buttons */
                    zIndex: 90,
                    display: 'flex',
                    gap: '4px',
                    background: 'var(--glass-surface)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '5px 6px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <button
                        onClick={() => setZoneFilter('all')}
                        style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            transform: zoneFilter === 'all' ? 'scale(1.05)' : 'scale(1)',
                            background: zoneFilter === 'all' ? 'linear-gradient(135deg, var(--secondary-brand), #6366f1)' : 'transparent',
                            color: zoneFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                            boxShadow: zoneFilter === 'all' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        Todo
                    </button>
                    <button
                        onClick={() => setZoneFilter('centro')}
                        style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            transform: zoneFilter === 'centro' ? 'scale(1.05)' : 'scale(1)',
                            background: zoneFilter === 'centro' ? 'linear-gradient(135deg, var(--secondary-brand), #6366f1)' : 'transparent',
                            color: zoneFilter === 'centro' ? '#fff' : 'var(--text-secondary)',
                            boxShadow: zoneFilter === 'centro' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        Centro
                    </button>
                    <button
                        onClick={() => setZoneFilter('norte')}
                        style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            transform: zoneFilter === 'norte' ? 'scale(1.05)' : 'scale(1)',
                            background: zoneFilter === 'norte' ? 'linear-gradient(135deg, var(--secondary-brand), #6366f1)' : 'transparent',
                            color: zoneFilter === 'norte' ? '#fff' : 'var(--text-secondary)',
                            boxShadow: zoneFilter === 'norte' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        Norte
                    </button>
                </div>
            )}

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
                            <TiltedCard><KPICard title="Venta Total" value={kpis.ventaTotal} format="currency" icon={DollarSign} trend={trends?.ventaTotal} /></TiltedCard>
                            <TiltedCard><KPICard title="Presupuesto" value={kpis.presupuesto} format="currency" icon={Target} trend={trends?.presupuesto} /></TiltedCard>
                            <TiltedCard>
                                <KPICard
                                    title="Cantidad Tx"
                                    value={kpis.cantidadTx}
                                    format="number"
                                    icon={ShoppingCart}
                                    trend={trends?.cantidadTx}
                                    chart={
                                        <CircularProgress
                                            percentage={kpis.cumplimientoTxMTDPct}
                                            size={55}
                                            strokeWidth={5}
                                            minimal={true}
                                        />
                                    }
                                />
                            </TiltedCard>
                            <TiltedCard><KPICard title="Ticket Promedio" value={kpis.ticketPromedio} format="currency" icon={DollarSign} trend={trends?.ticketPromedio} /></TiltedCard>
                        </div>

                        {/* Flip Card: Compliance (front) / City Chart (back) */}
                        <div
                            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flip-card-inner">
                                {/* Front: Compliance */}
                                <div className="flip-card-front agregadores-compliance-card">
                                    <CircularProgress percentage={kpis.cumplimientoPct} size={140} strokeWidth={12} />
                                    <div className="compliance-details">
                                        <div className="compliance-row">
                                            <span className="label">Debería de Llevar</span>
                                            <span className="value">L {Math.round(kpis.metaProrrateada).toLocaleString('es-HN')}</span>
                                        </div>
                                        <div className="compliance-row">
                                            <span className="label">Diferencia</span>
                                            <span className={`value ${kpis.diferenciaProrrateada >= 0 ? 'positive' : 'negative'}`}>
                                                {kpis.diferenciaProrrateada >= 0 ? '+' : ''}L {Math.round(kpis.diferenciaProrrateada).toLocaleString('es-HN')}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.65rem', color: 'rgba(100, 116, 139, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ver ciudades →</span>
                                </div>

                                {/* Back: City Chart */}
                                <div className="flip-card-back">
                                    <div className="chart-header-with-toggle" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(100, 116, 139, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>← Volver</span>
                                            <h3 className="chart-title" style={{ fontSize: '0.9rem', margin: 0 }}>Por Ciudad</h3>
                                        </div>
                                        <div className="chart-toggle" style={{ transform: 'scale(0.85)' }}>
                                            <button
                                                className={`toggle-btn ${cityMetric === 'venta' ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); setCityMetric('venta'); }}
                                            >
                                                Venta
                                            </button>
                                            <button
                                                className={`toggle-btn ${cityMetric === 'pedidos' ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); setCityMetric('pedidos'); }}
                                            >
                                                Pedidos
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={charts.ventaPorCiudad}
                                                    dataKey={cityMetric}
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={55}
                                                    paddingAngle={2}
                                                    label={({ name, percent }) => `${name.substring(0, 6)}.. ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}
                                                    fontSize={8}
                                                >
                                                    {charts.ventaPorCiudad?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={[
                                                            '#FE0000', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
                                                        ][index % 8]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="agregadores-charts-section page1">
                        {/* Flip Card: Top 5 Products (front) / TreeMap All Products (back) */}
                        <div
                            className={`flip-card chart-card ${isProductsFlipped ? 'flipped' : ''}`}
                            onClick={() => setIsProductsFlipped(!isProductsFlipped)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flip-card-inner">
                                {/* Front: Top 5 Bar Chart */}
                                <div className="flip-card-front">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h3 className="chart-title" style={{ margin: 0 }}>Top 5 Productos</h3>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(100, 116, 139, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ver todos →</span>
                                    </div>
                                    <div className="chart-container horizontal-bar" style={{ flex: 1 }}>
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

                                {/* Back: TreeMap All Products */}
                                <div className="flip-card-back" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h3 className="chart-title" style={{ fontSize: '0.9rem', margin: 0 }}>Todos los Productos</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(100, 116, 139, 0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>← Volver</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsTreeMapFullscreen(true); }}
                                                style={{
                                                    background: 'rgba(0,0,0,0.1)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.7rem',
                                                    color: '#666'
                                                }}
                                                title="Ver en pantalla completa"
                                            >
                                                <Maximize2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <Treemap
                                                data={charts.allProductos}
                                                dataKey="value"
                                                aspectRatio={4 / 3}
                                                stroke="#fff"
                                                content={({ root, depth, x, y, width, height, index, name, value }) => {
                                                    const COLORS = ['#FE0000', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                                                    return (
                                                        <g>
                                                            <rect
                                                                x={x}
                                                                y={y}
                                                                width={width}
                                                                height={height}
                                                                style={{
                                                                    fill: COLORS[index % COLORS.length],
                                                                    stroke: '#fff',
                                                                    strokeWidth: 2,
                                                                }}
                                                            />
                                                            {width > 40 && height > 25 && (
                                                                <text
                                                                    x={x + width / 2}
                                                                    y={y + height / 2}
                                                                    textAnchor="middle"
                                                                    dominantBaseline="middle"
                                                                    fill="#fff"
                                                                    fontSize={width < 60 ? 7 : 9}
                                                                    fontWeight="bold"
                                                                >
                                                                    {name?.substring(0, 8)}...
                                                                </text>
                                                            )}
                                                        </g>
                                                    );
                                                }}
                                            >
                                                <Tooltip content={<CustomTooltip />} />
                                            </Treemap>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3 className="chart-title">Tiendas</h3>
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
                    <div className="page2-charts-grid">
                        {/* Top: Meta por Tienda (stacked bar) */}
                        <div className="chart-card">
                            <h3 className="chart-title">Meta de Pedidos por Tienda (Meta: {metaPedidosPorTienda})</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts.metaPorTienda.map(item => ({
                                        ...item,
                                        restante: Math.max(0, item.meta - item.actual),
                                        excedente: Math.max(0, item.actual - item.meta)
                                    }))} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                                        <defs>
                                            <linearGradient id="actualStackGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                                            </linearGradient>
                                            <linearGradient id="restanteGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} angle={-45} textAnchor="end" interval={0} height={60} />
                                        <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            wrapperStyle={{ top: -10, right: 0, paddingBottom: '10px' }}
                                            formatter={(value) => <span style={{ color: '#666', fontSize: '12px' }}>{value}</span>}
                                        />
                                        <Bar dataKey="actual" stackId="a" fill="url(#actualStackGradient)" name="Actual">
                                            <LabelList dataKey="actual" position="center" fill="#fff" fontWeight="bold" fontSize={10} />
                                        </Bar>
                                        <Bar dataKey="restante" stackId="a" fill="url(#restanteGradient)" radius={[6, 6, 0, 0]} name="Faltante">
                                            <LabelList dataKey="restante" position="center" fill="#fff" fontWeight="bold" fontSize={10} formatter={(val) => val > 0 ? val : ''} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom: Daily Trend (area chart with toggle) */}
                        <div className="chart-card">
                            <div className="chart-header-with-toggle">
                                <h3 className="chart-title">Tendencia Diaria del Mes</h3>
                                <div className="chart-toggle">
                                    <button
                                        className={`toggle-btn ${trendMetric === 'pedidos' ? 'active' : ''}`}
                                        onClick={() => setTrendMetric('pedidos')}
                                    >
                                        Pedidos
                                    </button>
                                    <button
                                        className={`toggle-btn ${trendMetric === 'venta' ? 'active' : ''}`}
                                        onClick={() => setTrendMetric('venta')}
                                    >
                                        Venta
                                    </button>
                                </div>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={charts.ventaPorDia} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={trendMetric === 'venta' ? '#0ea5e9' : '#8b5cf6'} stopOpacity={0.8} />
                                                <stop offset="100%" stopColor={trendMetric === 'venta' ? '#0ea5e9' : '#8b5cf6'} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            tickFormatter={(val) => trendMetric === 'venta' ? `${(val / 1000).toFixed(0)}k` : val}
                                            padding={{ bottom: 10 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey={trendMetric}
                                            stroke={trendMetric === 'venta' ? '#0ea5e9' : '#8b5cf6'}
                                            strokeWidth={3}
                                            fill="url(#trendGradient)"
                                            name={trendMetric === 'venta' ? 'Venta' : 'Pedidos'}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen TreeMap Modal */}
            {isTreeMapFullscreen && (
                <div
                    className="treemap-fullscreen-overlay"
                    onClick={() => setIsTreeMapFullscreen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>Todos los Productos - TreeMap</h2>
                        <button
                            onClick={() => setIsTreeMapFullscreen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={charts.allProductos}
                                dataKey="value"
                                aspectRatio={16 / 9}
                                stroke="#fff"
                                content={({ root, depth, x, y, width, height, index, name, value }) => {
                                    const COLORS = ['#FE0000', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                                    return (
                                        <g>
                                            <rect
                                                x={x}
                                                y={y}
                                                width={width}
                                                height={height}
                                                style={{
                                                    fill: COLORS[index % COLORS.length],
                                                    stroke: '#fff',
                                                    strokeWidth: 2,
                                                }}
                                            />
                                            {width > 60 && height > 35 && (
                                                <>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 - 8}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fill="#fff"
                                                        fontSize={width < 100 ? 10 : 13}
                                                        fontWeight="600"
                                                        fontFamily="system-ui, -apple-system, sans-serif"
                                                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                                                    >
                                                        {name?.substring(0, Math.floor(width / 8))}{name?.length > Math.floor(width / 8) ? '..' : ''}
                                                    </text>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 + 10}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fill="rgba(255,255,255,0.9)"
                                                        fontSize={width < 100 ? 9 : 11}
                                                        fontFamily="system-ui, -apple-system, sans-serif"
                                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                                                    >
                                                        {value} pedidos
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    );
                                }}
                            >
                                <Tooltip content={<CustomTooltip />} />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgregadoresDashboard;
