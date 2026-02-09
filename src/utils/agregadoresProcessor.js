import * as XLSX from 'xlsx';

/**
 * Store mapping for Agregadores (PedidosYA)
 */
export const TIENDAS_AGREGADORES = {
    4: { name: "BLVD. MORAZAN", city: "TEGUCIGALPA D.C." },
    9: { name: "TEXACO KENNEDY", city: "TEGUCIGALPA D.C." },
    12: { name: "VIERA", city: "TEGUCIGALPA D.C." },
    14: { name: "FERGUSON", city: "CHOLUTECA" },
    15: { name: "MONUMENTO LA MADRE", city: "SAN PEDRO SULA" },
    17: { name: "MAXI CASTAÑOS", city: "SAN PEDRO SULA" },
    18: { name: "CMC COLONIAL", city: "COMAYAGUA" },
    20: { name: "PUERTO CORTES", city: "PUERTO CORTES" },
    21: { name: "AEROPLAZA", city: "TEGUCIGALPA D.C." },
    23: { name: "MAXI DESPENSA PROGRESO", city: "EL PROGRESO" },
    25: { name: "JARDINES DEL VALLE", city: "SAN PEDRO SULA" },
    26: { name: "MINITAS", city: "TEGUCIGALPA D.C." },
    69: { name: "PERISUR", city: "TEGUCIGALPA D.C." },
    92: { name: "GUAMILITO", city: "SAN PEDRO SULA" },
    103: { name: "TEXACO MATEO", city: "TEGUCIGALPA D.C." },
    133: { name: "UNIPLAZA CEIBA", city: "LA CEIBA" },
    141: { name: "PLAZA LOS OLIVOS", city: "CHOLUTECA" },
    147: { name: "TROCHES MONTALVAN", city: "JUTICALPA" }
};

/**
 * Read Excel file and return data as array of objects
 */
const readExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Process RMS data for Agregadores (PedidosYA only)
 */
