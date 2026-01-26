import React from 'react';

/**
 * Gauge Chart Component - Animated gauge for displaying probabilities/percentages
 */
const GaugeChart = ({ value, size = 160, label = 'Probabilidad', showLabel = true }) => {
    const radius = size / 2 - 15;
    const centerX = size / 2;
    const centerY = size / 2;

    // Gauge goes from -135° to 135° (270° total)
    const startAngle = -135;
    const endAngle = 135;
    const angleRange = endAngle - startAngle;

    // Calculate current angle based on value (0-100)
    const currentAngle = startAngle + (value / 100) * angleRange;

    // Convert to radians for calculations
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const currentRad = (currentAngle - 90) * (Math.PI / 180);

    // Calculate arc path
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    const currentX = centerX + radius * Math.cos(currentRad);
    const currentY = centerY + radius * Math.sin(currentRad);

    // Determine color based on value
    const getColor = () => {
        if (value >= 70) return { primary: '#10b981', secondary: '#34d399' };
        if (value >= 40) return { primary: '#f59e0b', secondary: '#fbbf24' };
        return { primary: '#ef4444', secondary: '#f87171' };
    };

    const colors = getColor();

    const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="gauge-chart" style={{
            width: size,
            height: size,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <svg width={size} height={size}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8" />
                    </linearGradient>
                </defs>

                {/* Background arc */}
                <path
                    d={`M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />

                {/* Value arc */}
                <path
                    d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${value > 50 ? 1 : 0} 1 ${currentX} ${currentY}`}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="12"
                    strokeLinecap="round"
                    style={{
                        transition: 'stroke-dasharray 1.5s ease-out',
                        filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))'
                    }}
                />

                {/* Center dot */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r="4"
                    fill={colors.primary}
                    opacity="0.5"
                />
            </svg>

            {/* Value text */}
            <div style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
            }}>
                <span style={{
                    fontSize: `${size * 0.25}px`,
                    fontWeight: '700',
                    color: colors.primary,
                    lineHeight: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                    {Math.round(value)}%
                </span>
                {showLabel && (
                    <span style={{
                        fontSize: `${size * 0.08}px`,
                        color: 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                    }}>
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
};

export default GaugeChart;
