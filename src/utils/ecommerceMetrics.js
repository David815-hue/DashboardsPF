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

    // === New Analysis: Payment Error Recovery ===
    // Find cancelled orders with "Error de Pago" and check if customer completed order within 2 days
    const paymentErrorRecovery = () => {
        // Get all orders from albatross (includes both cancelled and successful)
        const allOrders = data.albatross || [];

        // Helper to find key in an object - IMPROVED (same as processor)
        const findMotivoKey = (obj) => Object.keys(obj || {}).find(col => {
            const c = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
            return c.includes('motivo');
        });

        // Find the correct column name for "Motivo anulación" by scanning first 50 rows
        let motivoColumn = null;
        for (let i = 0; i < Math.min(allOrders.length, 50); i++) {
            motivoColumn = findMotivoKey(allOrders[i]);
            if (motivoColumn) break;
        }

        // Find all cancelled orders with EMPTY motivo (= Error de Pago) AND from APP/Ecommerce
        const errorPagoOrders = allOrders.filter(row => {
            const estado = String(row['Estado'] || '').trim().toLowerCase();
            const canal = String(row['Canal'] || '').trim();
            const motivo = motivoColumn ? String(row[motivoColumn] || '').trim() : '';

            const isCanceled = estado === 'pedido cancelado'; // Exact match, same as processor
            const isAppOrEcommerce = canal === 'APP' || canal === 'Ecommerce';
            const isErrorPago = motivo === '' || motivo.toLowerCase() === 'nan'; // Empty or NaN means Error de Pago

            return isCanceled && isAppOrEcommerce && isErrorPago;
        });

        // Deduplicate by 'Número de Pedido' (same as processor)
        const uniqueErrorPagoOrders = [];
        const seenOrders = new Set();

        errorPagoOrders.forEach(order => {
            const orderNum = String(order['Número de Pedido'] || '');
            if (!seenOrders.has(orderNum)) {
                seenOrders.add(orderNum);
                uniqueErrorPagoOrders.push(order);
            }
        });

        // Track ALL orders (not just unique customers)
        let recuperados = 0;
        let noRecuperados = 0;
        let sinCelular = 0;
        let sinFecha = 0;

        uniqueErrorPagoOrders.forEach(canceledOrder => {
            const celular = String(canceledOrder['Celular del cliente'] || '').trim();
            if (!celular) {
                sinCelular++;
                noRecuperados++; // Count as not recovered if no phone
                return;
            }

            // Parse the cancellation date
            const cancelDateStr = canceledOrder['Pedido Generado'];
            if (!cancelDateStr) {
                sinFecha++;
                noRecuperados++; // Count as not recovered if no date
                return;
            }

            const cancelDate = new Date(cancelDateStr);
            if (isNaN(cancelDate.getTime())) {
                sinFecha++;
                noRecuperados++; // Count as not recovered if invalid date
                return;
            }

            // Check if this customer completed an order within 2 days
            const hasRecovery = allOrders.some(successOrder => {
                const successCelular = String(successOrder['Celular del cliente'] || '').trim();
                if (successCelular !== celular) return false;

                const estado = String(successOrder['Estado'] || '').trim().toLowerCase();
                if (!estado.includes('entregado')) return false;

                const successDateStr = successOrder['Pedido Generado'];
                if (!successDateStr) return false;

                const successDate = new Date(successDateStr);
                if (isNaN(successDate.getTime())) return false;

                // Check if success order is after cancel order and within 2 days
                const diffTime = successDate - cancelDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                return diffDays > 0 && diffDays <= 2;
            });

            // Count each order individually (not unique customers)
            if (hasRecovery) {
                recuperados++;
            } else {
                noRecuperados++;
            }
        });

        // Calculate Customer Insights
        const customerMap = new Map(); // phone -> count of attempts

        uniqueErrorPagoOrders.forEach(order => {
            const celular = String(order['Celular del cliente'] || '').trim();
            if (celular) {
                customerMap.set(celular, (customerMap.get(celular) || 0) + 1);
            }
        });

        const totalClientesUnicos = customerMap.size;
        let clientesMultiplesIntentos = 0;
        let maxIntentos = 0;

        customerMap.forEach(count => {
            if (count > 1) clientesMultiplesIntentos++;
            if (count > maxIntentos) maxIntentos = count;
        });

        const avgIntentos = totalClientesUnicos > 0
            ? (uniqueErrorPagoOrders.length / totalClientesUnicos).toFixed(1)
            : 0;

        return {
            chartData: [
                { name: 'Pedidos cancelados - Cliente completó pedido', value: recuperados },
                { name: 'Pedidos cancelados - Cliente no completó pedido', value: noRecuperados }
            ],
            insights: {
                totalClientesUnicos,
                clientesMultiplesIntentos,
                avgIntentos,
                maxIntentos
            }
        };
    };

    const errorPagoRecoveryData = paymentErrorRecovery();

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
            clientesNuevosCiudad: clientesNuevosCiudadData,
            errorPagoRecovery: errorPagoRecoveryData
        }
    };
};
