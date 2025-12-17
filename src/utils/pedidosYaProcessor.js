import * as XLSX from 'xlsx';

/**
 * Store name mapping from PedidosYa Excel to internal names
 * Key: normalized name from Excel (lowercase, trimmed)
 * Value: { name, city, storeId }
 */
const TIENDAS_PEDIDOSYA = {
    'punto farma morazán': { name: 'BLVD. MORAZAN', city: 'TEGUCIGALPA D.C.', storeId: 4 },
    'punto farma morazan': { name: 'BLVD. MORAZAN', city: 'TEGUCIGALPA D.C.', storeId: 4 },
    'punto farma (choluteca)': { name: 'FERGUSON', city: 'CHOLUTECA', storeId: 14 },
    'punto farma (las minitas)': { name: 'MINITAS', city: 'TEGUCIGALPA D.C.', storeId: 26 },
    'punto farma (maxi castaños)': { name: 'MAXI CASTAÑOS', city: 'SAN PEDRO SULA', storeId: 17 },
    'punto farma (maxi castanos)': { name: 'MAXI CASTAÑOS', city: 'SAN PEDRO SULA', storeId: 17 },
    'punto farma (texaco mateo)': { name: 'TEXACO MATEO', city: 'TEGUCIGALPA D.C.', storeId: 103 },
    'punto farma (trochez montalvan juticalpa)': { name: 'TROCHES MONTALVAN', city: 'JUTICALPA', storeId: 147 },
    'punto farma (uniplaza la ceiba)': { name: 'UNIPLAZA CEIBA', city: 'LA CEIBA', storeId: 133 },
    'punto farma aeroplaza': { name: 'AEROPLAZA', city: 'TEGUCIGALPA D.C.', storeId: 21 },
    'punto farma blv. kennedy': { name: 'TEXACO KENNEDY', city: 'TEGUCIGALPA D.C.', storeId: 9 },
    'punto farma comayagua': { name: 'CMC COLONIAL', city: 'COMAYAGUA', storeId: 18 },
    'punto farma jardines del valle': { name: 'JARDINES DEL VALLE', city: 'SAN PEDRO SULA', storeId: 25 },
    'punto farma maxi progreso': { name: 'MAXI DESPENSA PROGRESO', city: 'EL PROGRESO', storeId: 23 },
    'punto farma monumento a la madre': { name: 'MONUMENTO LA MADRE', city: 'SAN PEDRO SULA', storeId: 15 },
    'punto farma perisur (tgu)': { name: 'PERISUR', city: 'TEGUCIGALPA D.C.', storeId: 69 },
    'punto farma plaza los olivos': { name: 'PLAZA LOS OLIVOS', city: 'CHOLUTECA', storeId: 141 },
    'punto farma puerto cortés': { name: 'PUERTO CORTES', city: 'PUERTO CORTES', storeId: 20 },
    'punto farma puerto cortes': { name: 'PUERTO CORTES', city: 'PUERTO CORTES', storeId: 20 },
    'punto farma viera (el hatillo)': { name: 'VIERA', city: 'TEGUCIGALPA D.C.', storeId: 12 },
    'punto farma guamilito': { name: 'GUAMILITO', city: 'SAN PEDRO SULA', storeId: 92 },
    // Variantes con guión
    'punto farma - guamilito': { name: 'GUAMILITO', city: 'SAN PEDRO SULA', storeId: 92 },
    'punto farma - morazan': { name: 'BLVD. MORAZAN', city: 'TEGUCIGALPA D.C.', storeId: 4 },
};

// Export for use in metrics calculations
export { TIENDAS_PEDIDOSYA };

/**
 * Normalize store name for matching
 */
const normalizeStoreName = (name) => {
    return String(name || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, ' '); // Normalize spaces
};

/**
 * Find store info by name from Excel
 */
const findStoreByName = (excelName) => {
    const normalized = normalizeStoreName(excelName);

    // Try exact match first
    if (TIENDAS_PEDIDOSYA[normalized]) {
        return TIENDAS_PEDIDOSYA[normalized];
    }

    // Try partial match
    for (const [key, value] of Object.entries(TIENDAS_PEDIDOSYA)) {
        const normalizedKey = normalizeStoreName(key);
        if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
            return value;
        }
    }

    // No match found
    console.warn(`[PedidosYa] Tienda no reconocida: "${excelName}"`);
    return { name: excelName, city: 'Desconocida', storeId: 0 };
};

