import { useState, useMemo, useEffect } from 'react';
import { Settings, X, Save, Calendar, ChevronDown, Trash2 } from 'lucide-react';
import KPICard from './KPICard';
import TopProductsChart from './TopProductsChart';
import FunnelChart from './FunnelChart';
import FileUploader from './FileUploader';
import ManualInputs from './ManualInputs';
import { processData } from '../utils/excelProcessor';
import { calculateMetrics } from '../utils/metricsCalculator';
import { saveSnapshot, loadSnapshot, getAllSnapshots, deleteSnapshot } from '../firebase/snapshotService';
import './Dashboard.css';

const Logo = () => (
    <div className="logo">
        <span className="logo-text">Venta Meta</span>
        <div className="logo-icon">
            <img src="/PuntoFarma.png" alt="Logo" />
        </div>
    </div>
);

// Get current week's Monday date
const getCurrentWeekMonday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const Dashboard = () => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [files, setFiles] = useState({ albatross: null, rms: null, simla: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [data, setData] = useState(null);
    const [config, setConfig] = useState({ inversionUSD: 25.52, tipoCambio: 26.42, clics: 7796, topProductsCount: 5 });

    // Snapshot management
    const [snapshotDate, setSnapshotDate] = useState(getCurrentWeekMonday());
    const [savedSnapshots, setSavedSnapshots] = useState([]);
    const [selectedSnapshot, setSelectedSnapshot] = useState('current');
    const [isSnapshotDropdownOpen, setIsSnapshotDropdownOpen] = useState(false);

    // Load available snapshots on mount
    useEffect(() => {
        loadAvailableSnapshots();
    }, []);

    const loadAvailableSnapshots = async () => {
        const result = await getAllSnapshots();
        if (result.success) {
            setSavedSnapshots(result.data);
        }
    };

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
            setSelectedSnapshot('current');
            setIsConfigOpen(false);
        } catch (err) {
            setError('Error al procesar: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveSnapshot = async () => {
        if (!data || !metrics) {
            setError('No hay datos para guardar');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const snapshotData = {
                config,
                metrics: {
                    totalVenta: metrics.totalVenta,
                    cantidadPedidos: metrics.cantidadPedidos,
                    ventaTGU: metrics.ventaTGU,
                    ventaSPS: metrics.ventaSPS,
                    ticketPromedio: metrics.ticketPromedio,
                    tasaConversion: metrics.tasaConversion,
                    roas: metrics.roas,
                    topProducts: metrics.topProducts,
                    embudoData: metrics.embudoData
                }
            };

            const result = await saveSnapshot(snapshotDate, snapshotData);

            if (result.success) {
                setSuccessMessage(`Guardado: Semana del ${snapshotDate}`);
                setTimeout(() => setSuccessMessage(null), 3000);
                loadAvailableSnapshots();
            } else {
                setError('Error al guardar: ' + result.error);
            }
        } catch (err) {
            setError('Error al guardar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadSnapshot = async (snapshotId) => {
        if (snapshotId === 'current') {
            setSelectedSnapshot('current');
            setIsSnapshotDropdownOpen(false);
            return;
        }

        const result = await loadSnapshot(snapshotId);
        if (result.success) {
            setConfig(result.data.config);
            // Create a fake data object that will make metrics return the saved values
            setData({
                _isSnapshot: true,
                _snapshotMetrics: result.data.metrics
            });
            setSelectedSnapshot(snapshotId);
        } else {
            setError('Error al cargar: ' + result.error);
        }
        setIsSnapshotDropdownOpen(false);
    };

    const handleDeleteSnapshot = async (snapshotId, e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar snapshot del ${snapshotId}?`)) {
            await deleteSnapshot(snapshotId);
            loadAvailableSnapshots();
            if (selectedSnapshot === snapshotId) {
                setSelectedSnapshot('current');
            }
        }
    };

    const metrics = useMemo(() => {
        if (!data) return null;

        // If loaded from snapshot, return the saved metrics directly
        if (data._isSnapshot) {
            return data._snapshotMetrics;
        }

        const metricsResult = calculateMetrics(data, config);
        return {
            ...metricsResult.kpis,
            embudoData: metricsResult.charts.funnelData,
            topProducts: metricsResult.charts.topProducts
        };
    }, [data, config]);

    const formatSnapshotLabel = (dateId) => {
        const date = new Date(dateId + 'T00:00:00');
        return `Semana ${date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    };

    return (
        <div className="dashboard">
            {/* Snapshot Selector - Top Left */}
            {savedSnapshots.length > 0 && (
                <div className="snapshot-selector">
                    <button
                        className="snapshot-selector-btn"
                        onClick={() => setIsSnapshotDropdownOpen(!isSnapshotDropdownOpen)}
                    >
                        <Calendar size={16} />
                        {selectedSnapshot === 'current' ? 'Datos Actuales' : formatSnapshotLabel(selectedSnapshot)}
                        <ChevronDown size={16} />
                    </button>

                    {isSnapshotDropdownOpen && (
                        <div className="snapshot-dropdown">
                            <div
                                className={`snapshot-option ${selectedSnapshot === 'current' ? 'active' : ''}`}
                                onClick={() => handleLoadSnapshot('current')}
                            >
                                📊 Datos Actuales
                            </div>
                            <div className="snapshot-divider"></div>
                            {savedSnapshots.map(snap => (
                                <div
                                    key={snap.id}
                                    className={`snapshot-option ${selectedSnapshot === snap.id ? 'active' : ''}`}
                                    onClick={() => handleLoadSnapshot(snap.id)}
                                >
                                    <span>📅 {formatSnapshotLabel(snap.id)}</span>
                                    <button
                                        className="snapshot-delete-btn"
                                        onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Config Toggle Button */}
            <button className="config-toggle-btn" onClick={() => setIsConfigOpen(true)} title="Configuración">
                <Settings size={22} />
            </button>

            {/* Success Toast */}
            {successMessage && (
                <div className="success-toast">{successMessage}</div>
            )}

            {/* Config Modal */}
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
                            <div className="divider"></div>

                            {/* Save Snapshot Section */}
                            <div className="snapshot-section">
                                <h3 className="inputs-title">
                                    <Save size={20} />
                                    Guardar Snapshot
                                </h3>
                                <div className="snapshot-save-row">
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>Fecha (Lunes de la semana)</label>
                                        <input
                                            type="date"
                                            value={snapshotDate}
                                            onChange={(e) => setSnapshotDate(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="save-snapshot-btn"
                                        onClick={handleSaveSnapshot}
                                        disabled={isSaving || !data}
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>
            )}

            {/* Header */}
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
                                    <KPICard title="ROAS" value={typeof metrics.roas === 'number' ? metrics.roas.toFixed(2) : metrics.roas} format="decimal" />
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
