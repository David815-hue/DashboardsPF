import * as XLSX from 'xlsx';

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
 * Process E-commerce data from Albatross and RMS files
 */
export const processEcommerceData = async (files) => {
    const { albatross, rms } = files;

    if (!albatross || !rms) {
        throw new Error('Se requieren los archivos Albatross y RMS');
    }

    const albatrossData = await readExcel(albatross);
    const rmsData = await readExcel(rms);

    // === 1. Count cancelled orders (APP and Ecommerce only) ===
    const pedidosCancelados = albatrossData.filter(row => {
        const estado = String(row['Estado'] || '').trim().toLowerCase();
        const canal = String(row['Canal'] || '').trim();
        return estado === 'pedido cancelado' && (canal === 'APP' || canal === 'Ecommerce');
    });

    // Remove duplicates by order number
    const canceladosUnicos = [];
    const canceladosVistos = new Set();
    pedidosCancelados.forEach(row => {
        const numPedido = String(row['Número de Pedido'] || '');
        if (!canceladosVistos.has(numPedido)) {
            canceladosVistos.add(numPedido);
            canceladosUnicos.push(row);
        }
    });

    // === 2. Analyze cancellation reasons ===
    // === 2. Analyze cancellation reasons ===
    // Find the column name by checking keys of the first cancelled order or any row
    let motivoColumn = null;

    // Helper to find key in an object - IMPROVED
    // Busca columnas que contengan "motivo" (ignorando tildes/case)
    const findMotivoKey = (obj) => Object.keys(obj || {}).find(col => {
        const c = col.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
        return c.includes('motivo');
    });

    // Try finding in the first cancelled order (most likely to have it)
    if (canceladosUnicos.length > 0) {
        motivoColumn = findMotivoKey(canceladosUnicos[0]);
    }

    // If not found, try the first row of raw data
    if (!motivoColumn && albatrossData.length > 0) {
        motivoColumn = findMotivoKey(albatrossData[0]);
    }

    // If still not found, try to scan a few rows
    if (!motivoColumn) {
        for (let i = 0; i < Math.min(albatrossData.length, 50); i++) {
            motivoColumn = findMotivoKey(albatrossData[i]);
            if (motivoColumn) break;
        }
    }

    const motivosAnulacion = {};
    canceladosUnicos.forEach(row => {
        let motivo = String(row[motivoColumn] || 'ERROR DE PAGO').trim().toUpperCase();
        if (motivo === 'NAN' || motivo === '') motivo = 'ERROR DE PAGO';
        motivosAnulacion[motivo] = (motivosAnulacion[motivo] || 0) + 1;
    });

    // === 3. Filter out cancelled orders and filter by APP/Ecommerce ===
    const albatrossFiltrado = albatrossData.filter(row => {
        const estado = String(row['Estado'] || '').trim().toLowerCase();
        const canal = String(row['Canal'] || '').trim();
        return estado !== 'pedido cancelado' && (canal === 'APP' || canal === 'Ecommerce');
    });

    // === 4. Clean order numbers ===
    albatrossFiltrado.forEach(row => {
        row['NumeroPedidoLimpio'] = String(row['Número de Pedido'] || '').replace(/^0+/, '');
    });

    rmsData.forEach(row => {
        row['PedidoLimpio'] = String(row['Pedido'] || '').trim();
        row['Total'] = parseFloat(row['Total']) || 0;
        row['Cantidad'] = parseFloat(row['Cantidad']) || 0;
    });

    // === 5. Group RMS by order and sum totals ===
    const ventaRMS = {};
    rmsData.forEach(row => {
        const pedido = row['PedidoLimpio'];
        ventaRMS[pedido] = (ventaRMS[pedido] || 0) + row['Total'];
    });

    // === 6. Merge Albatross with RMS sales ===
    const pedidosConsolidado = [];
    const pedidosNoEnRMS = [];
    const pedidosVistos = new Set();

    albatrossFiltrado.forEach(row => {
        const numPedido = row['NumeroPedidoLimpio'];
        if (pedidosVistos.has(numPedido)) return;
        pedidosVistos.add(numPedido);

        const ventaTotal = ventaRMS[numPedido];
        if (ventaTotal !== undefined) {
            pedidosConsolidado.push({
                ...row,
                'Venta RMS': ventaTotal
            });
        } else {
            pedidosNoEnRMS.push(row);
        }
    });

    // === 7. Calculate top products (only from confirmed APP/Ecommerce orders found in RMS) ===
    // Get valid order numbers from confirmed orders (orders found in both Albatross and RMS)
    // Matches Python: pedidos_app_ecommerce = pedidos_en_rms["NumeroPedidoLimpio"].unique()
    const validOrderIds = new Set(pedidosConsolidado.map(row => row['NumeroPedidoLimpio']));

    const productosMap = {};
    rmsData.forEach(row => {
        const pedidoId = row['PedidoLimpio'];

        // Strict Filter: Only include products belonging to confirmed APP/Ecommerce orders
        // Verify ID is not empty and exists in our confirmed list
        if (!pedidoId || pedidoId === '' || !validOrderIds.has(pedidoId)) return;

        if (row['Codigo'] === '20000025') return; // Skip delivery

        const key = `${row['Codigo']}_${row['Descripcion']}`;
        if (!productosMap[key]) {
            productosMap[key] = {
                codigo: row['Codigo'],
                descripcion: row['Descripcion'],
                cantidad: 0,
                total: 0
            };
        }
        productosMap[key].cantidad += row['Cantidad'];
        productosMap[key].total += row['Total'];
    });

    // Sort by Quantity (Units) to match Excel list expectation
    const topProductos = Object.values(productosMap)
        .sort((a, b) => b.cantidad - a.cantidad);

    console.log(`[Ecommerce Debug] Pedidos APP/Eco encontrados en RMS: ${validOrderIds.size}`);
    console.log(`[Ecommerce Debug] Top 3 Productos:`, topProductos.slice(0, 3));

    return {
        pedidosConsolidado,
        pedidosNoEnRMS,
        canceladosUnicos,
        motivosAnulacion,
        topProductos,
        rmsData
    };
};
