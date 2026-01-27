import React from 'react';
import { Settings } from 'lucide-react';

const ManualInputs = ({ config, onConfigChange }) => {
    const handleChange = (key, value) => {
        // Parse the input value - if empty string, keep as empty; otherwise parse as number
        const parsedValue = value === '' ? 0 : parseFloat(value);

        console.log(`[ManualInputs] Updating ${key}: "${value}" -> ${parsedValue}`);

        // Update config with the parsed value (NaN will be converted to 0)
        onConfigChange(prev => {
            const newConfig = {
                ...prev,
                [key]: isNaN(parsedValue) ? 0 : parsedValue
            };
            console.log('[ManualInputs] New config:', newConfig);
            return newConfig;
        });
    };

    return (
        <div className="manual-inputs">
            <h3 className="inputs-title">
                <Settings size={20} />
                Configuración Manual
            </h3>

            <div className="input-grid">
                {/* Meta */}
                <div className="config-section-header" style={{ gridColumn: '1 / -1', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '-4px', marginTop: '4px' }}>Meta</div>

                <div className="input-group">
                    <label>Inversión (USD)</label>
                    <input
                        type="number"
                        value={config.inversionUSD}
                        onChange={(e) => handleChange('inversionUSD', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Tipo de Cambio</label>
                    <input
                        type="number"
                        value={config.tipoCambio}
                        onChange={(e) => handleChange('tipoCambio', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Clics</label>
                    <input
                        type="number"
                        value={config.clics}
                        onChange={(e) => handleChange('clics', e.target.value)}
                    />
                </div>

                {/* WhatsApp */}
                <div className="config-section-header" style={{ gridColumn: '1 / -1', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '-4px', marginTop: '8px' }}>WhatsApp</div>



                <div className="input-group">
                    <label>Total Envíos</label>
                    <input
                        type="number"
                        value={config.totalEnvios}
                        onChange={(e) => handleChange('totalEnvios', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Envíos TGU</label>
                    <input
                        type="number"
                        value={config.enviosTGU}
                        onChange={(e) => handleChange('enviosTGU', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Envíos SPS</label>
                    <input
                        type="number"
                        value={config.enviosSPS}
                        onChange={(e) => handleChange('enviosSPS', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Costo Envío (Lps)</label>
                    <input
                        type="number"
                        value={config.costoEnvioLps}
                        onChange={(e) => handleChange('costoEnvioLps', e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Top Productos</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={config.topProductsCount}
                        onChange={(e) => handleChange('topProductsCount', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ManualInputs;
