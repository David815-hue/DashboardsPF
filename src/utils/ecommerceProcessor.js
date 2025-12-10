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
    const motivoColumn = Object.keys(albatrossData[0] || {}).find(col =>
        col.toLowerCase().includes('motivo') && col.toLowerCase().includes('anula')
    );

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

    // === 7. Calculate top products (exclude delivery charge) ===
    const productosMap = {};
    rmsData.forEach(row => {
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

    const topProductos = Object.values(productosMap)
        .sort((a, b) => b.total - a.total);

    return {
        pedidosConsolidado,
        pedidosNoEnRMS,
        canceladosUnicos,
        motivosAnulacion,
        topProductos,
        rmsData
    };
};
