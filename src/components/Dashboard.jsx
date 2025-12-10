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

// Logo placeholder - reemplazar con la imagen real
const Logo = () => (
    <div className="logo">
        <span className="logo-text">Venta Meta</span>
        <div className="logo-icon">
            <img src="/PuntoFarma.png" alt="Logo" style={{ height: '60px' }} />
        </div>
    </div>
);

const Dashboard = () => {
    // Config state
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Estado de archivos
    const [files, setFiles] = useState({
        albatross: null,
        rms: null,
        simla: null,
    });

    // Estado de procesamiento
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Datos procesados
    const [data, setData] = useState(null);

    // Configuración manual
    const [config, setConfig] = useState({
        inversionUSD: 25.52,
        tipoCambio: 26.42,
        clics: 7796,
    });

    // Manejar cambio de archivo
    const handleFileChange = (key, file) => {
        setFiles(prev => ({ ...prev, [key]: file }));
        setError(null);
    };

    // Procesar archivos
    const handleProcess = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const result = await processData(files);
            setData(result);
            setIsConfigOpen(false); // Hide setup after success
        } catch (err) {
            console.error('Error procesando archivos:', err);
            setError('Error al procesar los archivos: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Calcular métricas
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
            {/* Config Toggle Button */}
            <button
                className="config-toggle-btn"
                onClick={() => setIsConfigOpen(true)}
                title="Configuración"
            >
                <Settings size={28} strokeWidth={2} />
            </button>

            {/* Config Modal */}
            {isConfigOpen && (
                <div className="config-modal-overlay" onClick={(e) => {
                    if (e.target.className === 'config-modal-overlay') setIsConfigOpen(false);
                }}>
                    <div className="config-modal">
                        <div className="config-modal-header">
                            <h2>Configuración de Datos</h2>
                            <button className="close-btn" onClick={() => setIsConfigOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="config-modal-content">
                            <FileUploader
                                files={files}
                                onFileChange={handleFileChange}
                                onProcess={handleProcess}
                                isProcessing={isProcessing}
                            />

                            <div className="divider"></div>

                            <ManualInputs
                                config={config}
                                onConfigChange={setConfig}
                            />
                        </div>

                        {error && (
                            <div className="error-message">{error}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="dashboard-header">
                <Logo />
            </header>

            {/* Dashboard principal */}
            {metrics ? (
                <div className="dashboard-content">
                    {/* KPIs Grid - Izquierda */}
                    <div className="dashboard-layout">
                        <div className="left-column">
                            <div className="kpi-grid-container">
                                <KPICard
                                    title="Total Venta"
                                    value={metrics.totalVenta}
                                    format="currency"
                                    suffix=" mil"
                                />
                                <KPICard
                                    title="Cantidad de Pedidos"
                                    value={metrics.cantidadPedidos}
                                    format="number"
                                />
                                <KPICard
                                    title="Venta TGU"
                                    value={metrics.ventaTGU}
                                    format="currency"
                                />
                                <KPICard
                                    title="Ticket Promedio"
                                    value={metrics.ticketPromedio}
                                    format="currency"
                                />
                                <KPICard
                                    title="Venta SPS"
                                    value={metrics.ventaSPS}
                                    format="currency"
                                    suffix=" mil"
                                />
                                <KPICard
                                    title="Tasa de Conversion"
                                    value={metrics.tasaConversion}
                                    format="percent"
                                    suffix="%"
                                />
                                <div className="kpi-centered-row">
                                    <KPICard
                                        title="ROAS"
                                        value={metrics.roas}
                                        format="decimal"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gráficos - Derecha */}
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
                /* Empty state */
                <div className="empty-state">
                    <p style={{ marginBottom: '20px' }}>⚠️ No hay datos cargados</p>
                    <button
                        className="process-btn"
                        onClick={() => setIsConfigOpen(true)}
                        style={{ maxWidth: '200px', margin: '0 auto' }}
                    >
                        Configurar Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
