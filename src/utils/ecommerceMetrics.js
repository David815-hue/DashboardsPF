/**
 * Calculate E-commerce dashboard metrics
 */
export const calculateEcommerceMetrics = (data) => {
    const { pedidosConsolidado, canceladosUnicos, motivosAnulacion, topProductos } = data;

    // === KPIs ===

    // 1. Venta Total (suma de Venta RMS)
    const ventaTotal = pedidosConsolidado.reduce((sum, row) =>
        sum + (parseFloat(row['Venta RMS']) || 0), 0);

    // 2. Venta APP
    const ventaAPP = pedidosConsolidado
        .filter(row => String(row['Canal'] || '').trim() === 'APP')
        .reduce((sum, row) => sum + (parseFloat(row['Venta RMS']) || 0), 0);

    // 3. Venta Ecommerce
    const ventaEcommerce = pedidosConsolidado
        .filter(row => String(row['Canal'] || '').trim() === 'Ecommerce')
        .reduce((sum, row) => sum + (parseFloat(row['Venta RMS']) || 0), 0);

    // 4. Cantidad de Pedidos (unique)
    const cantidadPedidos = pedidosConsolidado.length;

    // 5. Ticket Promedio
    const ticketPromedio = cantidadPedidos > 0 ? ventaTotal / cantidadPedidos : 0;

    // 6. Pedidos Cancelados
    const pedidosCancelados = canceladosUnicos.length;

    // === Charts Data ===

    // Top Productos (top 6 by Quantity)
    const topProductosChart = topProductos.slice(0, 6).map(p => ({
        name: p.descripcion || p.codigo,
        value: p.cantidad, // Showing Quantity
        totalVenta: p.total
    }));

    // Venta por Ciudad (pie chart) - Exclude 'OTROS'
    const ventaPorCiudad = {};
    pedidosConsolidado.forEach(row => {
        const ciudad = String(row['Ciudad'] || 'OTROS').trim().toUpperCase();
        if (ciudad !== 'OTROS') {
            ventaPorCiudad[ciudad] = (ventaPorCiudad[ciudad] || 0) + (parseFloat(row['Venta RMS']) || 0);
        }
    });

    const ciudadData = Object.entries(ventaPorCiudad)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Motivos de Cancelación (bar chart)
    const motivosData = Object.entries(motivosAnulacion)
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
            topProductos: topProductosChart,
            ventaPorCiudad: ciudadData,
            motivosCancelacion: motivosData
        }
    };
};
