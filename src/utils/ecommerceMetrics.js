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

    // Top Productos - pass more products so dashboard can sort by quantity OR sales
    const topProductosChart = topProductos.slice(0, 50).map(p => ({
        name: p.descripcion || p.codigo,
        value: p.cantidad, // Quantity (pedidos)
        totalVenta: p.total // Sales in LPS
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

    // === New Analysis: Clientes Nuevos vs Recurrentes ===
    // Column: "¿Es primera Compra?" -> "Sí" or "No"
    let clientesNuevosCount = 0;
    let clientesRecurrentesCount = 0;
    let ventaNuevos = 0;
    let ventaRecurrentes = 0;

    pedidosConsolidado.forEach(row => {
        // Find the specific column, handling potential encoding/spacing issues
        const isFirstPurchaseKey = Object.keys(row).find(k =>
            k.includes('Es primera Compra') || k.includes('primera Compra')
        );

        const isFirstPurchase = isFirstPurchaseKey ? String(row[isFirstPurchaseKey]).trim().toLowerCase() : '';
        const venta = parseFloat(row['Venta RMS']) || 0;

        if (isFirstPurchase === 'sí' || isFirstPurchase === 'si') {
            clientesNuevosCount++;
            ventaNuevos += venta;
        } else {
            // Assuming anything not "Sí" is recurring or at least not new
            clientesRecurrentesCount++;
            ventaRecurrentes += venta;
        }
    });

    const clientesNuevosData = [
        { name: 'Pedidos de nuevos clientes', value: clientesNuevosCount, venta: ventaNuevos },
        { name: 'Ordenes de clientes recurrentes', value: clientesRecurrentesCount, venta: ventaRecurrentes }
    ];

    // === City-Specific: Distribution of New Customers Only ===
    const clientesNuevosPorCiudad = {
        'TEGUCIGALPA D.C.': 0,
        'SAN PEDRO SULA': 0
    };

    pedidosConsolidado.forEach(row => {
        const ciudad = String(row['Ciudad'] || '').trim().toUpperCase();

        // Only process relevant cities
        if (clientesNuevosPorCiudad.hasOwnProperty(ciudad)) {
            // Check if it's a new customer
            const isFirstPurchaseKey = Object.keys(row).find(k =>
                k.includes('Es primera Compra') || k.includes('primera Compra')
            );
            const isFirstPurchase = isFirstPurchaseKey ? String(row[isFirstPurchaseKey]).trim().toLowerCase() : '';

            if (isFirstPurchase === 'sí' || isFirstPurchase === 'si') {
                clientesNuevosPorCiudad[ciudad]++;
            }
        }
    });

    // Format for pie chart - Distribution of new customers by city
    const clientesNuevosCiudadData = [
        { name: 'Tegucigalpa', value: clientesNuevosPorCiudad['TEGUCIGALPA D.C.'], fill: '#00C49F' },
        { name: 'San Pedro Sula', value: clientesNuevosPorCiudad['SAN PEDRO SULA'], fill: '#0088FE' }
    ];

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
            motivosCancelacion: motivosData,
            clientesNuevos: clientesNuevosData,
            clientesNuevosCiudad: clientesNuevosCiudadData
        }
    };
};
