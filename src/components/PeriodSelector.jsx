import React, { useState } from 'react';
import { Calendar, ChevronDown, Trash2 } from 'lucide-react';

const PeriodSelector = ({
    selectedMonth,
    selectedWeek,
    snapshotsByMonth, // Object: { '2023-10': [snapshots...] }
    onSelectMonth,
    onSelectWeek,
    onDeleteSnapshot,
    formatMonthLabel,
    formatWeekLabel,
    label = "Periodo Principal",
    allowCurrentData = true,
    className = ""
}) => {
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);

    const availableMonths = Object.keys(snapshotsByMonth || {}).sort().reverse();

    // Check if snapshots list is valid
    const currentMonthSnapshots = selectedMonth && snapshotsByMonth[selectedMonth] ? snapshotsByMonth[selectedMonth] : [];

    const handleMonthClick = (monthKey) => {
        onSelectMonth(monthKey);
        setIsMonthDropdownOpen(false);
        setIsWeekDropdownOpen(false); // Reset week dropdown when month changes
    };

    const handleWeekClick = (weekId) => {
        onSelectWeek(weekId);
        setIsWeekDropdownOpen(false);
    };

    const handleDeleteClick = (e, snapshotId) => {
        e.stopPropagation();
        if (onDeleteSnapshot) {
            onDeleteSnapshot(snapshotId, e);
        }
    };

    return (
        <div className={`period-selector-component ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {label && (
                <div className="selector-label" style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    {label}
                </div>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
                {/* Month Selector */}
                <div className="selector-group" style={{ position: 'relative' }}>
                    <button
                        className="selector-btn"
                        onClick={() => {
                            setIsMonthDropdownOpen(!isMonthDropdownOpen);
                            setIsWeekDropdownOpen(false);
                        }}
                    >
                        <Calendar size={16} />
                        {selectedMonth ? formatMonthLabel(selectedMonth) : (allowCurrentData ? 'Datos Actuales' : 'Seleccionar Mes')}
                        <ChevronDown size={16} />
                    </button>

                    {isMonthDropdownOpen && (
                        <div className="selector-dropdown">
                            {allowCurrentData && (
                                <>
                                    <div
                                        className={`selector-option ${!selectedMonth ? 'active' : ''}`}
                                        onClick={() => handleMonthClick(null)}
                                    >
                                        📊 Datos Actuales
                                    </div>
                                    {availableMonths.length > 0 && <div className="selector-divider"></div>}
                                </>
                            )}

                            {availableMonths.map(monthKey => (
                                <div
                                    key={monthKey}
                                    className={`selector-option ${selectedMonth === monthKey ? 'active' : ''}`}
                                    onClick={() => handleMonthClick(monthKey)}
                                >
                                    📆 {formatMonthLabel(monthKey)}
                                    <span className="week-count">{snapshotsByMonth[monthKey].length} sem</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Week Selector - Only show if a month is selected and has snapshots */}
                {selectedMonth && currentMonthSnapshots.length > 0 && (
                    <div className="selector-group" style={{ position: 'relative' }}>
                        <button
                            className="selector-btn week-btn"
                            onClick={() => {
                                setIsWeekDropdownOpen(!isWeekDropdownOpen);
                                setIsMonthDropdownOpen(false);
                            }}
                        >
                            {selectedWeek ? formatWeekLabel(selectedWeek) : 'Acumulado Mensual'}
                            <ChevronDown size={16} />
                        </button>

                        {isWeekDropdownOpen && (
                            <div className="selector-dropdown">
                                <div
                                    className={`selector-option ${!selectedWeek ? 'active' : ''}`}
                                    onClick={() => handleWeekClick(null)}
                                >
                                    📊 Acumulado Mensual
                                </div>
                                <div className="selector-divider"></div>
                                {currentMonthSnapshots.map(snap => {
                                    const snapId = snap.dateId || snap.id;
                                    return (
                                        <div
                                            key={snapId}
                                            className={`selector-option ${selectedWeek === snapId ? 'active' : ''}`}
                                            onClick={() => handleWeekClick(snapId)}
                                        >
                                            <span>📅 {formatWeekLabel(snapId)}</span>
                                            {onDeleteSnapshot && (
                                                <button
                                                    className="snapshot-delete-btn"
                                                    onClick={(e) => handleDeleteClick(e, snapId)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeriodSelector;
