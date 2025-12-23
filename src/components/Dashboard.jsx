import { useState, useMemo, useEffect } from 'react';
import { Settings, X, Save, Calendar, ChevronDown, Trash2, Maximize2, Minimize2, Menu } from 'lucide-react';
import PeriodSelector from './PeriodSelector';
import KPICard from './KPICard';
import TopProductsChart from './TopProductsChart';
import FunnelChart from './FunnelChart';
import FileUploader from './FileUploader';
import ManualInputs from './ManualInputs';
import EcommerceDashboard from './EcommerceDashboard';
import WhatsAppDashboard from './WhatsAppDashboard';
import AgregadoresDashboard from './AgregadoresDashboard';
import TiltedCard from './TiltedCard';
import { processData } from '../utils/excelProcessor';
import { calculateMetrics } from '../utils/metricsCalculator';
import { processEcommerceData } from '../utils/ecommerceProcessor';
import { calculateEcommerceMetrics } from '../utils/ecommerceMetrics';
import { processWhatsAppMarketingData } from '../utils/whatsappProcessor';
import { calculateWhatsAppMetrics } from '../utils/whatsappMetrics';
import { processPedidosYaData } from '../utils/pedidosYaProcessor';
import { calculateAgregadoresMetrics } from '../utils/agregadoresMetrics';
import {
    saveSnapshot, loadSnapshot, getSnapshotsByMonth, deleteSnapshot, calculateMonthlyAggregate,
    saveEcommerceSnapshot, loadEcommerceSnapshot, getEcommerceSnapshotsByMonth, deleteEcommerceSnapshot, calculateEcommerceMonthlyAggregate,
    saveWhatsAppSnapshot, loadWhatsAppSnapshot, getWhatsAppSnapshotsByMonth, deleteWhatsAppSnapshot, calculateWhatsAppMonthlyAggregate,
    saveAgregadoresSnapshot, loadAgregadoresSnapshot, getAgregadoresSnapshotsByMonth, deleteAgregadoresSnapshot, calculateAgregadoresMonthlyAggregate
} from '../firebase/snapshotService';
import './Dashboard.css';

const Logo = () => (
    <div className="logo">
        <span className="logo-text">Venta Meta</span>
        <div className="logo-icon">
            <img src="/PuntoFarma.png" alt="Logo" />
        </div>
    </div>
);

const getCurrentWeekMonday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const MONTH_NAMES = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
};

