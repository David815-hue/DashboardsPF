export const calculateMetrics = (data, inputs) => {
    const { pedidos, simlaFiltradoCount, simlaFiltrado } = data;
    const { inversionUSD, clics, topProductsCount = 5 } = inputs;
    const TIPO_CAMBIO = 26.42;

    // 1. Total Venta
    const totalVenta = pedidos.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);

    // 2. Cantidad de Pedidos
    const cantidadPedidos = pedidos.length;

    // 3. Venta TGU
    const ventaTGU = pedidos
        .filter(row => String(row['Ciudad'] || '').toUpperCase() === 'TEGUCIGALPA D.C.')
        .reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);

    // 4. Venta SPS
    const ventaSPS = pedidos
        .filter(row => String(row['Ciudad'] || '').toUpperCase() === 'SAN PEDRO SULA')
        .reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);

    // 5. Ticket Promedio
    const ticketPromedio = cantidadPedidos > 0 ? totalVenta / cantidadPedidos : 0;

    // 6. Tasa de Conversión
    // Formula: Cantidad de Pedidos / leads relevantes (simlaFiltradoCount)
    const tasaConversion = simlaFiltradoCount > 0 ? (cantidadPedidos / simlaFiltradoCount) * 100 : 0;

    // 7. ROAS
    // Formula: (Total Venta / 26.42) / Inversion USD
    const totalVentaUSD = totalVenta / TIPO_CAMBIO;
    const roas = inversionUSD > 0 ? totalVentaUSD / inversionUSD : 0;

    // --- Charts Data ---

    // Top Products
    const productCounts = {};
    pedidos.forEach(row => {
        // Exclude 'RECARGO SERVICIO A DOMICILIO' per python script
        const desc = String(row['Descripcion'] || '');
        if (!desc.toLowerCase().includes('recargo servicio a domicilio')) {
            productCounts[desc] = (productCounts[desc] || 0) + 1;
        }
    });

    const topProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topProductsCount);

    // Funnel
    // Clics (Manual) -> Conversaciones (Simla Filtrado) -> Ventas (Pedidos Matcheados)
    const conversionesCount = simlaFiltradoCount; // Conversaciones
    const ventasCount = cantidadPedidos; // Ventas

    const funnelData = [
        { name: 'Clics', value: clics, fill: '#67e8f9' }, // Cyan-400
        { name: 'Conversaciones', value: conversionesCount, fill: '#22d3ee' }, // Cyan-500
        { name: 'Ventas', value: ventasCount, fill: '#06b6d4' } // Cyan-600
    ];

    return {
        kpis: {
            totalVenta,
            cantidadPedidos,
            ventaTGU,
            ventaSPS,
            ticketPromedio,
            tasaConversion,
            roas
        },
        charts: {
            topProducts,
            funnelData
        }
    };
};
