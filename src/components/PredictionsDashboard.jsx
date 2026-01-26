import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';
import { TrendingUp, TrendingDown, Target, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import GaugeChart from './GaugeChart';
import { useCountUp } from '../hooks/useCountUp';
import {
    calculateMonthEndProjection,
    calculateTargetProbability,
    predictTopProducts,
    generateScenarios,
    getDailyProjections
} from '../services/predictionsService';

const PredictionsDashboard = ({
    data,
    agregadoresData,
    ecommerceData,
    metrics,
    agregadoresMetrics,
    ecommerceMetrics,
    config,
    agregadoresConfig
}) => {
    // Intelligently select which data source to use (prefer Agregadores > E-commerce > Venta Meta)
    const { ventaPorDia, presupuesto, topProductos, dataSource } = useMemo(() => {
        // Try Agregadores first (usually has most complete daily data)
        if (agregadoresData && !agregadoresData._isSnapshot && agregadoresData.ventaPorDia && agregadoresData.ventaPorDia.length >= 3) {
            return {
                ventaPorDia: agregadoresData.ventaPorDia.map(d => ({
                    day: d.day,
                    venta: d.venta || 0
                })),
                presupuesto: agregadoresConfig?.presupuesto || 0,
                topProductos: agregadoresData.topProductos || [],
                dataSource: 'Agregadores'
            };
        }

        // Try E-commerce
        if (ecommerceData && !ecommerceData._isSnapshot && ecommerceData.ventaPorDia && ecommerceData.ventaPorDia.length >= 3) {
            return {
                ventaPorDia: ecommerceData.ventaPorDia.map(d => ({
                    day: d.day,
                    venta: d.venta || d.total || 0
                })),
                presupuesto: config?.inversionUSD * config?.tipoCambio || 0,
                topProductos: ecommerceMetrics?.kpis?.topProductos || [],
                dataSource: 'E-commerce'
            };
        }

        // Fallback to Venta Meta
        if (data && !data._isSnapshot && data.ventaPorDia && data.ventaPorDia.length >= 3) {
            return {
                ventaPorDia: data.ventaPorDia.map(d => ({
                    day: d.day,
                    venta: d.total || d.venta || 0
                })),
                presupuesto: config?.inversionUSD * config?.tipoCambio || 0,
                topProductos: metrics?.topProducts || [],
                dataSource: 'Venta Meta'
            };
        }

        // No sufficient data
        return {
            ventaPorDia: [],
            presupuesto: 0,
            topProductos: [],
            dataSource: 'Ninguno'
        };
    }, [data, agregadoresData, ecommerceData, metrics, agregadoresMetrics, ecommerceMetrics, config, agregadoresConfig]);

    // Calculate predictions
    const projection = useMemo(() => {
        return calculateMonthEndProjection(ventaPorDia, presupuesto);
    }, [ventaPorDia, presupuesto]);

    const probability = useMemo(() => {
        return calculateTargetProbability(ventaPorDia, presupuesto, 100);
    }, [ventaPorDia, presupuesto]);

    const scenarios = useMemo(() => {
        return generateScenarios(projection.projected, 20);
    }, [projection]);

    const trendingProducts = useMemo(() => {
        return predictTopProducts(ventaPorDia, topProductos);
    }, [ventaPorDia, topProductos]);

    const completeDailyData = useMemo(() => {
        if (!projection.slope) return ventaPorDia;
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return getDailyProjections(ventaPorDia, { slope: projection.slope, intercept: projection.intercept }, daysInMonth);
    }, [ventaPorDia, projection]);

    // Animated values
    const animatedProjection = useCountUp(projection.projected, 1500);
    const animatedPessimistic = useCountUp(scenarios.pessimistic, 1500);
    const animatedRealistic = useCountUp(scenarios.realistic, 1500);
    const animatedOptimistic = useCountUp(scenarios.optimistic, 1500);

    if (ventaPorDia.length < 3) {
        return (
            <div className="predictions-dashboard">
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <h3>Datos Insuficientes</h3>
                    <p>Se necesitan al menos 3 días de ventas para generar predicciones precisas.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.7 }}>
                        💡 Carga datos en uno de estos dashboards: Agregadores, E-commerce o Venta Meta
                    </p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value) => {
        return `L ${Math.round(value).toLocaleString('es-HN')}`;
    };

    const getScenarioColor = (value) => {
        const percentOfBudget = (value / presupuesto) * 100;
        if (percentOfBudget >= 100) return 'success';
        if (percentOfBudget >= 80) return 'warning';
        return 'danger';
    };

    return (
        <div className="predictions-dashboard">
            {/* Header */}
            <div className="predictions-header">
                <div className="header-content">
                    <Sparkles size={32} className="header-icon" />
                    <div>
                        <h2>Predicciones con IA</h2>
                        <p>Proyecciones basadas en {projection.daysUsed} días de datos (Confianza: {projection.confidence}%)</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                            📊 Fuente de datos: <strong>{dataSource}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Projection Section */}
            <div className="prediction-main-section">
                <div className="prediction-card projection-card">
                    <h3>Proyección de Cierre de Mes</h3>
                    <div className="projection-content">
                        <div className="projection-amount">
                            <span className="amount-label">Venta Proyectada</span>
                            <span className="amount-value">{formatCurrency(animatedProjection)}</span>
                            <span className="amount-detail">
                                {((projection.projected / presupuesto) * 100).toFixed(1)}% del presupuesto
                            </span>
                        </div>
                        <GaugeChart
                            value={probability}
                            size={180}
                            label="Probabilidad"
                        />
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="prediction-card trend-card">
                    <h3>Tendencia y Proyección</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={completeDailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="projectedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" stroke="#666" fontSize={11} />
                                <YAxis stroke="#666" fontSize={11} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(0, 0, 0, 0.85)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    formatter={(value, name) => [formatCurrency(value), name === 'venta' && completeDailyData.find(d => d.venta === value)?.type === 'projected' ? 'Proyectado' : 'Real']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="venta"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#actualGrad)"
                                    strokeDasharray={(entry, index) => {
                                        return completeDailyData[index]?.type === 'projected' ? "4 4" : "0";
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="legend-container">
                        <div className="legend-item">
                            <span className="legend-dot actual"></span>
                            <span>Datos Reales</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot projected"></span>
                            <span>Proyección IA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scenarios Section */}
            <div className="scenarios-section">
                <h3 className="section-title">Escenarios de Cierre</h3>
                <div className="scenarios-grid">
                    <div className={`scenario-card ${getScenarioColor(scenarios.pessimistic)}`}>
                        <div className="scenario-icon"><TrendingDown size={24} /></div>
                        <span className="scenario-label">Pesimista</span>
                        <span className="scenario-value">{formatCurrency(animatedPessimistic)}</span>
                        <span className="scenario-detail">-20% de proyección</span>
                    </div>

                    <div className={`scenario-card ${getScenarioColor(scenarios.realistic)} realistic`}>
                        <div className="scenario-icon"><Target size={24} /></div>
                        <span className="scenario-label">Realista</span>
                        <span className="scenario-value">{formatCurrency(animatedRealistic)}</span>
                        <span className="scenario-detail">Proyección base</span>
                    </div>

                    <div className={`scenario-card ${getScenarioColor(scenarios.optimistic)}`}>
                        <div className="scenario-icon"><TrendingUp size={24} /></div>
                        <span className="scenario-label">Optimista</span>
                        <span className="scenario-value">{formatCurrency(animatedOptimistic)}</span>
                        <span className="scenario-detail">+20% de proyección</span>
                    </div>
                </div>
            </div>

            {/* Trending Products */}
            {trendingProducts.length > 0 && (
                <div className="trending-section">
                    <h3 className="section-title">
                        <span className="fire-emoji">🔥</span> Productos en Tend encia
                    </h3>
                    <div className="trending-grid">
                        {trendingProducts.map((product, index) => (
                            <div key={index} className="trending-item">
                                <div className="trending-rank">#{index + 1}</div>
                                <div className="trending-info">
                                    <span className="trending-name">{product.fullName || product.name || product.descripcion}</span>
                                    <div className="trending-stats">
                                        <span className={`growth-badge ${product.trend}`}>
                                            {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                                        </span>
                                        <span className="trending-quantity">{product.value || product.cantidad} unidades</span>
                                    </div>
                                </div>
                                {product.growth > 0 ? (
                                    <TrendingUp className="trend-icon up" size={20} />
                                ) : (
                                    <TrendingDown className="trend-icon down" size={20} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="trending-recommendation">
                        <CheckCircle2 size={18} />
                        <span>Recomendación: Enfócate en estos productos para maximizar ventas</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionsDashboard;
