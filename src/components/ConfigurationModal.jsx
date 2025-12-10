import React, { useState } from 'react';
import { Upload, X, Save } from 'lucide-react';

const ConfigurationModal = ({ isOpen, onClose, onProcess, currentInputs }) => {
    const [files, setFiles] = useState({
        albatross: null,
        rms: null,
        simla: null
    });
    const [inputs, setInputs] = useState(currentInputs);

    if (!isOpen) return null;

    const handleFileChange = (e, key) => {
        setFiles({ ...files, [key]: e.target.files[0] });
    };

    const handleInputChange = (e, key) => {
        setInputs({ ...inputs, [key]: parseFloat(e.target.value) || 0 });
    };

    const handleProcess = () => {
        onProcess(files, inputs);
        // onClose(); // Let parent close after success or keep open for loading state
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
