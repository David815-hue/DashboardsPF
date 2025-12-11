import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import KPICard from './KPICard';

const COLORS = ['#0891b2', '#22d3ee', '#67e8f9', '#a5f3fc'];

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

const WhatsAppDashboard = ({ metrics }) => {
    const [currentPage, setCurrentPage] = useState(1);

    if (!metrics) {
        return (
            <div className="empty-state">
                <p>⚠️ No hay datos de WhatsApp Marketing cargados</p>
            </div>
        );
    }

    const { page1, page2 } = metrics;

    return (
        <div className="dashboard-content">
            {/* Page Navigation */}
            <div className="whatsapp-page-nav">
                <button
                    className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(1)}
                >
                    📊 Resumen General
                </button>
                <button
                    className={`page-btn ${currentPage === 2 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(2)}
                >
                    👥 Por Asesor
                </button>
            </div>

            {currentPage === 1 ? (
                <div className="whatsapp-layout">
                    {/* Left Column: KPIs */}
                    <div className="whatsapp-kpis">
                        {/* Row 1: General */}
                        <div className="whatsapp-kpi-row">
                            <KPICard title="Total Venta" value={page1.kpis.totalVenta} format="currency" suffix=" mil" />
                            <KPICard title="Tasa Conversión" value={page1.kpis.tasaConversion} format="percent" suffix="%" />
                            <KPICard title="Ticket Promedio" value={page1.kpis.ticketPromedio} format="currency" suffix=" mil" />
                            <KPICard title="ROAS" value={page1.kpis.roas.toFixed(2)} format="decimal" />
                        </div>

                        {/* Row 2: TGU */}
                        <div className="whatsapp-kpi-row tgu-row">
                            <div className="city-label">TGU</div>
                            <KPICard title="Total Venta TGU" value={page1.kpis.totalVentaTGU} format="currency" suffix=" mil" variant="teal" />
                            <KPICard title="Tasa Conversión TGU" value={page1.kpis.tasaConversionTGU} format="percent" suffix="%" variant="teal" />
                            <KPICard title="Ticket Promedio TGU" value={page1.kpis.ticketPromedioTGU} format="currency" suffix=" mil" variant="teal" />
                            <KPICard title="Cantidad Venta" value={page1.kpis.cantidadVenta} format="number" />
                        </div>

                        {/* Row 3: SPS */}
                        <div className="whatsapp-kpi-row sps-row">
                            <div className="city-label">SPS</div>
                            <KPICard title="Total Venta SPS" value={page1.kpis.totalVentaSPS} format="currency" suffix=" mil" variant="teal" />
                            <KPICard title="Tasa Conversión SPS" value={page1.kpis.tasaConversionSPS} format="percent" suffix="%" variant="teal" />
                            <KPICard title="Ticket Promedio SPS" value={page1.kpis.ticketPromedioSPS} format="currency" suffix=" mil" variant="teal" />
                            <KPICard title="Tasa de Respuesta" value={page1.kpis.tasaRespuesta} format="percent" suffix="%" />
                        </div>

                        {/* Top Productos Chart */}
                        <div className="chart-wrapper whatsapp-products-chart">
                            <h3 className="chart-title">Top Productos</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={page1.charts.topProductos} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 8, fill: '#666' }}
                                            angle={-30}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {page1.charts.topProductos.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#0891b2" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pie Charts */}
                    <div className="whatsapp-charts">
                        {/* Venta por Ciudad */}
                        <div className="chart-wrapper">
                            <h3 className="chart-title">Venta por Ciudad</h3>
                            <div className="chart-container pie-container">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={page1.charts.ventaPorCiudad}
                                            cx="45%"
                                            cy="50%"
                                            outerRadius={65}
                                            dataKey="value"
                                            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {page1.charts.ventaPorCiudad.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

                        {/* Venta por Campaña */}
                        <div className="chart-wrapper">
                            <h3 className="chart-title">Venta por Campaña</h3>
                            <div className="chart-container pie-container">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={page1.charts.ventaPorCampana}
                                            cx="45%"
                                            cy="50%"
                                            outerRadius={65}
                                            dataKey="value"
                                            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {page1.charts.ventaPorCampana.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                            iconType="circle"
                                            formatter={(value) => <span style={{ fontSize: '0.65rem', color: '#333' }}>{value}</span>}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
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
                                <BarChart data={page2.ventaPorPalabraClave.slice(0, 10)} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 8, fill: '#666' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {page2.ventaPorPalabraClave.slice(0, 10).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#374151" />
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
