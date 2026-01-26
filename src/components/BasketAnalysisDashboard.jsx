import React, { useMemo } from 'react';
import { ShoppingCart, TrendingUp, Package, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { analyzeBasket } from '../services/basketAnalysisService';

const BasketAnalysisDashboard = ({ ecommerceData }) => {
    // Analyze basket
    const analysis = useMemo(() => {
        if (!ecommerceData || ecommerceData._isSnapshot) {
            return null;
        }
        return analyzeBasket(ecommerceData, {
            minSupport: 0.02,
            minConfidence: 0.3,
            topN: 10
        });
    }, [ecommerceData]);

    if (!analysis || analysis.stats.totalTransactions === 0) {
        return (
            <div className="basket-analysis-dashboard">
                <div className="empty-state">
                    <AlertCircle size={48} />
                    <h3>Datos Insuficientes</h3>
                    <p>Se necesitan datos de E-commerce con múltiples pedidos para realizar análisis de canasta.</p>
                    <p className="hint">Por favor carga datos de E-commerce primero.</p>
                </div>
            </div>
        );
    }

    const { stats, recommendations, frequentPairs } = analysis;

    const getConfidenceColor = (confidence) => {
        if (confidence >= 70) return 'high';
        if (confidence >= 50) return 'medium';
        return 'low';
    };

    const getStrengthBadgeClass = (strength) => {
        if (strength === 'Alta') return 'strength-high';
        if (strength === 'Media') return 'strength-medium';
        return 'strength-low';
    };

    return (
        <div className="basket-analysis-dashboard">
            {/* Header */}
            <div className="basket-header">
                <div className="header-content">
                    <ShoppingCart size={32} className="header-icon" />
                    <div>
                        <h2>Análisis de Canasta</h2>
                        <p>Market Basket Analysis - Productos frecuentemente comprados juntos</p>
                    </div>
                </div>
            </div>

            {/* Stats  Overview */}
            <div className="basket-stats-row">
                <div className="stat-card">
                    <Package size={24} />
                    <div>
                        <span className="stat-value">{stats.totalTransactions}</span>
                        <span className="stat-label">Pedidos Analizados</span>
                    </div>
                </div>
                <div className="stat-card">
                    <ShoppingCart size={24} />
                    <div>
                        <span className="stat-value">{stats.avgItemsPerTransaction}</span>
                        <span className="stat-label">Productos/Pedido</span>
                    </div>
                </div>
                <div className="stat-card">
                    <TrendingUp size={24} />
                    <div>
                        <span className="stat-value">{stats.uniqueProducts}</span>
                        <span className="stat-label">Productos Únicos</span>
                    </div>
                </div>
            </div>

            {/* Top Combinations */}
            {frequentPairs.length > 0 && (
                <div className="combinations-section">
                    <h3 className="section-title">Top Combinaciones de Productos</h3>
                    <div className="combinations-list">
                        {frequentPairs.map((pair, index) => (
                            <div key={index} className="combination-card">
                                <div className="combination-rank">#{index + 1}</div>
                                <div className="combination-content">
                                    <div className="product-pair">
                                        <span className="product-name">{pair.itemA}</span>
                                        <span className="pair-separator">+</span>
                                        <span className="product-name">{pair.itemB}</span>
                                    </div>
                                    <div className="combination-stats">
                                        <div className="stat-item">
                                            <span className="stat-label-small">Soporte</span>
                                            <span className="stat-value-small">{pair.support}%</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label-small">Veces Comprados</span>
                                            <span className="stat-value-small">{pair.count}x</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h3 className="section-title">
                        <Sparkles size={20} />
                        Recomendaciones de Cross-Selling
                    </h3>
                    <div className="recommendations-grid">
                        {recommendations.map((rec, index) => (
                            <div key={index} className={`recommendation-card ${getConfidenceColor(rec.confidence)}`}>
                                <div className="rec-header">
                                    <span className={`strength-badge ${getStrengthBadgeClass(rec.strength)}`}>
                                        {rec.strength}
                                    </span>
                                    <span className="confidence-value">{rec.confidence}%</span>
                                </div>

                                <div className="rec-body">
                                    <div className="product-flow">
                                        <div className="product-box">
                                            <span className="product-label">Compran</span>
                                            <span className="product-text">{rec.antecedent}</span>
                                        </div>
                                        <ArrowRight className="flow-arrow" size={20} />
                                        <div className="product-box">
                                            <span className="product-label">También</span>
                                            <span className="product-text">{rec.consequent}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rec-footer">
                                    <div className="rec-stat">
                                        <span className="rec-stat-label">Uplift Potencial</span>
                                        <span className="rec-stat-value">+{rec.upliftPotential}%</span>
                                    </div>
                                    <div className="rec-stat">
                                        <span className="rec-stat-label">Lift</span>
                                        <span className="rec-stat-value">{rec.lift}x</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actionable Insights */}
                    <div className="insights-box">
                        <h4>💡 Acciones Sugeridas</h4>
                        <ul className="insights-list">
                            {recommendations.slice(0, 3).map((rec, index) => (
                                <li key={index}>
                                    <strong>Bundle:</strong> Crea un paquete combo con "{rec.antecedent}" + "{rec.consequent}"
                                    <span className="insight-impact"> (Uplift estimado: +{rec.upliftPotential}%)</span>
                                </li>
                            ))}
                            <li>
                                <strong>Promoción:</strong> Al comprar productos de alta afinidad, ofrece descuento en el segundo
                            </li>
                            <li>
                                <strong>Layout:</strong> Coloca productos relacionados cerca en la tienda física o en la web
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* No recommendations found */}
            {recommendations.length === 0 && (
                <div className="no-recommendations">
                    <AlertCircle size={32} />
                    <p>No se encontraron patrones de compra significativos con los parámetros actuales.</p>
                    <p className="hint">Intenta cargar más datos o ajusta los umbrales de análisis.</p>
                </div>
            )}
        </div>
    );
};

export default BasketAnalysisDashboard;
