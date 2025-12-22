import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CalendarView = ({
    monthKey, // 'YYYY-MM'
    snapshots,
    selectedWeek,
    onSelectDay,
    onDeleteSnapshot
}) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

    // Adjust for Monday start (0=Mon, 6=Sun) if desired, but standard usually starts Sunday.
    // Let's assume standard Sunday start for visual, or Monday if business prefers?
    // User data is weekly, likely Mondays. Let's stick to standard calendar grid.
    // Actually, `getCurrentWeekMonday` suggests weekly snapshots.

    // Map snapshots to days
    const snapshotDays = useMemo(() => {
        const map = {};
        snapshots.forEach(snap => {
            const dateStr = snap.dateId || snap.id; // 'YYYY-MM-DD'
            const day = parseInt(dateStr.split('-')[2]);
            map[day] = snap;
        });
        return map;
    }, [snapshots]);

    const days = [];
    // Pad empty days
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
        <div className="calendar-popup" style={{ padding: '12px', width: '280px' }}>
            <div className="calendar-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', textAlign: 'center' }}>
                {WEEKDAYS.map(d => (
                    <div key={d} style={{ fontSize: '10px', color: '#888', fontWeight: 600 }}>{d}</div>
                ))}
            </div>
            <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;

                    const snapshot = snapshotDays[day];
                    const snapId = snapshot ? (snapshot.dateId || snapshot.id) : null;
                    const isSelected = selectedWeek === snapId;

                    return (
                        <div
                            key={day}
                            className={`calendar-day ${snapshot ? 'has-snapshot' : ''} ${isSelected ? 'selected' : ''}`}
                            style={{
                                aspectRatio: '1/1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                borderRadius: '50%',
                                cursor: snapshot ? 'pointer' : 'default',
                                position: 'relative',
                                background: isSelected ? 'rgba(0,0,0,0.8)' : snapshot ? 'rgba(0,0,0,0.05)' : 'transparent',
                                color: isSelected ? 'white' : snapshot ? '#333' : '#ccc',
                                border: snapshot && !isSelected ? '1px solid rgba(0,0,0,0.1)' : 'none'
                            }}
                            onClick={() => snapshot && onSelectDay(snapId)}
                            title={snapshot ? `Snapshot: ${snapId}` : ''}
                        >
                            {day}
                            {/* Dot indicator for snapshot if not selected (to show it exists) */}
                            {snapshot && !isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    width: '3px',
                                    height: '3px',
                                    borderRadius: '50%',
                                    background: '#333'
                                }} />
                            )}

                            {/* Delete button (only show on hover or specific interaction could be tricky here, 
                                let's put it next to selection details or use right click context? 
                                User asked for "compact". Maybe long press? 
                                Or simply, if selected, show a delete option below the calendar?) */}
                        </div>
                    );
                })}
            </div>

            {/* Delete Action for active selection */}
            {selectedWeek && isOnSnapshotList(selectedWeek) && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Semana: {selectedWeek}</span>
                    <button
                        onClick={(e) => onDeleteSnapshot(selectedWeek, e)}
                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                        <Trash2 size={12} /> Eliminar
                    </button>
                </div>
            )}

            {/* Monthly Aggregate Button */}
            {!selectedWeek && (
                <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                    Visualizando Acumulado Mensual
                </div>
            )}
        </div>
    );

    function isOnSnapshotList(id) {
        return snapshots.some(s => (s.dateId || s.id) === id);
    }
};

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
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const availableMonths = Object.keys(snapshotsByMonth || {}).sort().reverse();

    // Check if snapshots list is valid
    const currentMonthSnapshots = selectedMonth && snapshotsByMonth[selectedMonth] ? snapshotsByMonth[selectedMonth] : [];

    const handleMonthClick = (monthKey) => {
        onSelectMonth(monthKey);
        setIsMonthDropdownOpen(false);
        setIsCalendarOpen(false); // Reset calendar when month changes
    };

    const handleDaySelect = (dateId) => {
        onSelectWeek(dateId);
        setIsCalendarOpen(false);
    };

    const handleAggregateClick = () => {
        onSelectWeek(null);
        setIsCalendarOpen(false);
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
                            setIsCalendarOpen(false);
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

                {/* Calendar/Snapshot Selector - Only show if a month is selected and has snapshots */}
                {selectedMonth && currentMonthSnapshots.length > 0 && (
                    <div className="selector-group" style={{ position: 'relative' }}>
                        <button
                            className="selector-btn week-btn"
                            onClick={() => {
                                setIsCalendarOpen(!isCalendarOpen);
                                setIsMonthDropdownOpen(false);
                            }}
                            title="Seleccionar fecha específica o acumulado"
                        >
                            {selectedWeek ? formatWeekLabel(selectedWeek) : 'Acumulado Mensual'}
                            <Calendar size={16} style={{ marginLeft: '6px' }} />
                        </button>

                        <AnimatePresence>
                            {isCalendarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="selector-dropdown calendar-container"
                                    style={{ width: 'auto', padding: 0, overflow: 'hidden' }}
                                >
                                    {/* Header: Aggregate Option */}
                                    <div
                                        className={`selector-option ${!selectedWeek ? 'active' : ''}`}
                                        onClick={handleAggregateClick}
                                        style={{ borderBottom: '1px solid #eee' }}
                                    >
                                        📊 Ver Acumulado Mensual
                                    </div>

                                    <CalendarView
                                        monthKey={selectedMonth}
                                        snapshots={currentMonthSnapshots}
                                        selectedWeek={selectedWeek}
                                        onSelectDay={handleDaySelect}
                                        onDeleteSnapshot={onDeleteSnapshot}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PeriodSelector;
