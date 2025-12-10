import { useState, useMemo } from 'react';
import { Settings, X } from 'lucide-react';
import KPICard from './KPICard';
import TopProductsChart from './TopProductsChart';
import FunnelChart from './FunnelChart';
import FileUploader from './FileUploader';
import ManualInputs from './ManualInputs';
import { processData } from '../utils/excelProcessor';
import { calculateMetrics } from '../utils/metricsCalculator';
import './Dashboard.css';

const Logo = () => (
    <div className="logo">
        <span className="logo-text">Venta Meta</span>
        <div className="logo-icon">
            <img src="/PuntoFarma.png" alt="Logo" />
        </div>
    </div>
);

const Dashboard = () => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [files, setFiles] = useState({ albatross: null, rms: null, simla: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [config, setConfig] = useState({ inversionUSD: 25.52, tipoCambio: 26.42, clics: 7796 });

    const handleFileChange = (key, file) => {
        setFiles(prev => ({ ...prev, [key]: file }));
        setError(null);
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const result = await processData(files);
            setData(result);
            setIsConfigOpen(false);
        } catch (err) {
            setError('Error al procesar: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const metrics = useMemo(() => {
        if (!data) return null;
        const metricsResult = calculateMetrics(data, config);
        return {
            ...metricsResult.kpis,
            embudoData: metricsResult.charts.funnelData,
            topProducts: metricsResult.charts.topProducts
        };
    }, [data, config]);

    return (
        <div className="dashboard">
            <button className="config-toggle-btn" onClick={() => setIsConfigOpen(true)} title="Configuración">
                <Settings size={22} />
            </button>

            {isConfigOpen && (
                <div className="config-modal-overlay" onClick={(e) => e.target.className === 'config-modal-overlay' && setIsConfigOpen(false)}>
                    <div className="config-modal">
                        <div className="config-modal-header">
                            <h2>Configuración</h2>
                            <button className="close-btn" onClick={() => setIsConfigOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="config-modal-content">
                            <FileUploader files={files} onFileChange={handleFileChange} onProcess={handleProcess} isProcessing={isProcessing} />
                            <div className="divider"></div>
                            <ManualInputs config={config} onConfigChange={setConfig} />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>
            )}

            <header className="dashboard-header">
                <Logo />
            </header>

            {metrics ? (
                <div className="dashboard-content">
                    <div className="dashboard-layout">
                        {/* Left: KPIs */}
                        <div className="left-column">
                            <div className="kpi-grid-container">
                                <KPICard title="Total Venta" value={metrics.totalVenta} format="currency" suffix=" mil" />
                                <KPICard title="Cantidad de Pedidos" value={metrics.cantidadPedidos} format="number" />
                                <KPICard title="Venta TGU" value={metrics.ventaTGU} format="currency" />
                                <KPICard title="Ticket Promedio" value={metrics.ticketPromedio} format="currency" />
                                <KPICard title="Venta SPS" value={metrics.ventaSPS} format="currency" suffix=" mil" />
                                <KPICard title="Tasa de Conversion" value={metrics.tasaConversion} format="percent" suffix="%" />
                                <div className="kpi-centered-row">
                                    <KPICard title="ROAS" value={metrics.roas.toFixed(2)} format="decimal" />
                                </div>
                            </div>
                        </div>

                        {/* Right: Charts */}
                        <div className="right-column">
                            <div className="chart-wrapper">
                                <h3 className="chart-title">Top Productos</h3>
                                <TopProductsChart data={metrics.topProducts} />
                            </div>
                            <div className="chart-wrapper">
                                <FunnelChart data={metrics.embudoData} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <p>⚠️ No hay datos cargados</p>
                    <button className="process-btn" onClick={() => setIsConfigOpen(true)}>Configurar Dashboard</button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