const Dashboard = () => {
    // Zen Mode State
    const [isZenMode, setIsZenMode] = useState(false);

    // Toggle Fullscreen when Zen Mode changes
    useEffect(() => {
        if (isZenMode) {
            document.documentElement.requestFullscreen().catch((e) => {
                console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
            });
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch((e) => {
                    console.error(`Error attempting to exit fullscreen mode: ${e.message} (${e.name})`);
                });
            }
        }
    }, [isZenMode]);

    // Handle ESC key to sync state if user exits fullscreen manually
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsZenMode(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [files, setFiles] = useState({ albatross: null, rms: null, simla: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Initial loading state
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [data, setData] = useState(null);
    const [ecommerceData, setEcommerceData] = useState(null);
    const [whatsappData, setWhatsappData] = useState(null);
    const [agregadoresData, setAgregadoresData] = useState(null);
    const [agregadoresZoneFilter, setAgregadoresZoneFilter] = useState('all'); // 'all', 'centro', 'norte'
    const [config, setConfig] = useState({ inversionUSD: 25.52, tipoCambio: 26.42, clics: 7796, topProductsCount: 5, totalEnvios: 94, enviosTGU: 74, enviosSPS: 20, costoEnvioLps: 2.11 });
    const [agregadoresConfig, setAgregadoresConfig] = useState({ presupuesto: 0, presupuestoCentro: 0, presupuestoNorte: 0, metaTx: 0, metaTxCentro: 0, metaTxNorte: 0, cumplimientoTx: 0, metaPedidosPorTienda: 30 });
    const [topProductsConfig, setTopProductsConfig] = useState({
        ventaMetaTopProductos: 5,
        ecommerceTopProductos: 6,
        whatsappTopProductos: 5,
        whatsappPalabraClave: 5
    });

    // Snapshot management
    const [snapshotDate, setSnapshotDate] = useState(getCurrentWeekMonday());
    const [snapshotsByMonth, setSnapshotsByMonth] = useState({});
    const [ecommerceSnapshotsByMonth, setEcommerceSnapshotsByMonth] = useState({});
    const [whatsappSnapshotsByMonth, setWhatsappSnapshotsByMonth] = useState({});
    const [agregadoresSnapshotsByMonth, setAgregadoresSnapshotsByMonth] = useState({});

    // Hierarchical selection
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);

    // Comparison Mode State
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [selectedMonthB, setSelectedMonthB] = useState(null);
    const [selectedWeekB, setSelectedWeekB] = useState(null);

    // Dashboard tabs
    const [activeTab, setActiveTab] = useState('venta-meta');
    const [isMenuLocked, setIsMenuLocked] = useState(false); // New state for menu lock
    const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
    const DASHBOARD_TABS = [
        { id: 'venta-meta', label: 'Venta Meta', icon: '📊' },
        { id: 'ecommerce', label: 'Venta E-commerce', icon: '🛒' },
        { id: 'whatsapp', label: 'WhatsApp Marketing', icon: '💬' },
        { id: 'agregadores', label: 'Agregadores', icon: '🚀' }
    ];

    const currentDashboard = DASHBOARD_TABS.find(t => t.id === activeTab);

    // Load available snapshots on mount
    useEffect(() => {
        loadAvailableSnapshots();
    }, []);

    const loadAvailableSnapshots = async () => {
        setIsLoading(true);
        try {
            // Load Venta Meta snapshots
            const result = await getSnapshotsByMonth();
            if (result.success) {
                setSnapshotsByMonth(result.data);
            }
            // Load E-commerce snapshots
            const ecomResult = await getEcommerceSnapshotsByMonth();
            if (ecomResult.success) {
                setEcommerceSnapshotsByMonth(ecomResult.data);
            }
            // Load WhatsApp snapshots
            const waResult = await getWhatsAppSnapshotsByMonth();
            setWhatsappSnapshotsByMonth(waResult);

            // Load Agregadores snapshots
            const agregResult = await getAgregadoresSnapshotsByMonth();
            setAgregadoresSnapshotsByMonth(agregResult);

            // Auto-select current month if available
            const now = new Date();
            const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const hasData = (result.success && result.data[currentMonthKey]) ||
                (ecomResult.success && ecomResult.data[currentMonthKey]) ||
                (waResult && waResult[currentMonthKey]) ||
                (agregResult && agregResult[currentMonthKey]);

            if (hasData) {
                setSelectedMonth(currentMonthKey);
            }
        } catch (err) {
            console.error("Error loading snapshots:", err);
        } finally {
            setIsLoading(false);
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
            if (activeTab === 'ecommerce') {
                // E-commerce processing (Albatross + RMS only)
                const result = await processEcommerceData(files);
                setEcommerceData(result);
            } else if (activeTab === 'whatsapp') {
                // WhatsApp Marketing processing (Albatross + RMS + SIMLA)
                const result = await processWhatsAppMarketingData(files);
                setWhatsappData(result);
            } else if (activeTab === 'agregadores') {
                // Agregadores processing (PedidosYa Excel)
                const result = await processPedidosYaData(files);
                setAgregadoresData(result);
            } else {
                // Venta Meta processing (Albatross + RMS + SIMLA)
                const result = await processData(files);
                setData(result);
            }
            setSelectedMonth(null);
            setSelectedWeek(null);
            setIsConfigOpen(false);
        } catch (err) {
            setError('Error al procesar: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveSnapshot = async () => {
        // Check for data based on active tab
        if (activeTab === 'ecommerce') {
            if (!ecommerceData || !ecommerceMetrics) {
                setError('No hay datos de E-commerce para guardar');
                return;
            }
        } else if (activeTab === 'whatsapp') {
            if (!whatsappData || !whatsappMetrics) {
                setError('No hay datos de WhatsApp Marketing para guardar');
                return;
            }
        } else if (activeTab === 'agregadores') {
            if (!agregadoresData || !agregadoresMetrics) {
                setError('No hay datos de Agregadores para guardar');
                return;
            }
        } else {
            if (!data || !metrics) {
                setError('No hay datos para guardar');
                return;
            }
        }

        setIsSaving(true);
        setError(null);

        try {
            let result;

            if (activeTab === 'ecommerce') {
                // Save E-commerce snapshot
                const snapshotData = {
                    metrics: ecommerceMetrics.kpis,
                    charts: ecommerceMetrics.charts
                };
                result = await saveEcommerceSnapshot(snapshotDate, snapshotData);
            } else if (activeTab === 'whatsapp') {
                // Save WhatsApp Marketing snapshot (both pages)
                const snapshotData = {
                    config: {
                        ...config,
                        totalConversaciones: whatsappData?.totalConversaciones || 0
                    },
                    kpis: whatsappMetrics.page1.kpis,
                    charts: whatsappMetrics.page1.charts,
                    page2: {
                        tablaAsesores: whatsappMetrics.page2?.tablaAsesores || [],
                        ventaPorPalabraClave: whatsappMetrics.page2?.ventaPorPalabraClave || []
                    }
                };
                result = await saveWhatsAppSnapshot(snapshotDate, snapshotData);
            } else if (activeTab === 'agregadores') {
                // Save Agregadores snapshot - only save summarized data (not rawData to avoid size limit)
                // Get processed data - either from fresh data or from loaded snapshot
                let processedDataToSave;
                if (agregadoresData._isSnapshot && agregadoresData._snapshotMetrics?.rawProcessedData) {
                    // If already a snapshot with rawProcessedData, use that (without rawData)
                    const { rawData, ...rest } = agregadoresData._snapshotMetrics.rawProcessedData;
                    processedDataToSave = rest;
                } else if (!agregadoresData._isSnapshot) {
                    // Fresh data - save summarized data only (no rawData - it's too large for Firebase)
                    processedDataToSave = {
                        ventaTotal: agregadoresData.ventaTotal,
                        cantidadTx: agregadoresData.cantidadTx,
                        topProductos: agregadoresData.topProductos?.slice(0, 50), // Limit to top 50
                        topTiendas: agregadoresData.topTiendas,
                        pedidosPorTienda: agregadoresData.pedidosPorTienda,
                        ventaPorDia: agregadoresData.ventaPorDia
                        // Note: rawData excluded to stay under Firebase 1MB limit
                    };
                }

                console.log('[Agregadores Snapshot] Saving with processedData:', !!processedDataToSave);

                const snapshotData = {
                    config: agregadoresConfig,
                    kpis: agregadoresMetrics.kpis,
                    charts: agregadoresMetrics.charts,
                    snapshotDate: snapshotDate,
                    rawProcessedData: processedDataToSave
                };
                result = await saveAgregadoresSnapshot(snapshotDate, snapshotData);
            } else {
                // Save Venta Meta snapshot
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
                result = await saveSnapshot(snapshotDate, snapshotData);
            }

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

    const handleSelectMonth = (monthKey) => {
        if (!monthKey) { // 'current' or null logic mapped to null inside component
            setSelectedMonth(null);
            setSelectedWeek(null);
        } else {
            setSelectedMonth(monthKey);
            setSelectedWeek(null); // Show aggregate by default
        }
        setIsMonthDropdownOpen(false);
    };

    const handleSelectWeek = async (weekId) => {
        if (!weekId) { // 'aggregate' or null
            setSelectedWeek(null);
        } else {
            // Use correct load function based on activeTab
            let loadFn;
            if (activeTab === 'ecommerce') {
                loadFn = loadEcommerceSnapshot;
            } else if (activeTab === 'whatsapp') {
                loadFn = loadWhatsAppSnapshot;
            } else if (activeTab === 'agregadores') {
                loadFn = loadAgregadoresSnapshot;
            } else {
                loadFn = loadSnapshot;
            }
            const result = await loadFn(weekId);
            if (result.success) {
                if (activeTab === 'ecommerce') {
                    setEcommerceData({
                        _isSnapshot: true,
                        _snapshotMetrics: result.data
                    });
                } else if (activeTab === 'whatsapp') {
                    setWhatsappData({
                        _isSnapshot: true,
                        _snapshotMetrics: result.data
                    });
                } else if (activeTab === 'agregadores') {
                    setAgregadoresData({
                        _isSnapshot: true,
                        _snapshotMetrics: result.data
                    });
                } else {
                    setData({
                        _isSnapshot: true,
                        _snapshotMetrics: result.data.metrics
                    });
                }
                setSelectedWeek(weekId);
            } else {
                setError('Error al cargar: ' + result.error);
            }
        }
        setIsWeekDropdownOpen(false);
    };

    // Helper to fetch data for Period B (Comparison)
    const [dataB, setDataB] = useState(null);
    const [ecommerceDataB, setEcommerceDataB] = useState(null);
    const [whatsappDataB, setWhatsappDataB] = useState(null);
    const [agregadoresDataB, setAgregadoresDataB] = useState(null);

    // Fetch B Data when selection B changes
    useEffect(() => {
        const loadB = async () => {
            if (!isComparisonMode || (!selectedMonthB && !selectedWeekB)) {
                setDataB(null); setEcommerceDataB(null); setWhatsappDataB(null); setAgregadoresDataB(null);
                return;
            }

            // Define load function
            const getLoadFn = () => {
                if (activeTab === 'ecommerce') return loadEcommerceSnapshot;
                if (activeTab === 'whatsapp') return loadWhatsAppSnapshot;
                if (activeTab === 'agregadores') return loadAgregadoresSnapshot;
                return loadSnapshot;
            };

            const loadFn = getLoadFn();

            // If week selected, load specific snapshot
            if (selectedWeekB) {
                const result = await loadFn(selectedWeekB);
                if (result.success) {
                    if (activeTab === 'ecommerce') setEcommerceDataB({ _isSnapshot: true, _snapshotMetrics: result.data });
                    else if (activeTab === 'whatsapp') setWhatsappDataB({ _isSnapshot: true, _snapshotMetrics: result.data });
                    else if (activeTab === 'agregadores') setAgregadoresDataB({ _isSnapshot: true, _snapshotMetrics: result.data });
                    else setDataB({ _isSnapshot: true, _snapshotMetrics: result.data.metrics });
                }
            } else if (selectedMonthB) {
                // For aggregates, we rely on metrics calculation using snapshotsByMonth
            }
        };
        loadB();
    }, [isComparisonMode, selectedMonthB, selectedWeekB, activeTab]);

    const handleDeleteSnapshot = async (snapshotId, e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar snapshot del ${snapshotId}?`)) {
            // Use correct delete function based on activeTab
            let deleteFn;
            if (activeTab === 'ecommerce') {
                deleteFn = deleteEcommerceSnapshot;
            } else if (activeTab === 'whatsapp') {
                deleteFn = deleteWhatsAppSnapshot;
            } else if (activeTab === 'agregadores') {
                deleteFn = deleteAgregadoresSnapshot;
            } else {
                deleteFn = deleteSnapshot;
            }
            await deleteFn(snapshotId);
            loadAvailableSnapshots();
            if (selectedWeek === snapshotId) {
                setSelectedWeek(null);
            }
        }
    };

    // --- Metric Calculation Helper ---
    const getMetricsForPeriod = (d, mSelected, wSelected, snapshotsMap) => {
        // Current data (freshly processed)
        if (!mSelected && d && !d._isSnapshot) {
            if (activeTab === 'ecommerce') return calculateEcommerceMetrics(d);
            if (activeTab === 'whatsapp') return calculateWhatsAppMetrics(d, config);
            if (activeTab === 'agregadores') return calculateAgregadoresMetrics(d, agregadoresConfig, agregadoresZoneFilter);

            // Venta Meta
            const metricsResult = calculateMetrics(d, config);
            return {
                ...metricsResult.kpis,
                embudoData: metricsResult.charts.funnelData,
                topProducts: metricsResult.charts.topProducts
            };
        }

        // Loaded snapshot (specific week)
        if (d && d._isSnapshot) {
            const snap = d._snapshotMetrics;
            if (activeTab === 'ecommerce') return { kpis: snap.metrics, charts: snap.charts };
            if (activeTab === 'whatsapp') return { page1: { kpis: snap.kpis, charts: snap.charts }, page2: { ...snap.page2 } };
            if (activeTab === 'agregadores') {
                if (snap.rawProcessedData) {
                    return calculateAgregadoresMetrics(snap.rawProcessedData, snap.config || agregadoresConfig, agregadoresZoneFilter);
                }
                return { kpis: snap.kpis, charts: snap.charts };
            }
            // Venta Meta
            return snap;
        }

        // Month aggregate
        if (mSelected && !wSelected && snapshotsMap[mSelected]) {
            if (activeTab === 'ecommerce') return calculateEcommerceMonthlyAggregate(snapshotsMap[mSelected]);
            if (activeTab === 'whatsapp') return calculateWhatsAppMonthlyAggregate(snapshotsMap[mSelected]);
            if (activeTab === 'agregadores') return calculateAgregadoresMonthlyAggregate(snapshotsMap[mSelected], agregadoresConfig, agregadoresZoneFilter);
            return calculateMonthlyAggregate(snapshotsMap[mSelected]);
        }

        return null;
    };

    // Calculate metrics based on selection A
    const metrics = useMemo(() => {
        const d = activeTab === 'ecommerce' ? ecommerceData : activeTab === 'whatsapp' ? whatsappData : activeTab === 'agregadores' ? agregadoresData : data;
        const map = activeTab === 'ecommerce' ? ecommerceSnapshotsByMonth : activeTab === 'whatsapp' ? whatsappSnapshotsByMonth : activeTab === 'agregadores' ? agregadoresSnapshotsByMonth : snapshotsByMonth;
        return getMetricsForPeriod(d, selectedMonth, selectedWeek, map);
    }, [data, ecommerceData, whatsappData, agregadoresData, config, activeTab, selectedMonth, selectedWeek, snapshotsByMonth, ecommerceSnapshotsByMonth, whatsappSnapshotsByMonth, agregadoresSnapshotsByMonth, agregadoresZoneFilter]);

    // Calculate metrics based on selection B
    const metricsB = useMemo(() => {
        if (!isComparisonMode) return null;
        const d = activeTab === 'ecommerce' ? ecommerceDataB : activeTab === 'whatsapp' ? whatsappDataB : activeTab === 'agregadores' ? agregadoresDataB : dataB;
        const map = activeTab === 'ecommerce' ? ecommerceSnapshotsByMonth : activeTab === 'whatsapp' ? whatsappSnapshotsByMonth : activeTab === 'agregadores' ? agregadoresSnapshotsByMonth : snapshotsByMonth;
        return getMetricsForPeriod(d, selectedMonthB, selectedWeekB, map);
    }, [isComparisonMode, dataB, ecommerceDataB, whatsappDataB, agregadoresDataB, config, activeTab, selectedMonthB, selectedWeekB, snapshotsByMonth, ecommerceSnapshotsByMonth, whatsappSnapshotsByMonth, agregadoresSnapshotsByMonth, agregadoresZoneFilter]);

    // Calculate Trends: ((A - B) / B) * 100
    const trends = useMemo(() => {
        if (!metrics || !metricsB) return null;

        const calculateTrend = (valA, valB) => {
            const a = parseFloat(valA) || 0;
            const b = parseFloat(valB) || 0;
            if (b === 0) return 0;
            return ((a - b) / b) * 100;
        };

        const result = {};

        // Flatten metrics to support nested structures (like page1.kpis for whatsapp)
        if (activeTab === 'ecommerce') {
            const kpisA = metrics.kpis || {};
            const kpisB = metricsB.kpis || {};
            Object.keys(kpisA).forEach(key => {
                result[key] = calculateTrend(kpisA[key], kpisB[key]);
            });
        } else if (activeTab === 'whatsapp') {
            const kpisA = metrics.page1?.kpis || {};
            const kpisB = metricsB.page1?.kpis || {};
            Object.keys(kpisA).forEach(key => {
                result[key] = calculateTrend(kpisA[key], kpisB[key]);
            });
        } else if (activeTab === 'agregadores') {
            const kpisA = metrics.kpis || {};
            const kpisB = metricsB.kpis || {};
            Object.keys(kpisA).forEach(key => {
                result[key] = calculateTrend(kpisA[key], kpisB[key]);
            });
        } else {
            // Venta Meta
            Object.keys(metrics).forEach(key => {
                if (typeof metrics[key] === 'number' || typeof metrics[key] === 'string') {
                    result[key] = calculateTrend(metrics[key], metricsB[key]);
                }
            });
        }

        return result;
    }, [metrics, metricsB, activeTab]);

    // Redundant definitions to keep compatibility with existing render code
    const ecommerceMetrics = activeTab === 'ecommerce' ? metrics : null;
    const whatsappMetrics = activeTab === 'whatsapp' ? metrics : null;
    const agregadoresMetrics = activeTab === 'agregadores' ? metrics : null;

    const formatMonthLabel = (monthKey) => {
        const [year, month] = monthKey.split('-');
        return `${MONTH_NAMES[month]} ${year}`;
    };

    const formatWeekLabel = (dateId) => {
        const date = new Date(dateId + 'T00:00:00');
        return `Semana ${date.getDate()} ${MONTH_NAMES[String(date.getMonth() + 1).padStart(2, '0')]}`;
    };

    // Get available months from correct collection based on activeTab
    const currentSnapshotsByMonth = activeTab === 'ecommerce'
        ? ecommerceSnapshotsByMonth
        : activeTab === 'whatsapp'
            ? whatsappSnapshotsByMonth
            : activeTab === 'agregadores'
                ? agregadoresSnapshotsByMonth
                : snapshotsByMonth;
    const availableMonths = Object.keys(currentSnapshotsByMonth).sort().reverse();

    return (
        <div className={`dashboard ${isZenMode ? 'zen-mode' : ''}`}>
            {/* Dashboard Selector - Top Left (Hidden in Zen Mode) */}
            {!isZenMode && (
                <div className="dashboard-selector">
                    <button
                        className="dashboard-selector-btn"
                        onClick={() => setIsDashboardDropdownOpen(!isDashboardDropdownOpen)}
                    >
                        <span className="tab-icon">{currentDashboard?.icon}</span>
                        {currentDashboard?.label || 'Dashboard'}
                        <ChevronDown size={16} />
                    </button>

                    {isDashboardDropdownOpen && (
                        <div className="dashboard-dropdown">
                            {DASHBOARD_TABS.map(tab => (
                                <div
                                    key={tab.id}
                                    className={`dashboard-option ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => { setActiveTab(tab.id); setIsDashboardDropdownOpen(false); setIsComparisonMode(false); setSelectedMonth(null); setSelectedWeek(null); setSelectedMonthB(null); setSelectedWeekB(null); }}
                                >
                                    <span className="tab-icon">{tab.icon}</span>
                                    {tab.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Period Selectors - Bottom Left - Collapsible on Hover (Hidden in Zen Mode) */}
            {!isZenMode && (
                <div className={`period-selectors-container ${isMenuLocked ? 'locked' : ''} ${isComparisonMode ? 'comparison-active' : ''}`}>
                    <div className="period-selectors-wrapper">
                        {/* Menu Toggle Button */}
                        <div
                            className={`menu-toggle-btn ${isMenuLocked ? 'active' : ''}`}
                            onClick={() => setIsMenuLocked(!isMenuLocked)}
                        >
                            {isMenuLocked ? <X size={18} /> : <Menu size={18} />}
                        </div>

                        {/* Expandable Controls */}
                        <div className="period-selectors-content">
                            {/* Primary Period Selector */}
                            <PeriodSelector
                                label={isComparisonMode ? "Periodo A" : ""}
                                selectedMonth={selectedMonth}
                                selectedWeek={selectedWeek}
                                snapshotsByMonth={currentSnapshotsByMonth}
                                onSelectMonth={handleSelectMonth}
                                onSelectWeek={handleSelectWeek}
                                onDeleteSnapshot={handleDeleteSnapshot}
                                formatMonthLabel={formatMonthLabel}
                                formatWeekLabel={formatWeekLabel}
                                allowCurrentData={true}
                            />

                            {/* Comparison Mode Toggle - Inline */}
                            <div
                                className={`comparison-toggle-btn ${isComparisonMode ? 'active' : ''}`}
                                onClick={() => setIsComparisonMode(!isComparisonMode)}
                                title={isComparisonMode ? "Desactivar comparación" : "Comparar con otro periodo"}
                            >
                                {isComparisonMode ? '−' : '⇄'}
                            </div>

                            {/* Secondary Period Selector (Only in Comparison Mode) */}
                            {isComparisonMode && (
                                <PeriodSelector
                                    label="Periodo B"
                                    selectedMonth={selectedMonthB}
                                    selectedWeek={selectedWeekB}
                                    snapshotsByMonth={currentSnapshotsByMonth}
                                    onSelectMonth={(m) => { setSelectedMonthB(m); setSelectedWeekB(null); }}
                                    onSelectWeek={(w) => setSelectedWeekB(w)}
                                    formatMonthLabel={formatMonthLabel}
                                    formatWeekLabel={formatWeekLabel}
                                    allowCurrentData={false}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Zen Mode Toggle & Config */}
            <div className="top-right-controls" style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '10px', zIndex: 100 }}>
                {/* Zen Toggle */}
                <button
                    className="icon-btn zen-toggle"
                    onClick={() => setIsZenMode(!isZenMode)}
                    title={isZenMode ? "Salir de Zen Mode" : "Modo Zen"}
                    style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#333',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                >
                    {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>

                {/* Config (Hidden in Zen Mode) */}
                {!isZenMode && (
                    <button className="config-toggle-btn" style={{ position: 'static' }} onClick={() => setIsConfigOpen(true)} title="Configuración">
                        <Settings size={22} />
                    </button>
                )}
            </div>

            {/* Success Toast */}
            {successMessage && <div className="success-toast">{successMessage}</div>}

            {/* Config Modal */}
            {isConfigOpen && (
                <div className="config-modal-overlay" onClick={(e) => e.target.className === 'config-modal-overlay' && setIsConfigOpen(false)}>
                    <div className="config-modal">
                        <div className="config-modal-header">
                            <h2>Configuración</h2>
                            <button className="close-btn" onClick={() => setIsConfigOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="config-modal-content">
                            <FileUploader files={files} onFileChange={handleFileChange} onProcess={handleProcess} isProcessing={isProcessing} dashboardType={activeTab} />
                            <div className="divider"></div>
                            <ManualInputs config={config} onConfigChange={setConfig} />
                            <div className="divider"></div>

                            {/* Top Products Config */}
                            <div className="snapshot-section">
                                <h3 className="inputs-title">📊 Top Productos</h3>
                                <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label>Venta Meta</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={topProductsConfig.ventaMetaTopProductos}
                                            onChange={(e) => setTopProductsConfig({ ...topProductsConfig, ventaMetaTopProductos: parseInt(e.target.value) || 5 })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>E-commerce</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={topProductsConfig.ecommerceTopProductos}
                                            onChange={(e) => setTopProductsConfig({ ...topProductsConfig, ecommerceTopProductos: parseInt(e.target.value) || 6 })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>WhatsApp - Productos</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={topProductsConfig.whatsappTopProductos}
                                            onChange={(e) => setTopProductsConfig({ ...topProductsConfig, whatsappTopProductos: parseInt(e.target.value) || 5 })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>WhatsApp - Palabras</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={topProductsConfig.whatsappPalabraClave}
                                            onChange={(e) => setTopProductsConfig({ ...topProductsConfig, whatsappPalabraClave: parseInt(e.target.value) || 5 })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="divider"></div>

                            {/* Agregadores Config - only show when agregadores tab is active */}
                            {activeTab === 'agregadores' && (
                                <>
                                    <div className="snapshot-section">
                                        <h3 className="inputs-title">🚀 Configuración Agregadores</h3>
                                        <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="input-group">
                                                <label>Presupuesto Total (L)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={agregadoresConfig.presupuesto}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^\d.]/g, '');
                                                        setAgregadoresConfig({ ...agregadoresConfig, presupuesto: parseFloat(val) || 0 });
                                                    }}
                                                    placeholder="Ej: 150000"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Presupuesto Centro (L)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={agregadoresConfig.presupuestoCentro}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^\d.]/g, '');
                                                        setAgregadoresConfig({ ...agregadoresConfig, presupuestoCentro: parseFloat(val) || 0 });
                                                    }}
                                                    placeholder="TGU + Choluteca"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Presupuesto Norte (L)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={agregadoresConfig.presupuestoNorte}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^\d.]/g, '');
                                                        setAgregadoresConfig({ ...agregadoresConfig, presupuestoNorte: parseFloat(val) || 0 });
                                                    }}
                                                    placeholder="SPS + otros"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Meta Tx Total</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={agregadoresConfig.metaTx}
                                                    onChange={(e) => setAgregadoresConfig({ ...agregadoresConfig, metaTx: parseInt(e.target.value) || 0 })}
                                                    placeholder="Meta Total"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Meta Tx Centro</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={agregadoresConfig.metaTxCentro}
                                                    onChange={(e) => setAgregadoresConfig({ ...agregadoresConfig, metaTxCentro: parseInt(e.target.value) || 0 })}
                                                    placeholder="Meta Centro"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Meta Tx Norte</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={agregadoresConfig.metaTxNorte}
                                                    onChange={(e) => setAgregadoresConfig({ ...agregadoresConfig, metaTxNorte: parseInt(e.target.value) || 0 })}
                                                    placeholder="Meta Norte"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Meta Pedidos/Tienda</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={agregadoresConfig.metaPedidosPorTienda}
                                                    onChange={(e) => setAgregadoresConfig({ ...agregadoresConfig, metaPedidosPorTienda: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divider"></div>
                                </>
                            )}


                            {/* Snapshot Save Section */}
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
                                        disabled={isSaving ||
                                            (activeTab === 'ecommerce'
                                                ? (!ecommerceData || ecommerceData._isSnapshot)
                                                : activeTab === 'whatsapp'
                                                    ? (!whatsappData || whatsappData._isSnapshot)
                                                    : activeTab === 'agregadores'
                                                        ? (!agregadoresData || agregadoresData._isSnapshot)
                                                        : (!data || data._isSnapshot)
                                            )
                                        }
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

            {/* Header (Always visible) */}
            <header className="dashboard-header">
                {activeTab === 'venta-meta' && <Logo />}
                {activeTab === 'ecommerce' && (
                    <div className="logo">
                        <span className="logo-text">Venta E-commerce</span>
                        <div className="logo-icon"><img src="/PuntoFarma.png" alt="Logo" /></div>
                    </div>
                )}
                {activeTab === 'whatsapp' && (
                    <div className="logo">
                        <span className="logo-text" style={{ color: 'var(--text-primary)' }}>WhatsApp Marketing</span>
                        <div className="logo-icon"><img src="/DomiciliosPF.png" alt="Logo" /></div>
                    </div>
                )}
                {activeTab === 'agregadores' && (
                    <div className="logo">
                        <span className="logo-text" style={{ color: 'var(--text-primary)' }}>Agregadores</span>
                        <div className="logo-icon"><img src="/PuntoFarma.png" alt="Logo" /></div>
                    </div>
                )}
            </header>

            {/* Dashboard Content */}
            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando datos...</p>
                </div>
            ) : activeTab === 'ecommerce' ? (
                ecommerceMetrics ? (
                    <EcommerceDashboard metrics={ecommerceMetrics} trends={trends} topProductsCount={topProductsConfig.ecommerceTopProductos} />
                ) : (
                    <div className="empty-state">
                        <p>⚠️ No hay datos de E-commerce cargados</p>
                        <button className="process-btn" onClick={() => setIsConfigOpen(true)}>Configurar Dashboard</button>
                    </div>
                )
            ) : activeTab === 'venta-meta' ? (
                metrics ? (
                    <div className="dashboard-content">
                        <div className="dashboard-layout">
                            <div className="left-column">
                                <div className="kpi-grid-container">
                                    <TiltedCard><KPICard title="Total Venta" value={metrics.totalVenta} format="currency" suffix="" trend={trends?.totalVenta} /></TiltedCard>
                                    <TiltedCard><KPICard title="Cantidad de Pedidos" value={metrics.cantidadPedidos} format="number" trend={trends?.cantidadPedidos} /></TiltedCard>
                                    <TiltedCard><KPICard title="Venta TGU" value={metrics.ventaTGU} format="currency" trend={trends?.ventaTGU} /></TiltedCard>
                                    <TiltedCard><KPICard title="Ticket Promedio" value={metrics.ticketPromedio} format="currency" trend={trends?.ticketPromedio} /></TiltedCard>
                                    <TiltedCard><KPICard title="Venta SPS" value={metrics.ventaSPS} format="currency" suffix="" trend={trends?.ventaSPS} /></TiltedCard>
                                    <TiltedCard><KPICard title="Tasa de Conversion" value={metrics.tasaConversion} format="percent" suffix="%" trend={trends?.tasaConversion} /></TiltedCard>
                                    <div className="kpi-centered-row">
                                        <TiltedCard><KPICard title="ROAS" value={typeof metrics.roas === 'number' ? metrics.roas.toFixed(2) : metrics.roas} format="decimal" trend={trends?.roas} /></TiltedCard>
                                    </div>
                                </div>
                            </div>

                            <div className="right-column">
                                <div className="chart-wrapper">
                                    <h3 className="chart-title">Top Productos</h3>
                                    <TopProductsChart data={metrics.topProducts?.slice(0, topProductsConfig.ventaMetaTopProductos)} />
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
                )
            ) : activeTab === 'whatsapp' ? (
                whatsappMetrics ? (
                    <WhatsAppDashboard
                        metrics={whatsappMetrics}
                        trends={trends}
                        topProductsCount={topProductsConfig.whatsappTopProductos}
                        keywordCount={topProductsConfig.whatsappPalabraClave}
                    />
                ) : (
                    <div className="empty-state">
                        <p>⚠️ No hay datos de WhatsApp Marketing cargados</p>
                        <button className="process-btn" onClick={() => setIsConfigOpen(true)}>Configurar Dashboard</button>
                    </div>
                )
            ) : activeTab === 'agregadores' ? (
                agregadoresMetrics ? (
                    <AgregadoresDashboard
                        metrics={agregadoresMetrics}
                        trends={trends}
                        config={agregadoresConfig}
                        zoneFilter={agregadoresZoneFilter}
                        setZoneFilter={setAgregadoresZoneFilter}
                    />
                ) : (
                    <div className="empty-state">
                        <p>⚠️ No hay datos de Agregadores cargados</p>
                        <button className="process-btn" onClick={() => setIsConfigOpen(true)}>Configurar Dashboard</button>
                    </div>
                )
            ) : null}
        </div>
    );
};


export default Dashboard;
