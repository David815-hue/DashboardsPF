import * as XLSX from 'xlsx';

export const readExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const cleanColumnNames = (data) => {
    if (!data || data.length === 0) return [];
    return data.map(row => {
        const newRow = {};
        Object.keys(row).forEach(key => {
            newRow[key.trim()] = row[key];
        });
        return newRow;
    });
};

export const processData = async (files) => {
    try {
        const [albaRaw, rmsRaw, simlaRaw] = await Promise.all([
            readExcel(files.albatross),
            readExcel(files.rms),
            readExcel(files.simla)
        ]);

        const alba = cleanColumnNames(albaRaw);
        const rms = cleanColumnNames(rmsRaw);
        const simla = cleanColumnNames(simlaRaw);

        // --- RMS Description Column ---
        const colDesc = Object.keys(rms[0] || {}).find(k => k.toLowerCase().includes('descripcion'));

        // --- Data Cleaning ---
        // Albatross
        alba.forEach(row => {
            const pedido = String(row['Número de Pedido'] || '').replace(/^0+/, '');
            row.Pedido_ID = pedido;

            const celular = String(row['Celular del cliente'] || '').replace(/\D/g, '');
            row.Telefono_Limpio = celular.slice(-8);
        });

        // RMS
        rms.forEach(row => {
            row.Pedido_ID = String(row['Pedido'] || '').replace(/^0+/, '');
        });

        // SIMLA
        const simlaFiltrado = simla.filter(row => {
            const fuente = String(row['Fuente'] || '').toLowerCase();
            const campana = String(row['Campaña'] || '');
            const etiquetas = String(row['🔖 Etiquetas del diálogo'] || '').toLowerCase();

            const esFBIG = ['facebook', 'instagram'].includes(fuente);
            const tieneNumeros = /\d/.test(campana);
            const tienePautaMeta = etiquetas.includes('pauta meta');

            return esFBIG || tieneNumeros || tienePautaMeta;
        });

        simlaFiltrado.forEach(row => {
            const telefono = String(row['Teléfono de contacto'] || '').replace(/^504/, '').replace(/\D/g, '');
            row.Telefono_Limpio = telefono.slice(-8);
        });

        // --- Merging ---
        // Albatross + RMS
        const albaRms = alba.map(aRow => {
            const rmsMatch = rms.find(r => r.Pedido_ID === aRow.Pedido_ID);
            return {
                ...aRow,
                Source: rmsMatch ? rmsMatch['Source'] : null,
                Descripcion: rmsMatch && colDesc ? rmsMatch[colDesc] : null
            };
        }).filter(row => row.Pedido_ID && row.Descripcion); // Filter valid matches if necessary, or keep generic

        // + SIMLA
        const mergedData = albaRms.map(row => {
            const simlaMatch = simlaFiltrado.find(s => s.Telefono_Limpio === row.Telefono_Limpio);
            return {
                ...row,
                SimlaMatch: !!simlaMatch,
                Fuente: simlaMatch ? simlaMatch['Fuente'] : null,
                Campana: simlaMatch ? simlaMatch['Campaña'] : null,
                Etiquetas: simlaMatch ? simlaMatch['🔖 Etiquetas del diálogo'] : null
            };
        });

        // Filter valid matches (Pedidos que vinieron de SIMLA)
        // Based on python: alba_simla = alba_simla[alba_simla["Telefono_Limpio"].isin(simla_filtrado["Telefono_Limpio"])]
        const finalData = mergedData.filter(row => row.SimlaMatch);

        // Dedup by Pedido_ID
        const seen = new Set();
        const uniqueData = [];
        finalData.forEach(row => {
            if (!seen.has(row.Pedido_ID)) {
                seen.add(row.Pedido_ID);
                uniqueData.push(row);
            }
        });

        return {
            pedidos: uniqueData,
            simlaFiltradoCount: simlaFiltrado.length, // For conversion rate
            simlaFiltrado: simlaFiltrado
        };

    } catch (error) {
        console.error("Error processing files", error);
        throw error;
    }
};
