import React, { useState } from 'react';
import { Upload, X, Save } from 'lucide-react';

const ConfigurationModal = ({ isOpen, onClose, onProcess, currentInputs, currentTopConfig }) => {
    const [files, setFiles] = useState({
        albatross: null,
        rms: null,
        simla: null
    });
    const [inputs, setInputs] = useState(currentInputs);
    const [topConfig, setTopConfig] = useState(currentTopConfig || {
        ventaMetaTopProductos: 5,
        ecommerceTopProductos: 6,
        whatsappTopProductos: 5,
        whatsappPalabraClave: 5
    });

    if (!isOpen) return null;

    const handleFileChange = (e, key) => {
        setFiles({ ...files, [key]: e.target.files[0] });
    };

    const handleInputChange = (e, key) => {
        setInputs({ ...inputs, [key]: parseFloat(e.target.value) || 0 });
    };

    const handleTopConfigChange = (e, key) => {
        setTopConfig({ ...topConfig, [key]: parseInt(e.target.value) || 5 });
    };

    const handleProcess = () => {
        onProcess(files, inputs, topConfig);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Configuración de Datos</h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body">
                    <section className="section">
                        <h3>📂 Cargar Archivos</h3>
                        <div className="file-input-group">
                            <label>Albatross.xlsx</label>
                            <input type="file" accept=".xlsx" onChange={(e) => handleFileChange(e, 'albatross')} />
                        </div>
                        <div className="file-input-group">
                            <label>RMS.xlsx</label>
                            <input type="file" accept=".xlsx" onChange={(e) => handleFileChange(e, 'rms')} />
                        </div>
                        <div className="file-input-group">
                            <label>REPORTE SIMLA.xlsx</label>
                            <input type="file" accept=".xlsx" onChange={(e) => handleFileChange(e, 'simla')} />
                        </div>
                    </section>

                    <section className="section">
                        <h3>🔢 Datos Manuales</h3>
                        <div className="input-group">
                            <label>Inversión (USD)</label>
                            <input
                                type="number"
                                value={inputs.inversionUSD}
                                onChange={(e) => handleInputChange(e, 'inversionUSD')}
                            />
                        </div>
                        <div className="input-group">
                            <label>Clics</label>
                            <input
                                type="number"
                                value={inputs.clics}
                                onChange={(e) => handleInputChange(e, 'clics')}
                            />
                        </div>
                    </section>

                    <section className="section">
                        <h3>📊 Top Productos (Cantidad a mostrar)</h3>
                        <div className="input-group">
                            <label>Venta Meta - Top Productos</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={topConfig.ventaMetaTopProductos}
                                onChange={(e) => handleTopConfigChange(e, 'ventaMetaTopProductos')}
                            />
                        </div>
                        <div className="input-group">
                            <label>E-commerce - Top Productos</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={topConfig.ecommerceTopProductos}
                                onChange={(e) => handleTopConfigChange(e, 'ecommerceTopProductos')}
                            />
                        </div>
                        <div className="input-group">
                            <label>WhatsApp - Top Productos</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={topConfig.whatsappTopProductos}
                                onChange={(e) => handleTopConfigChange(e, 'whatsappTopProductos')}
                            />
                        </div>
                        <div className="input-group">
                            <label>WhatsApp - Palabra Clave</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={topConfig.whatsappPalabraClave}
                                onChange={(e) => handleTopConfigChange(e, 'whatsappPalabraClave')}
                            />
                        </div>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="primary-btn" onClick={handleProcess} disabled={!files.albatross || !files.rms || !files.simla}>
                        <Save size={18} style={{ marginRight: '8px' }} />
                        Procesar Datos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationModal;

