import { TIENDAS_PEDIDOSYA } from './pedidosYaProcessor';

/**
 * Zone definitions for filtering
 * Centro: Tegucigalpa D.C., Choluteca
 * Norte: SAN PEDRO SULA, PUERTO CORTES, EL PROGRESO, LA CEIBA, COMAYAGUA, JUTICALPA
 */
export const ZONA_CENTRO = ['TEGUCIGALPA D.C.', 'CHOLUTECA'];
export const ZONA_NORTE = ['SAN PEDRO SULA', 'PUERTO CORTES', 'EL PROGRESO', 'LA CEIBA', 'COMAYAGUA', 'JUTICALPA'];

/**
 * Calculate Agregadores (PedidosYA) metrics for dashboard display
 * @param {Object} processedData - Output from processPedidosYaData
 * @param {Object} config - Manual configuration (presupuesto, metaTx, cumplimientoTx, metaPedidosPorTienda)
 * @param {string} zoneFilter - 'all', 'centro', or 'norte'
 * @param {Date} dataDate - Optional date to use for MTD calculations (defaults to today)
 * @returns {Object} - Metrics and chart data
 */
export const calculateAgregadoresMetrics = (processedData, config = {}, zoneFilter = 'all', dataDate = null) => {
    const {
        ventaTotal: ventaTotalRaw = 0,
        cantidadTx: cantidadTxRaw = 0,
        topProductos: topProductosRaw = [],
        topTiendas: topTiendasRaw = [],
        pedidosPorTienda: pedidosPorTiendaRaw = [],
        rawData = []
    } = processedData;

    const {
        presupuesto = 0,
        presupuestoCentro = 0,
        presupuestoNorte = 0,
        metaTx = 0,
        metaTxCentro = 0,
        metaTxNorte = 0,
        cumplimientoTx = 0,
        metaPedidosPorTienda = 30
    } = config;

    // Determine which cities to include based on zone filter
    let allowedCities = null;
    if (zoneFilter === 'centro') {
        allowedCities = ZONA_CENTRO;
    } else if (zoneFilter === 'norte') {
        allowedCities = ZONA_NORTE;
    }

    // Select the appropriate budget based on zone filter
    const activePresupuesto = zoneFilter === 'centro' ? presupuestoCentro
        : zoneFilter === 'norte' ? presupuestoNorte
            : presupuesto;

    // Filter stores by zone
    const topTiendas = allowedCities
        ? topTiendasRaw.filter(t => allowedCities.includes(t.city?.toUpperCase()))
        : topTiendasRaw;

    const pedidosPorTienda = allowedCities
        ? pedidosPorTiendaRaw.filter(t => {
            const tienda = topTiendasRaw.find(tt => tt.name === t.name);
            return tienda && allowedCities.includes(tienda.city?.toUpperCase());
        })
        : pedidosPorTiendaRaw;

    // Recalculate metrics based on filtered stores
    const ventaTotal = allowedCities
        ? topTiendas.reduce((sum, t) => sum + (t.venta || 0), 0)
        : ventaTotalRaw;

    const cantidadTx = allowedCities
        ? topTiendas.reduce((sum, t) => sum + (t.pedidos || 0), 0)
        : cantidadTxRaw;

    // Filter products by zone if needed (recalculate from rawData)
    let topProductos = topProductosRaw;
    if (allowedCities && rawData.length > 0) {
        // Get store IDs that belong to allowed cities using TIENDAS_PEDIDOSYA
        const allowedStoreIds = Object.values(TIENDAS_PEDIDOSYA)
            .filter(info => allowedCities.includes(info.city?.toUpperCase()))
            .map(info => info.storeId);

        // Recalculate products from filtered raw data
        const filteredRows = rawData.filter(row => allowedStoreIds.includes(row._storeId));
        const productosMap = {};
        filteredRows.forEach(row => {
            // Handle both old format (single product per row) and new format (array of products)
            if (row._products && Array.isArray(row._products)) {
                // New format: products are in _products array
                row._products.forEach(product => {
                    const key = product.descripcion.toLowerCase();
                    if (!productosMap[key]) {
                        productosMap[key] = {
                            descripcion: product.descripcion,
                            cantidad: 0
                        };
                    }
                    productosMap[key].cantidad += product.cantidad || 0;
                });
            } else if (row._descripcion) {
                // Old format: single product per row
                const key = `${row._codigo}_${row._descripcion}`;
                if (!productosMap[key]) {
                    productosMap[key] = {
                        codigo: row._codigo,
                        descripcion: row._descripcion,
                        cantidad: 0,
                        total: 0
                    };
                }
                productosMap[key].cantidad += row._cantidad || 0;
                productosMap[key].total += row._total || 0;
            }
        });
        topProductos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);
    }

    // Calculate prorated target (meta prorrateada)
    // Use dataDate if provided (from file's most recent date), otherwise use today
    const referenceDate = dataDate || new Date();
    const dayOfMonth = referenceDate.getDate();
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
    const metaProrrateada = activePresupuesto > 0 ? (activePresupuesto / daysInMonth) * dayOfMonth : 0;

    console.log('[Agregadores MTD]', {
        dataDate: dataDate ? dataDate.toISOString().split('T')[0] : 'not provided (using today)',
        referenceDate: referenceDate.toISOString().split('T')[0],
        dayOfMonth,
        daysInMonth,
        metaProrrateada
    });

    // Select the appropriate Tx target based on zone filter
    const activeMetaTx = zoneFilter === 'centro' ? metaTxCentro
        : zoneFilter === 'norte' ? metaTxNorte
            : metaTx;

    // Calculate prorated Tx target
    const metaTxProrrateada = activeMetaTx > 0 ? (activeMetaTx / daysInMonth) * dayOfMonth : 0;

    // Calculate compliance percentage MTD (venta vs meta prorrateada)
    const cumplimientoPct = metaProrrateada > 0 ? (ventaTotal / metaProrrateada) * 100 : 0;

    // Calculate sales compliance MTD
    const cumplimientoTxMTDPct = metaTxProrrateada > 0 ? (cantidadTx / metaTxProrrateada) * 100 : 0;

    // Difference from prorated target
    const diferenciaProrrateada = ventaTotal - metaProrrateada;

    // Calculate ticket promedio (average order value)
    const ticketPromedio = cantidadTx > 0 ? ventaTotal / cantidadTx : 0;

    // Prepare KPIs
    const kpis = {
        ventaTotal,
        presupuesto: activePresupuesto,
        cumplimientoPct,
        metaProrrateada,
        diferenciaProrrateada,
        cantidadTx,
        ticketPromedio,
        metaTx: activeMetaTx,
        cumplimientoTx,
        cumplimientoTxMTDPct,
        metaTxProrrateada
    };

    // Prepare chart data - Top 5 Products
    const topProductosChart = topProductos.slice(0, 5).map(p => ({
        name: p.descripcion.length > 25 ? p.descripcion.substring(0, 25) + '...' : p.descripcion,
        fullName: p.descripcion,
        value: p.cantidad,
        total: p.total
    }));

    // Prepare chart data - Top 5 Stores
    const topTiendasChart = topTiendas.slice(0, 5).map(t => ({
        name: t.name,
        value: t.venta,
        pedidos: t.pedidos
    }));

    // Prepare chart data - Meta por Tienda (filtered stores)
    const metaPorTiendaChart = pedidosPorTienda.map(t => ({
        name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
        fullName: t.name,
        actual: t.pedidos,
        meta: metaPedidosPorTienda
    }));

    // Prepare chart data - Venta por Día (daily trend)
    const ventaPorDiaChart = (processedData.ventaPorDia || []).map(d => ({
        name: d.name,
        day: d.day,
        venta: d.venta,
        pedidos: d.pedidos
    }));

    // Prepare chart data - Venta por Ciudad (aggregated from filtered topTiendas)
    const ciudadAgg = {};
    topTiendas.forEach(t => {
        const city = t.city || 'Desconocida';
        if (!ciudadAgg[city]) {
            ciudadAgg[city] = { venta: 0, pedidos: 0 };
        }
        ciudadAgg[city].venta += t.venta || 0;
        ciudadAgg[city].pedidos += t.pedidos || 0;
    });

    const ventaPorCiudadChart = Object.entries(ciudadAgg)
        .map(([city, data]) => ({
            name: city,
            venta: data.venta,
            pedidos: data.pedidos
        }))
        .sort((a, b) => b.venta - a.venta);

    // Prepare chart data - ALL Products for TreeMap (min 5 orders)
    const allProductosChart = topProductos
        .filter(p => p.cantidad >= 5)
        .map(p => ({
            name: p.descripcion.length > 20 ? p.descripcion.substring(0, 20) + '...' : p.descripcion,
            fullName: p.descripcion,
            value: p.cantidad,
            total: p.total
        }));

    return {
        kpis,
        charts: {
            topProductos: topProductosChart,
            allProductos: allProductosChart,
            topTiendas: topTiendasChart,
            metaPorTienda: metaPorTiendaChart,
            ventaPorDia: ventaPorDiaChart,
            ventaPorCiudad: ventaPorCiudadChart
        }
    };
};
