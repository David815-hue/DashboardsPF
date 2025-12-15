import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import TiltedCard from './TiltedCard';

const COLORS = ['#22d3ee', '#374151']; // Teal and Dark Gray for Pie
const BAR_COLOR = '#22d3ee'; // Teal for bars

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#242424', padding: '10px', borderRadius: '5px', color: '#fff', border: 'none' }}>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{label || payload[0]?.name}</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                    {payload[0]?.value?.toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
                {payload[0]?.payload?.percent && (
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>
                        {payload[0].payload.percent}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// Custom Card Component to match the design (Value Top, Title Bottom)
const StatCard = ({ title, value, subValue, format = 'number', suffix = '', variant = 'white' }) => {
    let displayValue = value;

    if (format === 'currency') {
        const val = parseFloat(value) || 0;
        // Show full number with comma separators and L prefix
        displayValue = 'L ' + Math.round(val).toLocaleString('es-HN');
    } else if (format === 'percent') {
        displayValue = (parseFloat(value) || 0).toFixed(2);
    } else if (format === 'decimal') {
        displayValue = (parseFloat(value) || 0).toFixed(2);
    }

    const cardClass = `wa-stat-card ${variant}`;

    return (
        <div className={cardClass}>
            <div className="wa-stat-value">
                {displayValue} <span className="wa-stat-suffix">{suffix}</span>
            </div>
            <div className="wa-stat-title">{title}</div>
            {subValue && <div className="wa-stat-sub">{subValue}</div>}
        </div>
    );
};

const WhatsAppDashboard = ({ metrics, topProductsCount = 5, keywordCount = 5 }) => {
    const [currentPage, setCurrentPage] = useState(1);

    if (!metrics) {
        return (
            <div className="empty-state">
                <p>⚠️ No hay datos de WhatsApp Marketing cargados</p>
            </div>
        );
    }

    const { page1, page2 } = metrics;

    // Slice data based on config
    const topProductosData = page1.charts.topProductos?.slice(0, topProductsCount) || [];
    const keywordData = page2.ventaPorPalabraClave?.slice(0, keywordCount) || [];

    // Prepare Pie Data with percentages for labels
    const preparePieData = (data) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return data.map(item => ({
            ...item,
            percent: total > 0 ? `${((item.value / total) * 100).toFixed(2)}%` : '0%'
        }));
    };

    const pieCiudad = preparePieData(page1.charts.ventaPorCiudad);
    const pieCampana = preparePieData(page1.charts.ventaPorCampana);

    // Custom Label for Pie Chart
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, percentStr }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius * 1.2;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const textAnchor = x > cx ? 'start' : 'end';

        // Shorten name if too long
        const shortName = name && name.length > 15 ? name.substring(0, 12) + '...' : (name || '');

        // Handle undefined/NaN percent
        const displayPercent = (typeof percent === 'number' && !isNaN(percent))
            ? `(${(percent * 100).toFixed(1)}%)`
            : '';

        return (
            <text x={x} y={y} fill="#666" textAnchor={textAnchor} dominantBaseline="central" fontSize="0.7rem">
                {`${shortName}`}
                <tspan x={x} dy="1.2em" fontSize="0.65rem" fill="#999">
                    {displayPercent}
                </tspan>
            </text>
        );
    };

    return (
        <div className="dashboard-content whatsapp-dashboard">
            {/* Navigation Buttons (Floating) */}
            {currentPage === 1 && (
                <button
                    className="wa-nav-btn next"
                    onClick={() => setCurrentPage(2)}
                    title="Ver Por Asesor"
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
                <div className="wa-main-grid">
                    {/* Left Main Column */}
                    <div className="wa-left-col">

                        {/* Row 1: Main KPIs */}
                        <div className="wa-row-main">
                            <TiltedCard><StatCard title="Total Venta" value={page1.kpis.totalVenta} format="currency" suffix="" /></TiltedCard>
                            <TiltedCard><StatCard title="Tasa Conversion" value={page1.kpis.tasaConversion} format="percent" suffix="%" /></TiltedCard>
                            <TiltedCard><StatCard title="Ticket Promedio" value={page1.kpis.ticketPromedio} format="currency" suffix="" /></TiltedCard>
                            <TiltedCard><StatCard title="ROAS" value={page1.kpis.roas} format="decimal" /></TiltedCard>
                        </div>

                        {/* Row 2: TGU */}
                        <div className="wa-row-city">
                            <div className="city-tag tgu">
                                <span>ZC</span>
                            </div>
                            <TiltedCard><StatCard title="Total Venta TGU" value={page1.kpis.totalVentaTGU} format="currency" suffix="" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Tasa Conversión TGU" value={page1.kpis.tasaConversionTGU} format="percent" suffix="%" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Ticket Promedio TGU" value={page1.kpis.ticketPromedioTGU} format="currency" suffix="" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Cantidad Venta" value={page1.kpis.cantidadVenta} format="number" /></TiltedCard>
                        </div>

                        {/* Row 3: SPS */}
                        <div className="wa-row-city">
                            <div className="city-tag sps">
                                <span>ZN</span>
                            </div>
                            <TiltedCard><StatCard title="Total Venta SPS" value={page1.kpis.totalVentaSPS} format="currency" suffix="" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Tasa Conversión SPS" value={page1.kpis.tasaConversionSPS} format="percent" suffix="%" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Ticket Promedio SPS" value={page1.kpis.ticketPromedioSPS} format="currency" suffix="" variant="teal" /></TiltedCard>
                            <TiltedCard><StatCard title="Tasa de Respuesta" value={page1.kpis.tasaRespuesta} format="percent" suffix="%" /></TiltedCard>
                        </div>

                        {/* Row 4: Bottom (Logo + Chart) */}
                        <div className="wa-bottom-row">
                            <div className="wa-brand-area">
                                <h2 className="wa-title">WhatsApp Marketing</h2>
                                <img src="/DomiciliosPF.png" alt="Domicilios" className="wa-logo" />
                            </div>
                            <div className="wa-bottom-chart">
                                <h3 className="chart-title-center">Top Productos</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProductosData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="whatsappBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 9, fill: '#666' }}
                                            interval={0}
                                            tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="url(#whatsappBarGradient)">
                                            {topProductosData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="url(#whatsappBarGradient)" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Pie Charts */}
                    <div className="wa-right-col">

                        {/* Pie 1: Ciudad */}
                        <div className="wa-pie-wrapper">
                            <h3 className="chart-title-right">Venta por Ciudad</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="grad-teal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="grad-dark" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#374151" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#111827" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={pieCiudad}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={65}
                                        paddingAngle={0}
                                        dataKey="value"
                                        label={renderCustomizedLabel}
                                        labelLine={true}
                                    >
                                        {pieCiudad.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#grad-${index % 2 === 0 ? 'teal' : 'dark'})`} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '0.7rem', right: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie 2: Campaña */}
                        <div className="wa-pie-wrapper">
                            <h3 className="chart-title-right">Venta por Campaña</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="grad-teal-2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="grad-dark-2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#374151" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#111827" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={pieCampana}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={65}
                                        paddingAngle={0}
                                        dataKey="value"
                                        label={renderCustomizedLabel}
                                        labelLine={true}
                                    >
                                        {pieCampana.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#grad-${index % 2 === 0 ? 'teal-2' : 'dark-2'})`} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '0.7rem', right: 0 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="whatsapp-page2">
                    {/* Asesor Table */}
                    <div className="asesor-table-container">
                        <table className="asesor-table">
                            <thead>
                                <tr>
                                    <th>Asesor</th>
                                    <th>Pedidos Marketing</th>
                                    <th>Venta Marketing</th>
                                    <th>Pedidos Farmacovigilancia</th>
                                    <th>Venta Farmacovigilancia</th>
                                    <th>Total Venta</th>
                                    <th>Ticket Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {page2.tablaAsesores.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.asesor}</td>
                                        <td>{row.pedidosMkt}</td>
                                        <td>{row.ventaMkt.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</td>
                                        <td>{row.pedidosFarma}</td>
                                        <td>{row.ventaFarma.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</td>
                                        <td>{row.totalVenta.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</td>
                                        <td>{row.ticketPromedio.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Venta por Palabra Clave */}
                    <div className="chart-wrapper palabra-clave-chart">
                        <h3 className="chart-title">Venta por Palabra Clave</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={keywordData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 8, fill: '#666' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {keywordData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0891b2', '#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppDashboard;
