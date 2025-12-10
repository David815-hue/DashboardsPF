import React from 'react';
import { Settings } from 'lucide-react';

const ManualInputs = ({ config, onConfigChange }) => {
    const handleChange = (key, value) => {
        onConfigChange(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    return (
        <div className="manual-inputs">
            <h3 className="inputs-title">
                <Settings size={20} />
                Configuración Manual
            </h3>

            <div className="input-grid">
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
