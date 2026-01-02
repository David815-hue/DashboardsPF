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
import { calculateAgregadoresMetrics } from '../utils/agregadoresMetrics';

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

    // Sort by dateId descending and take the most recent snapshot
    const sorted = [...weeklySnapshots].sort((a, b) => b.dateId.localeCompare(a.dateId));
    const latestSnapshot = sorted[0];

    // For Venta Meta, topProducts and embudoData are stored inside metrics
    // For other dashboards, they might be in charts or at root level
    const metricsData = latestSnapshot.metrics || {};

    return {
        ...metricsData,
        topProducts: metricsData.topProducts || latestSnapshot.charts?.topProducts || latestSnapshot.topProducts || [],
        embudoData: metricsData.embudoData || latestSnapshot.charts?.funnelData || latestSnapshot.embudoData || []
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

    // Sort by dateId descending and take the most recent snapshot
    const sorted = [...weeklySnapshots].sort((a, b) => (b.dateId || b.id).localeCompare(a.dateId || a.id));
    const latestSnapshot = sorted[0];

    // Return metrics and charts from the latest snapshot directly
    return {
        kpis: latestSnapshot.metrics,
        charts: latestSnapshot.charts
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

    // Sort by dateId descending and take the most recent snapshot
    const sorted = [...snapshots].sort((a, b) => (b.dateId || '').localeCompare(a.dateId || ''));
    const latestSnapshot = sorted[0];

    // Return the data from the latest snapshot directly
    return {
        page1: {
            kpis: latestSnapshot.kpis,
            charts: latestSnapshot.charts
        },
        page2: {
            tablaAsesores: latestSnapshot.page2?.tablaAsesores || [],
            ventaPorPalabraClave: latestSnapshot.page2?.ventaPorPalabraClave || []
        }
    };
};

// =============================================
// AGREGADORES SNAPSHOTS (Separate Collection)
// =============================================

const AGREGADORES_COLLECTION = 'snapshots-agregadores';

/**
 * Helper to remove undefined values from an object (Firebase doesn't accept undefined)
 */
const removeUndefined = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Save Agregadores dashboard snapshot
 */
export const saveAgregadoresSnapshot = async (dateId, data) => {
    try {
        console.log('Saving Agregadores snapshot:', { dateId, data });
        const docRef = doc(db, AGREGADORES_COLLECTION, dateId);

        // Clean data to remove undefined values (Firebase doesn't accept them)
        const cleanData = removeUndefined({
            ...data,
            savedAt: new Date().toISOString(),
            dateId
        });

        await setDoc(docRef, cleanData);
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
 * @param {Array} snapshots - Array of snapshot data
 * @param {Object} config - Agregadores config with budget values
 * @param {string} zoneFilter - 'all', 'centro', or 'norte'
 */
export const calculateAgregadoresMonthlyAggregate = (snapshots, config = {}, zoneFilter = 'all') => {
    if (!snapshots || snapshots.length === 0) return null;

    // Sort by dateId descending and take the most recent snapshot
    const sorted = [...snapshots].sort((a, b) => (b.dateId || '').localeCompare(a.dateId || ''));
    const latestSnapshot = sorted[0];

    // If rawProcessedData exists, recalculate with zone filter
    if (latestSnapshot.rawProcessedData) {
        // Reconstruct the date from the stored ISO string
        const dataDate = latestSnapshot.dataMaxDate ? new Date(latestSnapshot.dataMaxDate) : null;
        return calculateAgregadoresMetrics(latestSnapshot.rawProcessedData, latestSnapshot.config || config, zoneFilter, dataDate);
    }

    // Fallback: Return kpis and charts from the latest snapshot directly
    return {
        kpis: latestSnapshot.kpis,
        charts: latestSnapshot.charts
    };
};