export const processAgregadoresData = async (files) => {
    const { rms } = files;

    if (!rms) {
        throw new Error('Se requiere el archivo RMS');
    }

    const rmsData = await readExcel(rms);

    // Get column names from first row
    const columnNames = Object.keys(rmsData[0] || {});
    console.log('[Agregadores] Columnas detectadas:', columnNames);

    // Find the Source column (last column typically)
    const sourceColumn = columnNames.find(col =>
        col.toLowerCase().includes('source') ||
        col.toLowerCase().includes('fuente')
    ) || columnNames[columnNames.length - 1];

    // Find StoreId column (first column typically)
    const storeIdColumn = columnNames.find(col =>
        col.toLowerCase().includes('storeid') ||
        col.toLowerCase().includes('store') ||
        col.toLowerCase().includes('tienda')
    ) || columnNames[0];

    // Find Pedido column
    const pedidoColumn = columnNames.find(col =>
        col.toLowerCase().includes('pedido') ||
        col.toLowerCase().includes('order')
    ) || columnNames[1];

    // Find other columns
    const codigoColumn = columnNames.find(col => col.toLowerCase().includes('codigo')) || 'Codigo';
    const descripcionColumn = columnNames.find(col => col.toLowerCase().includes('descripcion')) || 'Descripcion';
    const cantidadColumn = columnNames.find(col => col.toLowerCase().includes('cantidad')) || 'Cantidad';
    const totalColumn = columnNames.find(col => col.toLowerCase() === 'total') || 'Total';

    console.log('[Agregadores] Columnas usadas:', { sourceColumn, storeIdColumn, pedidoColumn, codigoColumn, descripcionColumn, cantidadColumn, totalColumn });

    // Filter by PEDIDOS YA source
    const pedidosYaData = rmsData.filter(row => {
        const source = String(row[sourceColumn] || '').trim().toUpperCase();
        return source === 'PEDIDOS YA' || source === 'PEDIDOSYA';
    });

    console.log(`[Agregadores] Filas totales RMS: ${rmsData.length}, Filas PEDIDOS YA: ${pedidosYaData.length}`);

    if (pedidosYaData.length === 0) {
        throw new Error('No se encontraron registros de PEDIDOS YA en el archivo RMS');
    }

    // Process each row
    pedidosYaData.forEach(row => {
        row['_storeId'] = parseInt(row[storeIdColumn]) || 0;
        row['_pedido'] = String(row[pedidoColumn] || '').trim();
        row['_codigo'] = String(row[codigoColumn] || '').trim();
        row['_descripcion'] = String(row[descripcionColumn] || '').trim();
        row['_cantidad'] = parseFloat(row[cantidadColumn]) || 0;
        row['_total'] = parseFloat(row[totalColumn]) || 0;
    });

    // === Calculate unique orders (Tx) ===
    const uniqueOrders = new Set();
    const ordersByStore = {};

    pedidosYaData.forEach(row => {
        const pedido = row['_pedido'];
        const storeId = row['_storeId'];

        if (pedido) {
            uniqueOrders.add(pedido);

            if (!ordersByStore[storeId]) {
                ordersByStore[storeId] = new Set();
            }
            ordersByStore[storeId].add(pedido);
        }
    });

    // === Calculate total sales ===
    const ventaTotal = pedidosYaData.reduce((sum, row) => sum + row['_total'], 0);

    // === Calculate sales by store ===
    const ventasByStore = {};
    pedidosYaData.forEach(row => {
        const storeId = row['_storeId'];
        ventasByStore[storeId] = (ventasByStore[storeId] || 0) + row['_total'];
    });

    // === Calculate top products by quantity ===
    const productosMap = {};
    pedidosYaData.forEach(row => {
        const key = `${row['_codigo']}_${row['_descripcion']}`;
        if (!productosMap[key]) {
            productosMap[key] = {
                codigo: row['_codigo'],
                descripcion: row['_descripcion'],
                cantidad: 0,
                total: 0
            };
        }
        productosMap[key].cantidad += row['_cantidad'];
        productosMap[key].total += row['_total'];
    });

    const topProductos = Object.values(productosMap)
        .sort((a, b) => b.cantidad - a.cantidad);

    // === Calculate top stores by sales ===
    const topTiendas = Object.entries(ventasByStore)
        .map(([storeId, venta]) => ({
            storeId: parseInt(storeId),
            name: TIENDAS_AGREGADORES[storeId]?.name || `Tienda ${storeId}`,
            city: TIENDAS_AGREGADORES[storeId]?.city || 'Desconocida',
            venta,
            pedidos: ordersByStore[storeId]?.size || 0
        }))
        .sort((a, b) => b.venta - a.venta);

    // === Calculate orders per store (for meta chart) ===
    const pedidosPorTienda = Object.entries(ordersByStore)
        .map(([storeId, orders]) => ({
            storeId: parseInt(storeId),
            name: TIENDAS_AGREGADORES[storeId]?.name || `Tienda ${storeId}`,
            pedidos: orders.size
        }))
        .sort((a, b) => b.pedidos - a.pedidos);

    // === Calculate daily data (for trend chart) ===
    // Find Fecha column
    const fechaColumn = columnNames.find(col =>
        col.toLowerCase().includes('fecha') ||
        col.toLowerCase().includes('date')
    ) || 'Fecha';

    const dailyData = {};
    const dailyOrders = {};
    const dailyDates = {}; // Store actual date strings

    pedidosYaData.forEach(row => {
        // Parse date - handle different formats
        let fecha = row[fechaColumn];
        if (!fecha) return;

        // Try to extract day/month
        let day, month, dateKey, displayDate;

        // Convert to string if needed
        const fechaStr = String(fecha).trim();

        // Try DD/MM/YYYY format first (most common)
        const slashMatch = fechaStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (slashMatch) {
            day = parseInt(slashMatch[1]);
            month = parseInt(slashMatch[2]);
        } else {
            // Try YYYY-MM-DD format
            const dashMatch = fechaStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (dashMatch) {
                day = parseInt(dashMatch[3]);
                month = parseInt(dashMatch[2]);
            } else if (typeof fecha === 'number') {
                // Excel serial date
                const excelDate = new Date((fecha - 25569) * 86400 * 1000);
                day = excelDate.getDate();
                month = excelDate.getMonth() + 1;
            }
        }

        if (!day || day < 1 || day > 31) return;
        if (!month || month < 1 || month > 12) month = new Date().getMonth() + 1;

        dateKey = String(day).padStart(2, '0');
        displayDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

        // Store display date
        dailyDates[dateKey] = displayDate;

        // Sum totals by day
        dailyData[dateKey] = (dailyData[dateKey] || 0) + row['_total'];

        // Count unique orders by day
        if (!dailyOrders[dateKey]) {
            dailyOrders[dateKey] = new Set();
        }
        if (row['_pedido']) {
            dailyOrders[dateKey].add(row['_pedido']);
        }
    });

    // Convert to array sorted by day
    const ventaPorDia = Object.entries(dailyData)
        .map(([dayKey, total]) => ({
            day: parseInt(dayKey),
            name: dailyDates[dayKey] || dayKey,
            venta: total,
            pedidos: dailyOrders[dayKey]?.size || 0
        }))
        .sort((a, b) => a.day - b.day);

    return {
        rawData: pedidosYaData,
        ventaTotal,
        cantidadTx: uniqueOrders.size,
        topProductos,
        topTiendas,
        pedidosPorTienda,
        ventaPorDia,
        ventasByStore,
        ordersByStore: Object.fromEntries(
            Object.entries(ordersByStore).map(([k, v]) => [k, v.size])
        )
    };
};