/**
 * Parse products from the "Artículos" column
 * Format: "4 Gel De Manos Pf Neutro 60Ml, 1 Ungüento Para La Irritacion..."
 */
const parseProducts = (articlesString) => {
    if (!articlesString) return [];

    const products = [];
    const items = String(articlesString).split(',');

    // Fragments to ignore (units of measure, not real products)
    const ignorePatterns = /^(ml|mg|g|kg|oz|unidades?|capsulas?|tabletas?|comprimidos?|sobres?)$/i;

    for (const item of items) {
        const trimmed = item.trim();

        // Skip empty items
        if (!trimmed) continue;

        // Skip very short items (likely fragments like "ml", "g", etc.)
        if (trimmed.length < 4) continue;

        // Skip items that are just units of measure
        if (ignorePatterns.test(trimmed)) continue;

        // Match pattern: "NUMBER PRODUCT_NAME"
        const match = trimmed.match(/^(\d+)\s+(.+)$/);
        if (match) {
            const descripcion = match[2].trim();
            // Also validate the description is not too short
            if (descripcion.length >= 4 && !ignorePatterns.test(descripcion)) {
                products.push({
                    cantidad: parseInt(match[1]),
                    descripcion: descripcion
                });
            }
        } else if (trimmed.length >= 5 && !ignorePatterns.test(trimmed)) {
            // No quantity found, assume 1 (but only if it looks like a real product name)
            products.push({
                cantidad: 1,
                descripcion: trimmed
            });
        }
    }

    return products;
};

/**
 * Read Excel file and return data as array of objects
 * Note: PedidosYa Excel has 2 header rows - first row is groups, second row is column names
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

                // Read with header row at index 1 (second row, 0-indexed)
                // This skips the first row which contains group headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    header: 1  // Read all rows as arrays first
                });

                // Get the actual column names from the second row (index 1)
                const headers = jsonData[1];

                // Convert remaining rows to objects using the headers
                const result = [];
                for (let i = 2; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const obj = {};
                    headers.forEach((header, idx) => {
                        if (header && header.trim()) {
                            obj[header.trim()] = row[idx] || '';
                        }
                    });
                    result.push(obj);
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Process PedidosYa Excel data for Agregadores dashboard
 */
