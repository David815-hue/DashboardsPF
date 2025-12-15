import { TIENDAS_AGREGADORES } from './agregadoresProcessor';

/**
 * Zone definitions for filtering
 * Centro: Tegucigalpa D.C., Choluteca
 * Norte: SAN PEDRO SULA, PUERTO CORTES, EL PROGRESO, LA CEIBA, COMAYAGUA, JUTICALPA
 */
export const ZONA_CENTRO = ['TEGUCIGALPA D.C.', 'CHOLUTECA'];
export const ZONA_NORTE = ['SAN PEDRO SULA', 'PUERTO CORTES', 'EL PROGRESO', 'LA CEIBA', 'COMAYAGUA', 'JUTICALPA'];

/**
 * Calculate Agregadores (PedidosYA) metrics for dashboard display
 * @param {Object} processedData - Output from processAgregadoresData
 * @param {Object} config - Manual configuration (presupuesto, metaTx, cumplimientoTx, metaPedidosPorTienda)
 * @param {string} zoneFilter - 'all', 'centro', or 'norte'
 * @returns {Object} - Metrics and chart data
 */
export const calculateAgregadoresMetrics = (processedData, config = {}, zoneFilter = 'all') => {
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
        // Use already imported TIENDAS_AGREGADORES
        const allowedStoreIds = Object.entries(TIENDAS_AGREGADORES)
            .filter(([id, info]) => allowedCities.includes(info.city?.toUpperCase()))
            .map(([id]) => parseInt(id));

        // Recalculate products from filtered raw data
        const filteredRows = rawData.filter(row => allowedStoreIds.includes(row._storeId));
        const productosMap = {};
        filteredRows.forEach(row => {
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
        });
        topProductos = Object.values(productosMap).sort((a, b) => b.cantidad - a.cantidad);
    }

    // Calculate compliance percentage using zone-specific budget
    const cumplimientoPct = activePresupuesto > 0 ? (ventaTotal / activePresupuesto) * 100 : 0;

    // Calculate prorated target (meta prorrateada)
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const metaProrrateada = activePresupuesto > 0 ? (activePresupuesto / daysInMonth) * dayOfMonth : 0;

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
        metaTx,
        cumplimientoTx
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
