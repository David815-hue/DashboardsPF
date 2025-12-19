import React from 'react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(36, 36, 36, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '0.85rem',
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                <p style={{ margin: 0, color: '#aaa', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                    {label || payload[0]?.payload?.fullName || payload[0]?.name}
                </p>
                {payload.map((entry, idx) => (
                    <p key={idx} style={{ margin: '4px 0 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.payload?.fill || '#fff' }}></span>
                        {entry.name}: {
                            typeof entry.value === 'number'
                                ? (entry.name && (entry.name.toLowerCase().includes('venta') || entry.name.toLowerCase().includes('ticket') || entry.name.toLowerCase().includes('presupuesto')))
                                    ? `L ${entry.value.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
                                    : entry.value.toLocaleString('es-HN')
                                : entry.value
                        }
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
