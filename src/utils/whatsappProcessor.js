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
 * Clean phone number to last 8 digits
 */
const cleanPhone = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.slice(-8);
};

/**
 * Process WhatsApp Marketing data from Albatross, RMS, and SIMLA files
 */
export const processWhatsAppMarketingData = async (files) => {
    const { albatross, rms, simla } = files;

    if (!albatross || !rms || !simla) {
        throw new Error('Se requieren los archivos Albatross, RMS y SIMLA');
    }

    const albatrossData = await readExcel(albatross);
    const rmsData = await readExcel(rms);
    const simlaData = await readExcel(simla);

    // === 1. Normalize column names ===
    const normalizeColumns = (data) => {
        return data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                newRow[key.trim()] = row[key];
            });
            return newRow;
        });
    };

    const albaNorm = normalizeColumns(albatrossData);
    const rmsNorm = normalizeColumns(rmsData);
    const simlaNorm = normalizeColumns(simlaData);

    // === 2. Find description column in RMS ===
    const descCol = Object.keys(rmsNorm[0] || {}).find(c => c.toLowerCase().includes('descripcion'));
    if (!descCol) {
        throw new Error('No se encontró columna de descripción en RMS');
    }

    // === 3. Clean order IDs and phone numbers ===
    albaNorm.forEach(row => {
        row['Pedido_ID'] = String(row['Número de Pedido'] || '').replace(/^0+/, '');
        row['Telefono_Limpio'] = cleanPhone(row['Celular del cliente']);
        row['Total'] = parseFloat(row['Total']) || 0;
        row['Ciudad'] = String(row['Ciudad'] || '').trim().toUpperCase();
    });

    rmsNorm.forEach(row => {
        row['Pedido_ID'] = String(row['Pedido'] || '').replace(/^0+/, '');
        row['Descripcion'] = String(row[descCol] || '').trim();
        row['Total'] = parseFloat(row['Total']) || 0;
    });

    simlaNorm.forEach(row => {
        const phoneCol = Object.keys(row).find(k => k.toLowerCase().includes('teléfono') || k.toLowerCase().includes('telefono'));
        row['Telefono_Limpio'] = cleanPhone(row[phoneCol] || '').replace(/^504/, '');

        // Get campaign
        let campana = String(row['Campaña'] || '').trim();
        const etiquetas = String(row['🔖 Etiquetas del diálogo'] || row['Etiquetas del diálogo'] || '').toLowerCase();

        if (!campana) {
            if (etiquetas.includes('farmacovigilancia')) {
                campana = 'Campaña Farmacovigilancia';
            } else if (etiquetas.includes('marketing')) {
                campana = 'Campaña Marketing';
            }
        }
        row['Campaña'] = campana;
        row['Etiquetas_lower'] = etiquetas;
        row['Asesor'] = String(row['Asesor'] || '').trim();
        row['PalabraClave'] = String(row['Palabra clave'] || '').trim();
    });

    // === 4. Filter SIMLA for relevant campaigns ===
    const simlaFiltrado = simlaNorm.filter(row => {
        const campana = (row['Campaña'] || '').toLowerCase();
        const etiquetas = row['Etiquetas_lower'] || '';
        return campana.includes('farmacovigilancia') || campana.includes('marketing') ||
            etiquetas.includes('farmacovigilancia') || etiquetas.includes('marketing');
    });

    const totalConversaciones = simlaFiltrado.length;

    // === 5. Create RMS lookup by Pedido_ID ===
    const rmsMap = {};
    rmsNorm.forEach(row => {
        const pedidoId = row['Pedido_ID'];
        if (!rmsMap[pedidoId]) {
            rmsMap[pedidoId] = [];
        }
        rmsMap[pedidoId].push(row);
    });

    // === 6. Join Albatross + RMS ===
    const albaRms = [];
    albaNorm.forEach(row => {
        const pedidoId = row['Pedido_ID'];
        const rmsRows = rmsMap[pedidoId];
        if (rmsRows) {
            rmsRows.forEach(rmsRow => {
                albaRms.push({
                    ...row,
                    'Descripcion': rmsRow['Descripcion'],
                    'Source': rmsRow['Source']
                });
            });
        }
    });

    // === 7. Create SIMLA lookup by phone ===
    const simlaPhoneMap = {};
    simlaFiltrado.forEach(row => {
        const phone = row['Telefono_Limpio'];
        if (!simlaPhoneMap[phone]) {
            simlaPhoneMap[phone] = row;
        }
    });

    // === 8. Join with SIMLA and filter matches ===
    const pedidosDetalle = [];
    const seenPedidos = new Set(); // For deduplication by Pedido_ID

    albaRms.forEach(row => {
        const phone = row['Telefono_Limpio'];
        const simlaRow = simlaPhoneMap[phone];

        if (simlaRow) {
            const pedidoId = row['Pedido_ID'];

            // Deduplicate by Pedido_ID (user requested this)
            if (!seenPedidos.has(pedidoId)) {
                seenPedidos.add(pedidoId);
                pedidosDetalle.push({
                    ...row,
                    'Campaña': simlaRow['Campaña'],
                    'Asesor': simlaRow['Asesor'],
                    'PalabraClave': simlaRow['PalabraClave'],
                    'Etiquetas': simlaRow['🔖 Etiquetas del diálogo'] || simlaRow['Etiquetas del diálogo']
                });
            }
        }
    });

    // === 9. Calculate top products (exclude RECARGO SERVICIO A DOMICILIO) ===
    const productCounts = {};
    albaRms.forEach(row => {
        const phone = row['Telefono_Limpio'];
        if (simlaPhoneMap[phone]) {
            const desc = row['Descripcion'];
            if (desc && !desc.toUpperCase().includes('RECARGO SERVICIO A DOMICILIO')) {
                productCounts[desc] = (productCounts[desc] || 0) + 1;
            }
        }
    });

    const topProductos = Object.entries(productCounts)
        .map(([name, count]) => ({ name, value: count }))
        .sort((a, b) => b.value - a.value);

    // === 10. Non-matched SIMLA records ===
    const matchedPhones = new Set(pedidosDetalle.map(p => p['Telefono_Limpio']));
    const noMatch = simlaFiltrado.filter(row => !matchedPhones.has(row['Telefono_Limpio']));

    return {
        pedidosDetalle,
        topProductos,
        noMatch,
        totalConversaciones,
        simlaFiltrado
    };
};