export const processPedidosYaData = async (files) => {
    const { pedidosya } = files;

    if (!pedidosya) {
        throw new Error('Se requiere el archivo PedidosYa.xlsx');
    }

    const rawData = await readExcel(pedidosya);

    // Get column names
    const columnNames = Object.keys(rawData[0] || {});
    console.log('[PedidosYa] Columnas detectadas:', columnNames);

    // Find columns (flexible matching)
    const findColumn = (patterns) => {
        for (const pattern of patterns) {
            const col = columnNames.find(c =>
                c.toLowerCase().includes(pattern.toLowerCase())
            );
            if (col) return col;
        }
        return null;
    };

    const nombreLocalCol = findColumn(['nombre del local', 'local', 'tienda']) || 'Nombre del local';
    const nroPedidoCol = findColumn(['nro de pedido', 'pedido', 'order']) || 'Nro de pedido';
    const estadoCol = findColumn(['estado del pedido', 'estado']) || 'Estado del pedido';
    const fechaCol = findColumn(['fecha del pedido', 'fecha']) || 'Fecha del pedido';
    const totalPedidoCol = findColumn(['total del pedido']) || 'Total del pedido';
    const articulosCol = findColumn(['artículos', 'articulos', 'productos']) || 'Artículos';

    console.log('[PedidosYa] Columnas usadas:', {
        nombreLocalCol, nroPedidoCol, estadoCol, fechaCol, totalPedidoCol, articulosCol
    });

    // Process all data (user filters in PedidosYa platform before export)
    console.log(`[PedidosYa] Total filas: ${rawData.length}`);

    if (rawData.length === 0) {
        throw new Error('No se encontraron registros en el archivo');
    }

    // Process each row
    const processedData = rawData.map(row => {
        const storeInfo = findStoreByName(row[nombreLocalCol]);
        const total = parseFloat(String(row[totalPedidoCol] || '0').replace(',', '.')) || 0;
        const products = parseProducts(row[articulosCol]);

        return {
            ...row,
            _storeId: storeInfo.storeId,
            _storeName: storeInfo.name,
            _city: storeInfo.city,
            _pedido: String(row[nroPedidoCol] || '').trim(),
            _total: total,
            _fecha: row[fechaCol],
            _products: products
        };
    });

    // === Calculate unique orders (Tx) ===
    const uniqueOrders = new Set();
    const ordersByStore = {};

    processedData.forEach(row => {
        const pedido = row._pedido;
        const storeId = row._storeId;

        if (pedido) {
            uniqueOrders.add(pedido);

            if (!ordersByStore[storeId]) {
                ordersByStore[storeId] = new Set();
            }
            ordersByStore[storeId].add(pedido);
        }
    });

    // === Calculate total sales (Venta Bruta) ===
    const ventaTotal = processedData.reduce((sum, row) => sum + row._total, 0);

    // === Calculate sales by store ===
    const ventasByStore = {};
    processedData.forEach(row => {
        const storeId = row._storeId;
        ventasByStore[storeId] = (ventasByStore[storeId] || 0) + row._total;
    });

    // === Calculate top products by quantity ===
    const productosMap = {};
    processedData.forEach(row => {
        for (const product of row._products) {
            const key = product.descripcion.toLowerCase();
            if (!productosMap[key]) {
                productosMap[key] = {
                    descripcion: product.descripcion,
                    cantidad: 0
                };
            }
            productosMap[key].cantidad += product.cantidad;
        }
    });

    const topProductos = Object.values(productosMap)
        .sort((a, b) => b.cantidad - a.cantidad);

    // === Calculate top stores by sales ===
    const storeNameMap = {};
    processedData.forEach(row => {
        storeNameMap[row._storeId] = { name: row._storeName, city: row._city };
    });

    const topTiendas = Object.entries(ventasByStore)
        .map(([storeId, venta]) => ({
            storeId: parseInt(storeId),
            name: storeNameMap[storeId]?.name || `Tienda ${storeId}`,
            city: storeNameMap[storeId]?.city || 'Desconocida',
            venta,
            pedidos: ordersByStore[storeId]?.size || 0
        }))
        .sort((a, b) => b.venta - a.venta);

    // === Calculate orders per store (for meta chart) ===
    const pedidosPorTienda = Object.entries(ordersByStore)
        .map(([storeId, orders]) => ({
            storeId: parseInt(storeId),
            name: storeNameMap[storeId]?.name || `Tienda ${storeId}`,
            pedidos: orders.size
        }))
        .sort((a, b) => b.pedidos - a.pedidos);

    // === Calculate daily data (for trend chart) ===
    const dailyData = {};
    const dailyOrders = {};
    const dailyDates = {};

    processedData.forEach(row => {
        const fechaStr = String(row._fecha || '').trim();
        if (!fechaStr) return;

        let day, month, dateKey, displayDate;

        // Try "YYYY-MM-DD HH:MM" format (from PedidosYa)
        const isoMatch = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            day = parseInt(isoMatch[3]);
            month = parseInt(isoMatch[2]);
        } else {
            // Try DD/MM/YYYY format
            const slashMatch = fechaStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (slashMatch) {
                day = parseInt(slashMatch[1]);
                month = parseInt(slashMatch[2]);
            }
        }

        if (!day || day < 1 || day > 31) return;
        if (!month || month < 1 || month > 12) month = new Date().getMonth() + 1;

        dateKey = String(day).padStart(2, '0');
        displayDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

        dailyDates[dateKey] = displayDate;
        dailyData[dateKey] = (dailyData[dateKey] || 0) + row._total;

        if (!dailyOrders[dateKey]) {
            dailyOrders[dateKey] = new Set();
        }
        if (row._pedido) {
            dailyOrders[dateKey].add(row._pedido);
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
        rawData: processedData,
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
