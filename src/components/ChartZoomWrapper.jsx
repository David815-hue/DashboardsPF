import React, { useState, cloneElement } from 'react';
import { Maximize2, X } from 'lucide-react';
import './ChartZoomWrapper.css';

/**
 * Wrapper component that adds a subtle fullscreen button to any chart
 * @param {ReactNode} children - The chart component to wrap
 * @param {string} title - Title to show in fullscreen mode
 */
const ChartZoomWrapper = ({ children, title = 'Gráfico' }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = (e) => {
        e.stopPropagation();
        setIsFullscreen(!isFullscreen);
    };

    return (
        <>
            {/* Render children with zoom button injected */}
            <div className="chart-zoom-wrapper">
                <button
                    className="chart-zoom-btn"
                    onClick={toggleFullscreen}
                    title="Ver en pantalla completa"
                >
                    <Maximize2 size={16} />
                </button>
                {children}
            </div>

            {/* Fullscreen modal */}
            {isFullscreen && (
                <div className="chart-fullscreen-overlay" onClick={toggleFullscreen}>
                    <div className="chart-fullscreen-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="chart-fullscreen-header">
                            <h3>{title}</h3>
                            <button
                                className="chart-fullscreen-close"
                                onClick={toggleFullscreen}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="chart-fullscreen-content">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChartZoomWrapper;
