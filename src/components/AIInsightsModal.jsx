import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { generateInsights } from '../services/groqService';

const AIInsightsModal = ({ isOpen, onClose, metrics, dashboardType, trends }) => {
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && metrics) {
            fetchInsights();
        }
    }, [isOpen]);

    const fetchInsights = async () => {
        setIsLoading(true);
        setError(null);
        setInsights('');

        try {
            const result = await generateInsights(metrics, dashboardType, trends);
            setInsights(result);
        } catch (err) {
            setError(err.message || 'Error al generar insights');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(insights);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="ai-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.target.className.includes('ai-modal-overlay') && onClose()}
            >
                <motion.div
                    className="ai-modal"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="ai-modal-header">
                        <div className="ai-modal-title">
                            <Sparkles size={24} />
                            <h2>AI Insights</h2>
                        </div>
                        <div className="ai-modal-actions">
                            {insights && !isLoading && (
                                <>
                                    <button
                                        className="ai-action-btn"
                                        onClick={fetchInsights}
                                        title="Regenerar"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                    <button
                                        className="ai-action-btn"
                                        onClick={handleCopy}
                                        title="Copiar"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </>
                            )}
                            <button className="ai-close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="ai-modal-content">
                        {isLoading ? (
                            <div className="ai-loading">
                                <div className="ai-loading-animation">
                                    <Sparkles className="sparkle-icon" size={32} />
                                </div>
                                <p>Analizando tus datos...</p>
                                <span className="ai-loading-sub">Esto tomará unos segundos</span>
                            </div>
                        ) : error ? (
                            <div className="ai-error">
                                <p>❌ {error}</p>
                                <button className="ai-retry-btn" onClick={fetchInsights}>
                                    Reintentar
                                </button>
                            </div>
                        ) : insights ? (
                            <div className="ai-insights-content">
                                <ReactMarkdown>{insights}</ReactMarkdown>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="ai-modal-footer">
                        <span className="ai-powered-by">
                            Powered by <strong>Groq</strong> • LLaMA 3.3
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIInsightsModal;
