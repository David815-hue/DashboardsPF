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
