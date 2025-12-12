import { db } from './config';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    deleteDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'snapshots';

/**
 * Save a dashboard snapshot with a specific date
 * @param {string} dateId - Date in YYYY-MM-DD format
 * @param {object} data - Dashboard data (metrics, config, etc.)
 */
export const saveSnapshot = async (dateId, data) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, dateId);
        await setDoc(docRef, {
            ...data,
            savedAt: new Date().toISOString(),
            dateId
        });
        console.log('Snapshot saved:', dateId);
        return { success: true };
    } catch (error) {
        console.error('Error saving snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load a specific snapshot by date
 * @param {string} dateId - Date in YYYY-MM-DD format
 */
export const loadSnapshot = async (dateId) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, dateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'Snapshot not found' };
        }
    } catch (error) {
        console.error('Error loading snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all available snapshots (for the dropdown)
 */
export const getAllSnapshots = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('dateId', 'desc'));
        const querySnapshot = await getDocs(q);

        const snapshots = [];
        querySnapshot.forEach((doc) => {
            snapshots.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return { success: true, data: snapshots };
    } catch (error) {
        console.error('Error getting snapshots:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a snapshot
 * @param {string} dateId - Date in YYYY-MM-DD format
 */
export const deleteSnapshot = async (dateId) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, dateId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get snapshots grouped by month
 */
export const getSnapshotsByMonth = async () => {
    const result = await getAllSnapshots();
    if (!result.success) return result;

    const grouped = {};
    result.data.forEach(snapshot => {
        const monthKey = snapshot.dateId.substring(0, 7); // YYYY-MM
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(snapshot);
    });

    return { success: true, data: grouped };
};

/**
 * Calculate aggregated metrics for a month (sum of all weeks)
 * @param {Array} weeklySnapshots - Array of weekly snapshots for the month
 */
export const calculateMonthlyAggregate = (weeklySnapshots) => {
    if (!weeklySnapshots || weeklySnapshots.length === 0) return null;

    let totalVenta = 0;
    let cantidadPedidos = 0;
    let ventaTGU = 0;
    let ventaSPS = 0;
    let totalClics = 0;
    let totalConversaciones = 0;
    let totalInversion = 0;

    const productCountsMap = {};

    weeklySnapshots.forEach(snap => {
        const m = snap.metrics;
        if (m) {
            totalVenta += m.totalVenta || 0;
            cantidadPedidos += m.cantidadPedidos || 0;
            ventaTGU += m.ventaTGU || 0;
            ventaSPS += m.ventaSPS || 0;

            if (m.embudoData) {
                m.embudoData.forEach(item => {
                    if (item.name === 'Clics') totalClics += item.value || 0;
                    if (item.name === 'Conversaciones') totalConversaciones += item.value || 0;
                });
            }

            if (m.topProducts) {
                m.topProducts.forEach(p => {
                    productCountsMap[p.name] = (productCountsMap[p.name] || 0) + p.count;
                });
            }
        }

        if (snap.config) {
            totalInversion += snap.config.inversionUSD || 0;
        }
    });

    const ticketPromedio = cantidadPedidos > 0 ? totalVenta / cantidadPedidos : 0;
    const tasaConversion = totalConversaciones > 0 ? (cantidadPedidos / totalConversaciones) * 100 : 0;
    const roas = totalInversion > 0 ? (totalVenta / 26.42) / totalInversion : 0;

    const topProducts = Object.entries(productCountsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const embudoData = [
        { name: 'Clics', value: totalClics, fill: '#67e8f9' },
        { name: 'Conversaciones', value: totalConversaciones, fill: '#22d3ee' },
        { name: 'Ventas', value: cantidadPedidos, fill: '#06b6d4' }
    ];

    return {
        totalVenta,
        cantidadPedidos,
        ventaTGU,
        ventaSPS,
        ticketPromedio,
        tasaConversion,
        roas,
        topProducts,
        embudoData
    };
};

// =============================================
// E-COMMERCE SNAPSHOTS (Separate Collection)
// =============================================

const ECOMMERCE_COLLECTION = 'snapshots-ecommerce';

/**
 * Save E-commerce dashboard snapshot
 */
export const saveEcommerceSnapshot = async (dateId, data) => {
    try {
        const docRef = doc(db, ECOMMERCE_COLLECTION, dateId);
        await setDoc(docRef, {
            ...data,
            savedAt: new Date().toISOString(),
            dateId
        });
        console.log('E-commerce snapshot saved:', dateId);
        return { success: true };
    } catch (error) {
        console.error('Error saving e-commerce snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load an E-commerce snapshot
 */
export const loadEcommerceSnapshot = async (dateId) => {
    try {
        const docRef = doc(db, ECOMMERCE_COLLECTION, dateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'E-commerce snapshot not found' };
        }
    } catch (error) {
        console.error('Error loading e-commerce snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all E-commerce snapshots
 */
export const getAllEcommerceSnapshots = async () => {
    try {
        const q = query(collection(db, ECOMMERCE_COLLECTION), orderBy('dateId', 'desc'));
        const querySnapshot = await getDocs(q);

        const snapshots = [];
        querySnapshot.forEach((docItem) => {
            snapshots.push({
                id: docItem.id,
                ...docItem.data()
            });
        });

        return { success: true, data: snapshots };
    } catch (error) {
        console.error('Error getting e-commerce snapshots:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete an E-commerce snapshot
 */
export const deleteEcommerceSnapshot = async (dateId) => {
    try {
        await deleteDoc(doc(db, ECOMMERCE_COLLECTION, dateId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting e-commerce snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get E-commerce snapshots grouped by month
 */
export const getEcommerceSnapshotsByMonth = async () => {
    const result = await getAllEcommerceSnapshots();
    if (!result.success) return result;

    const grouped = {};
    result.data.forEach(snapshot => {
        const monthKey = snapshot.dateId.substring(0, 7); // YYYY-MM
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(snapshot);
    });

    return { success: true, data: grouped };
};

/**
 * Calculate aggregated metrics for E-commerce monthly data
 */
export const calculateEcommerceMonthlyAggregate = (weeklySnapshots) => {
    if (!weeklySnapshots || weeklySnapshots.length === 0) return null;

    let ventaTotal = 0;
    let ventaAPP = 0;
    let ventaEcommerce = 0;
    let cantidadPedidos = 0;
    let pedidosCancelados = 0;

    const productCounts = {};
    const ciudadTotals = {};
    const motivosCounts = {};

    weeklySnapshots.forEach(snap => {
        const m = snap.metrics;
        if (m) {
            ventaTotal += m.ventaTotal || 0;
            ventaAPP += m.ventaAPP || 0;
            ventaEcommerce += m.ventaEcommerce || 0;
            cantidadPedidos += m.cantidadPedidos || 0;
            pedidosCancelados += m.pedidosCancelados || 0;
        }

        const charts = snap.charts;
        if (charts) {
            // Aggregate top products
            if (charts.topProductos) {
                charts.topProductos.forEach(p => {
                    productCounts[p.name] = (productCounts[p.name] || 0) + p.value;
                });
            }
            // Aggregate city sales
            if (charts.ventaPorCiudad) {
                charts.ventaPorCiudad.forEach(c => {
                    ciudadTotals[c.name] = (ciudadTotals[c.name] || 0) + c.value;
                });
            }
            // Aggregate cancellation reasons
            if (charts.motivosCancelacion) {
                charts.motivosCancelacion.forEach(m => {
                    motivosCounts[m.name] = (motivosCounts[m.name] || 0) + m.value;
                });
            }
        }
    });

    const ticketPromedio = cantidadPedidos > 0 ? ventaTotal / cantidadPedidos : 0;

    const topProductos = Object.entries(productCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    const ventaPorCiudad = Object.entries(ciudadTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const motivosCancelacion = Object.entries(motivosCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        kpis: {
            ventaTotal,
            ventaAPP,
            ventaEcommerce,
            cantidadPedidos,
            ticketPromedio,
            pedidosCancelados
        },
        charts: {
            topProductos,
            ventaPorCiudad,
            motivosCancelacion
        }
    };
};

// =============================================
// WHATSAPP MARKETING SNAPSHOTS (Separate Collection)
// =============================================

const WHATSAPP_COLLECTION = 'snapshots-whatsapp';

/**
 * Save WhatsApp Marketing dashboard snapshot
 */
export const saveWhatsAppSnapshot = async (dateId, data) => {
    try {
        console.log('Saving WhatsApp snapshot:', { dateId, data });
        const docRef = doc(db, WHATSAPP_COLLECTION, dateId);
        await setDoc(docRef, {
            ...data,
            savedAt: new Date().toISOString(),
            dateId
        });
        console.log('WhatsApp snapshot saved successfully');
        return { success: true };
    } catch (error) {
        console.error('Error saving WhatsApp snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load WhatsApp Marketing snapshot by date
 */
export const loadWhatsAppSnapshot = async (dateId) => {
    try {
        const docRef = doc(db, WHATSAPP_COLLECTION, dateId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, error: 'No existe' };
    } catch (error) {
        console.error('Error loading WhatsApp snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all WhatsApp snapshots organized by month
 */
export const getWhatsAppSnapshotsByMonth = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, WHATSAPP_COLLECTION));
        const byMonth = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateId = docSnap.id;
            const monthKey = dateId.substring(0, 7);

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = [];
            }
            byMonth[monthKey].push({ dateId, ...data });
        });

        Object.keys(byMonth).forEach(month => {
            byMonth[month].sort((a, b) => a.dateId.localeCompare(b.dateId));
        });

        return byMonth;
    } catch (error) {
        console.error('Error getting WhatsApp snapshots:', error);
        return {};
    }
};

/**
 * Delete WhatsApp snapshot
 */
export const deleteWhatsAppSnapshot = async (dateId) => {
    try {
        await deleteDoc(doc(db, WHATSAPP_COLLECTION, dateId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting WhatsApp snapshot:', error);
        return { success: false, error: error.message };
    }
};

export const calculateWhatsAppMonthlyAggregate = (snapshots) => {
    if (!snapshots || snapshots.length === 0) return null;

    let totalVenta = 0;
    let cantidadVenta = 0;

    // Weighted Average Denominators/Numerators
    let totalEnvios = 0;
    let totalEnviosTGU = 0;
    let totalEnviosSPS = 0;
    let totalInversionUSD = 0;

    // Regional Totals
    let totalVentaTGU = 0;
    let totalVentaSPS = 0;
    let cantidadVentaTGU = 0;
    let cantidadVentaSPS = 0;
    let totalConversaciones = 0; // For response rate if tracked

    // Merged Tables
    const asesorMap = {};
    const palabraClaveMap = {};
    const productCounts = {};
    const ciudadTotals = {};
    const campanaTotals = {};

    snapshots.forEach(snap => {
        // --- 1. Accumulate Config Inputs (for Rates) ---
        const config = snap.config || {};
        totalEnvios += config.totalEnvios || 0;
        totalEnviosTGU += config.enviosTGU || 0;
        totalEnviosSPS += config.enviosSPS || 0;
        totalInversionUSD += config.inversionUSD || 0;

        // --- 2. Accumulate KPIs ---
        const kpis = snap.kpis || {};
        totalVenta += kpis.totalVenta || 0;
        cantidadVenta += kpis.cantidadVenta || 0;

        totalVentaTGU += kpis.totalVentaTGU || 0;
        totalVentaSPS += kpis.totalVentaSPS || 0;

        // Approximate counts based on snapshot data if specific counts aren't saved
        // (Assuming conversion rates were correct, we can back-calculate or just use what we have)
        // Ideally we would save cantidadVentaTGU/SPS in snapshot. If not available, we can't perfectly calc weighted avg for TGU/SPS ticket
        // But we can try to infer or just sum what we can. 
        // NOTE: Standard KPIs don't have 'cantidadVentaTGU', so we might have to rely on ticket avg * count? 
        // Actually, if we have ticket and value, count = value / ticket.
        if (kpis.ticketPromedioTGU > 0) cantidadVentaTGU += Math.round(kpis.totalVentaTGU / kpis.ticketPromedioTGU);
        if (kpis.ticketPromedioSPS > 0) cantidadVentaSPS += Math.round(kpis.totalVentaSPS / kpis.ticketPromedioSPS);

        // --- 3. Merge Charts ---
        const charts = snap.charts || {};
        if (charts.topProductos) {
            charts.topProductos.forEach(p => {
                productCounts[p.name] = (productCounts[p.name] || 0) + p.value;
            });
        }
        if (charts.ventaPorCiudad) {
            charts.ventaPorCiudad.forEach(c => {
                ciudadTotals[c.name] = (ciudadTotals[c.name] || 0) + c.value;
            });
        }
        if (charts.ventaPorCampana) {
            charts.ventaPorCampana.forEach(c => {
                campanaTotals[c.name] = (campanaTotals[c.name] || 0) + c.value;
            });
        }

        // --- 4. Merge Page 2 Tables ---
        const page2 = snap.page2 || {};

        // Asesores
        if (page2.tablaAsesores) {
            page2.tablaAsesores.forEach(row => {
                const asesor = row.asesor;
                if (!asesorMap[asesor]) {
                    asesorMap[asesor] = {
                        pedidosMkt: 0,
                        ventaMkt: 0,
                        pedidosFarma: 0,
                        ventaFarma: 0,
                        totalVenta: 0,
                        pedidos: 0 // derived for ticket
                    };
                }
                asesorMap[asesor].pedidosMkt += row.pedidosMkt || 0;
                asesorMap[asesor].ventaMkt += row.ventaMkt || 0;
                asesorMap[asesor].pedidosFarma += row.pedidosFarma || 0;
                asesorMap[asesor].ventaFarma += row.ventaFarma || 0;
                asesorMap[asesor].totalVenta += row.totalVenta || 0;
                // row.ticketPromedio is average, so we need to reconstruct count to re-average
                // Count = TotalVenta / Ticket. Or just sum pedidosMkt + pedidosFarma if those are accurate counts
                const totalPedidosRow = (row.pedidosMkt || 0) + (row.pedidosFarma || 0);
                asesorMap[asesor].pedidos += totalPedidosRow;
            });
        }

        // Palabras Clave
        if (page2.ventaPorPalabraClave) {
            page2.ventaPorPalabraClave.forEach(item => {
                palabraClaveMap[item.name] = (palabraClaveMap[item.name] || 0) + item.value;
            });
        }
    });

    // --- 5. Calculate Weighted Averages ---

    // Main Rates
    const ticketPromedio = cantidadVenta > 0 ? totalVenta / cantidadVenta : 0;
    const tasaConversion = totalEnvios > 0 ? (cantidadVenta / totalEnvios) * 100 : 0;

    // ROAS = Total Venta (USD) / Inversion (USD)
    // Assuming totalVenta is Lps, we need exchange rate. 
    // We can use an average exchange rate or just take the sum of (Venta/TipoCambio) from each week?
    // Simpler: use the last week's exchange rate or an average? 
    // Better: We track Inversion USD directly. We need Venta USD.
    // Let's approximate Venta USD using a fixed rate or the one from the last snapshot?
    // Precise way: Snapshots should ideally store 'TotalVentaUSD'.
    // Failure fallback: Use 26.41 as standard if not available.
    const exchangeRate = 26.41;
    const totalVentaUSD = totalVenta / exchangeRate;
    const roas = totalInversionUSD > 0 ? totalVentaUSD / totalInversionUSD : 0;

    // Regional Rates
    const ticketPromedioTGU = cantidadVentaTGU > 0 ? totalVentaTGU / cantidadVentaTGU : 0;
    const ticketPromedioSPS = cantidadVentaSPS > 0 ? totalVentaSPS / cantidadVentaSPS : 0;
    const tasaConversionTGU = totalEnviosTGU > 0 ? (cantidadVentaTGU / totalEnviosTGU) * 100 : 0;
    const tasaConversionSPS = totalEnviosSPS > 0 ? (cantidadVentaSPS / totalEnviosSPS) * 100 : 0;

    // --- 6. Format Collections ---

    const topProductos = Object.entries(productCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    const ventaPorCiudad = Object.entries(ciudadTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const ventaPorCampana = Object.entries(campanaTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const tablaAsesores = Object.entries(asesorMap)
        .map(([asesor, data]) => ({
            asesor,
            pedidosMkt: data.pedidosMkt,
            ventaMkt: data.ventaMkt,
            pedidosFarma: data.pedidosFarma,
            ventaFarma: data.ventaFarma,
            totalVenta: data.totalVenta,
            ticketPromedio: data.pedidos > 0 ? data.totalVenta / data.pedidos : 0
        }))
        .sort((a, b) => b.totalVenta - a.totalVenta);

    const ventaPorPalabraClave = Object.entries(palabraClaveMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        page1: {
            kpis: {
                totalVenta,
                cantidadVenta,
                ticketPromedio,
                roas,
                tasaConversion,
                totalVentaTGU,
                totalVentaSPS,
                ticketPromedioTGU,
                ticketPromedioSPS,
                tasaConversionTGU,
                tasaConversionSPS,
                tasaRespuesta: 0 // Difficult to calc without explicit conversation counts per week
            },
            charts: {
                topProductos,
                ventaPorCiudad,
                ventaPorCampana
            }
        },
        page2: {
            tablaAsesores,
            ventaPorPalabraClave
        }
    };
};

// =============================================
// AGREGADORES SNAPSHOTS (Separate Collection)
// =============================================

const AGREGADORES_COLLECTION = 'snapshots-agregadores';

/**
 * Save Agregadores dashboard snapshot
 */
export const saveAgregadoresSnapshot = async (dateId, data) => {
    try {
        console.log('Saving Agregadores snapshot:', { dateId, data });
        const docRef = doc(db, AGREGADORES_COLLECTION, dateId);
        await setDoc(docRef, {
            ...data,
            savedAt: new Date().toISOString(),
            dateId
        });
        console.log('Agregadores snapshot saved successfully');
        return { success: true };
    } catch (error) {
        console.error('Error saving Agregadores snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load Agregadores snapshot by date
 */
export const loadAgregadoresSnapshot = async (dateId) => {
    try {
        const docRef = doc(db, AGREGADORES_COLLECTION, dateId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, error: 'No existe' };
    } catch (error) {
        console.error('Error loading Agregadores snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all Agregadores snapshots organized by month
 */
export const getAgregadoresSnapshotsByMonth = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, AGREGADORES_COLLECTION));
        const byMonth = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateId = docSnap.id;
            const monthKey = dateId.substring(0, 7);

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = [];
            }
            byMonth[monthKey].push({ dateId, ...data });
        });

        Object.keys(byMonth).forEach(month => {
            byMonth[month].sort((a, b) => a.dateId.localeCompare(b.dateId));
        });

        return byMonth;
    } catch (error) {
        console.error('Error getting Agregadores snapshots:', error);
        return {};
    }
};

/**
 * Delete Agregadores snapshot
 */
export const deleteAgregadoresSnapshot = async (dateId) => {
    try {
        await deleteDoc(doc(db, AGREGADORES_COLLECTION, dateId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting Agregadores snapshot:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate Agregadores monthly aggregate from snapshots
 */
export const calculateAgregadoresMonthlyAggregate = (snapshots) => {
    if (!snapshots || snapshots.length === 0) return null;

    let ventaTotal = 0;
    let cantidadTx = 0;
    let presupuestoTotal = 0;
    let metaPedidosPorTienda = 30; // Default

    // Merged chart data
    const productCounts = {};
    const tiendaTotals = {};
    const ventaPorDiaMap = {};
    const metaPorTiendaMap = {};

    // Track latest snapshot date for metaProrrateada calc
    let latestSnapshotDate = null;

    snapshots.forEach(snap => {
        // Track config
        const config = snap.config || {};
        if (config.metaPedidosPorTienda) {
            metaPedidosPorTienda = config.metaPedidosPorTienda;
        }

        // Track latest date
        if (snap.snapshotDate || snap.dateId) {
            const snapDate = snap.snapshotDate || snap.dateId;
            if (!latestSnapshotDate || snapDate > latestSnapshotDate) {
                latestSnapshotDate = snapDate;
            }
        }

        // Accumulate KPIs
        const kpis = snap.kpis || {};
        ventaTotal += kpis.ventaTotal || 0;
        cantidadTx += kpis.cantidadTx || 0;
        presupuestoTotal += kpis.presupuesto || 0;

        // Merge charts
        const charts = snap.charts || {};

        // Top Products
        if (charts.topProductos) {
            charts.topProductos.forEach(p => {
                const key = p.fullName || p.name;
                if (!productCounts[key]) {
                    productCounts[key] = { value: 0, total: 0 };
                }
                productCounts[key].value += p.value || 0;
                productCounts[key].total += p.total || 0;
            });
        }

        // Top Tiendas
        if (charts.topTiendas) {
            charts.topTiendas.forEach(t => {
                if (!tiendaTotals[t.name]) {
                    tiendaTotals[t.name] = { venta: 0, pedidos: 0 };
                }
                tiendaTotals[t.name].venta += t.value || 0;
                tiendaTotals[t.name].pedidos += t.pedidos || 0;
            });
        }

        // Meta por Tienda - aggregate pedidos per store
        if (charts.metaPorTienda) {
            charts.metaPorTienda.forEach(t => {
                const key = t.fullName || t.name;
                if (!metaPorTiendaMap[key]) {
                    metaPorTiendaMap[key] = { actual: 0 };
                }
                metaPorTiendaMap[key].actual += t.actual || 0;
            });
        }

        // Venta por Día
        if (charts.ventaPorDia) {
            charts.ventaPorDia.forEach(d => {
                const key = d.name;
                if (!ventaPorDiaMap[key]) {
                    ventaPorDiaMap[key] = { day: d.day, venta: 0, pedidos: 0 };
                }
                ventaPorDiaMap[key].venta += d.venta || 0;
                ventaPorDiaMap[key].pedidos += d.pedidos || 0;
            });
        }
    });

    // Calculate derived KPIs
    const ticketPromedio = cantidadTx > 0 ? ventaTotal / cantidadTx : 0;
    const cumplimientoPct = presupuestoTotal > 0 ? (ventaTotal / presupuestoTotal) * 100 : 0;

    // Calculate metaProrrateada based on latest snapshot date or today
    let metaProrrateada = 0;
    let diferenciaProrrateada = 0;
    if (latestSnapshotDate && presupuestoTotal > 0) {
        const date = new Date(latestSnapshotDate + 'T00:00:00');
        const dayOfMonth = date.getDate();
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        metaProrrateada = (presupuestoTotal / daysInMonth) * dayOfMonth;
        diferenciaProrrateada = ventaTotal - metaProrrateada;
    }

    // Format chart data
    const topProductos = Object.entries(productCounts)
        .map(([name, data]) => ({
            name: name.length > 25 ? name.substring(0, 25) + '...' : name,
            fullName: name,
            value: data.value,
            total: data.total
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const topTiendas = Object.entries(tiendaTotals)
        .map(([name, data]) => ({
            name,
            value: data.venta,
            pedidos: data.pedidos
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Meta por Tienda with aggregated data
    const metaPorTienda = Object.entries(metaPorTiendaMap)
        .map(([name, data]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            fullName: name,
            actual: data.actual,
            meta: metaPedidosPorTienda * snapshots.length // Meta scales with number of weeks
        }))
        .sort((a, b) => b.actual - a.actual);

    const ventaPorDia = Object.entries(ventaPorDiaMap)
        .map(([name, data]) => ({
            name,
            day: data.day,
            venta: data.venta,
            pedidos: data.pedidos
        }))
        .sort((a, b) => String(a.day || '').localeCompare(String(b.day || '')));

    return {
        kpis: {
            ventaTotal,
            presupuesto: presupuestoTotal,
            cumplimientoPct,
            cantidadTx,
            ticketPromedio,
            metaProrrateada,
            diferenciaProrrateada,
            metaTx: 0,
            cumplimientoTx: 0
        },
        charts: {
            topProductos,
            topTiendas,
            metaPorTienda,
            ventaPorDia
        }
    };
};
