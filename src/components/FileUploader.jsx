import React from 'react';
import { Upload, FileSpreadsheet, Play } from 'lucide-react';

const FileUploader = ({ files, onFileChange, onProcess, isProcessing, dashboardType = 'venta-meta' }) => {
    // Different file requirements based on dashboard type
    const fileConfig = dashboardType === 'agregadores'
        ? [
            { key: 'rms', label: 'RMS.xlsx' }
        ]
        : dashboardType === 'ecommerce'
            ? [
                { key: 'albatross', label: 'Albatross.xlsx' },
                { key: 'rms', label: 'RMS.xlsx' }
            ]
            : [
                { key: 'albatross', label: 'Albatross.xlsx' },
                { key: 'rms', label: 'RMS.xlsx' },
                { key: 'simla', label: 'REPORTE SIMLA.xlsx' }
            ];

    // Check if required files are selected based on dashboard type
    const allFilesSelected = dashboardType === 'agregadores'
        ? files.rms
        : dashboardType === 'ecommerce'
            ? files.albatross && files.rms
            : files.albatross && files.rms && files.simla;

    return (
        <div className="file-uploader">
            <h3 className="uploader-title">
                <Upload size={20} />
                Carga de Archivos
                {dashboardType === 'agregadores' && (
                    <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '8px' }}>(Solo RMS)</span>
                )}
                {dashboardType === 'ecommerce' && (
                    <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '8px' }}>(Solo 2 archivos)</span>
                )}
            </h3>

            <div className="file-inputs">
                {fileConfig.map(({ key, label }) => (
                    <div key={key} className="file-input-group">
                        <span className="file-label">{label}</span>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="file-input"
                            onChange={(e) => onFileChange(key, e.target.files[0])}
                        />
                        {files[key] && (
                            <span className="file-selected">
                                <FileSpreadsheet size={16} />
                                {files[key].name}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <button
                className="process-btn"
                onClick={onProcess}
                disabled={!allFilesSelected || isProcessing}
            >
                {isProcessing ? 'Procesando...' : (
                    <>
                        <Play size={18} style={{ marginRight: '8px' }} />
                        Generar Dashboard
                    </>
                )}
            </button>
        </div>
    );
};

export default FileUploader;

