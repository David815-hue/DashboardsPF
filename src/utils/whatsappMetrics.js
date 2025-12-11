/**
 * Calculate WhatsApp Marketing dashboard metrics
 * Page 1: KPIs, Top Products, Pie charts
 * Page 2: Asesor table, Palabra Clave chart
 */
export const calculateWhatsAppMetrics = (data, config = {}) => {
    const { pedidosDetalle, topProductos, noMatch, totalConversaciones } = data;

    // Config defaults
    const tipoCambio = config.tipoCambio || 26.41;
    const costoEnvioLps = config.costoEnvioLps || 2.11;
    const totalEnvios = config.totalEnvios || totalConversaciones;
    const enviosTGU = config.enviosTGU || 74;
    const enviosSPS = config.enviosSPS || 20;

    // === PAGE 1 KPIs ===

    // Total Venta
    const totalVenta = pedidosDetalle.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);

    // Cantidad Venta (unique pedidos)
    const cantidadVenta = pedidosDetalle.length;

    // Ticket Promedio
    const ticketPromedio = cantidadVenta > 0 ? totalVenta / cantidadVenta : 0;

    // Tasa Conversión
    const tasaConversion = totalEnvios > 0 ? (cantidadVenta / totalEnvios) * 100 : 0;

    // ROAS
    const costoEnvioUSD = costoEnvioLps / tipoCambio;
    const totalVentasUSD = totalVenta / tipoCambio;
    const inversionUSD = costoEnvioUSD * totalEnvios;
    const roas = inversionUSD > 0 ? totalVentasUSD / inversionUSD : 0;

    // Tasa de Respuesta (pedidos matcheados / total conversaciones)
    const tasaRespuesta = totalConversaciones > 0 ? (cantidadVenta / totalConversaciones) * 100 : 0;

    // === By Campaña ===
    const pedidosFarma = pedidosDetalle.filter(p => (p['Campaña'] || '').toLowerCase().includes('farmacovigilancia'));
    const pedidosMkt = pedidosDetalle.filter(p => (p['Campaña'] || '').toLowerCase().includes('marketing'));

    const ventaFarmacovigilancia = pedidosFarma.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);
    const ventaMarketing = pedidosMkt.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);
    const pedidosFarmaCount = pedidosFarma.length;
    const pedidosMktCount = pedidosMkt.length;

    // === By Ciudad ===
    const pedidosTGU = pedidosDetalle.filter(p => (p['Ciudad'] || '').includes('TEGUCIGALPA'));
    const pedidosSPS = pedidosDetalle.filter(p => (p['Ciudad'] || '').includes('SAN PEDRO SULA'));

    const totalVentaTGU = pedidosTGU.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);
    const totalVentaSPS = pedidosSPS.reduce((sum, row) => sum + (parseFloat(row['Total']) || 0), 0);

    const ticketPromedioTGU = pedidosTGU.length > 0 ? totalVentaTGU / pedidosTGU.length : 0;
    const ticketPromedioSPS = pedidosSPS.length > 0 ? totalVentaSPS / pedidosSPS.length : 0;

    const tasaConversionTGU = enviosTGU > 0 ? (pedidosTGU.length / enviosTGU) * 100 : 0;
    const tasaConversionSPS = enviosSPS > 0 ? (pedidosSPS.length / enviosSPS) * 100 : 0;

    // === Charts Data ===

    // Venta por Ciudad (pie)
    const ventaPorCiudad = [
        { name: 'TEGUCIGALPA D.C.', value: totalVentaTGU },
        { name: 'SAN PEDRO SULA', value: totalVentaSPS }
    ].filter(c => c.value > 0);

    // Venta por Campaña (pie)
    const ventaPorCampana = [
        { name: 'Venta Farmacovigilancia', value: ventaFarmacovigilancia },
        { name: 'Venta Marketing', value: ventaMarketing }
    ].filter(c => c.value > 0);

    // Top Productos (top 6)
    const topProductosChart = topProductos.slice(0, 6);

    // === PAGE 2: By Asesor ===
    const asesorMap = {};
    pedidosDetalle.forEach(row => {
        const asesor = row['Asesor'] || 'Sin Asesor';
        if (!asesorMap[asesor]) {
            asesorMap[asesor] = {
                pedidosMkt: 0,
                ventaMkt: 0,
                pedidosFarma: 0,
                ventaFarma: 0,
                totalVenta: 0,
                pedidos: 0
            };
        }
        const campana = (row['Campaña'] || '').toLowerCase();
        const total = parseFloat(row['Total']) || 0;

        asesorMap[asesor].totalVenta += total;
        asesorMap[asesor].pedidos += 1;

        if (campana.includes('marketing')) {
            asesorMap[asesor].pedidosMkt += 1;
            asesorMap[asesor].ventaMkt += total;
        } else if (campana.includes('farmacovigilancia')) {
            asesorMap[asesor].pedidosFarma += 1;
            asesorMap[asesor].ventaFarma += total;
        }
    });

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

    // Venta por Palabra Clave (bar chart)
    const palabraClaveMap = {};
    pedidosDetalle.forEach(row => {
        const pc = row['PalabraClave'] || 'Sin Palabra';
        palabraClaveMap[pc] = (palabraClaveMap[pc] || 0) + 1;
    });

    const ventaPorPalabraClave = Object.entries(palabraClaveMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
        page1: {
            kpis: {
                totalVenta,
                tasaConversion,
                ticketPromedio,
                roas,
                totalVentaTGU,
                tasaConversionTGU,
                ticketPromedioTGU,
                cantidadVenta,
                totalVentaSPS,
                tasaConversionSPS,
                ticketPromedioSPS,
                tasaRespuesta
            },
            charts: {
                topProductos: topProductosChart,
                ventaPorCiudad,
                ventaPorCampana
            }
        },
        page2: {
            tablaAsesores,
            ventaPorPalabraClave
        },
        // For Firebase snapshot
        summary: {
            totalVenta,
            cantidadVenta,
            ventaFarmacovigilancia,
            ventaMarketing,
            pedidosFarmaCount,
            pedidosMktCount,
            roas
        }
    };
};
