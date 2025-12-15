/**
 * Calculate Agregadores (PedidosYA) metrics for dashboard display
 * @param {Object} processedData - Output from processAgregadoresData
 * @param {Object} config - Manual configuration (presupuesto, metaTx, cumplimientoTx, metaPedidosPorTienda)
 * @returns {Object} - Metrics and chart data
 */
export const calculateAgregadoresMetrics = (processedData, config = {}) => {
    const {
        ventaTotal = 0,
        cantidadTx = 0,
        topProductos = [],
        topTiendas = [],
        pedidosPorTienda = []
    } = processedData;

    const {
        presupuesto = 0,
        metaTx = 0,
        cumplimientoTx = 0,
        metaPedidosPorTienda = 30
    } = config;

    // Calculate compliance percentage
    const cumplimientoPct = presupuesto > 0 ? (ventaTotal / presupuesto) * 100 : 0;

    // Calculate prorated target (meta prorrateada)
    // Based on daily compliance - assuming 30 days in month
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const metaProrrateada = presupuesto > 0 ? (presupuesto / daysInMonth) * dayOfMonth : 0;

    // Difference from prorated target
    const diferenciaProrrateada = ventaTotal - metaProrrateada;

    // Calculate ticket promedio (average order value)
    const ticketPromedio = cantidadTx > 0 ? ventaTotal / cantidadTx : 0;

    // Prepare KPIs
    const kpis = {
        ventaTotal,
        presupuesto,
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

    // Prepare chart data - Meta por Tienda (all stores with orders)
    const metaPorTiendaChart = pedidosPorTienda.map(t => ({
        name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
        fullName: t.name,
        actual: t.pedidos,
        meta: metaPedidosPorTienda
    }));

    // Prepare chart data - Venta por Día (daily trend)
    const ventaPorDiaChart = (processedData.ventaPorDia || []).map(d => ({
        name: d.name, // Already formatted as DD/MM
        day: d.day,
        venta: d.venta,
        pedidos: d.pedidos
    }));

    // Prepare chart data - Venta por Ciudad (aggregated from topTiendas)
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
        .filter(p => p.cantidad >= 5) // Minimum 5 orders to show
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
