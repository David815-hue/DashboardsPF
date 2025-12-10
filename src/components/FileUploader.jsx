import React from 'react';
import { Upload, FileSpreadsheet, Play } from 'lucide-react';

const FileUploader = ({ files, onFileChange, onProcess, isProcessing }) => {
    const fileConfig = [
        { key: 'albatross', label: 'Albatross.xlsx' },
        { key: 'rms', label: 'RMS.xlsx' },
        { key: 'simla', label: 'REPORTE SIMLA.xlsx' }
    ];

    const allFilesSelected = files.albatross && files.rms && files.simla;

    return (
        <div className="file-uploader">
            <h3 className="uploader-title">
                <Upload size={20} />
                Carga de Archivos
            </h3>

            <div className="file-inputs">
                {fileConfig.map(({ key, label }) => (
                    <div key={key} className="file-input-group">
                        <span className="file-label">{label}</span>
                        <input
                            type="file"
                            accept=".xlsx"
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
