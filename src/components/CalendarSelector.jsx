import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

const CalendarSelector = ({
    selectedMonth, // '2025-12'
    selectedDate, // '2025-12-15' or null for acumulado
    snapshotsByMonth, // { '2025-12': [snapshots...] }
    onSelectMonth,
    onSelectDate,
    formatMonthLabel,
    label = "",
    allowCurrentData = true,
    className = ""
}) => {
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Get available months
    const availableMonths = Object.keys(snapshotsByMonth || {}).sort().reverse();

    // Parse selected month
    const monthSnapshots = selectedMonth && snapshotsByMonth[selectedMonth] ? snapshotsByMonth[selectedMonth] : [];

    const snapshotDates = useMemo(() => {
        return new Set(monthSnapshots.map(snap => {
            const dateId = snap.dateId || snap.id;
            return new Date(dateId + 'T00:00:00').getDate();
        }));
    }, [monthSnapshots]);

    // Handle month selection
    const handleMonthSelect = (monthKey) => {
        onSelectMonth(monthKey);
        setIsMonthDropdownOpen(false);
        if (monthKey) {
            setIsCalendarOpen(true); // Open calendar when month is selected
        }
    };

    // Handle date click
    const handleDateClick = (day) => {
        if (!snapshotDates.has(day)) return;

        const [year, month] = selectedMonth.split('-');
        const dateId = `${year}-${month}-${String(day).padStart(2, '0')}`;
        onSelectDate(dateId);
        setIsCalendarOpen(false); // Close calendar after selection
    };

    // Handle acumulado
    const handleAcumuladoClick = () => {
        onSelectDate(null);
        setIsCalendarOpen(false);
    };

    // Check if date is selected
    const isDateSelected = (day) => {
        if (!selectedDate || !selectedMonth) return false;
        const selectedDay = new Date(selectedDate + 'T00:00:00').getDate();
        return selectedDay === day;
    };

    // Build calendar grid
    const buildCalendarGrid = () => {
        if (!selectedMonth) return null;

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

        const calendarDays = [];

        // Empty cells before first day
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const hasSnapshot = snapshotDates.has(day);
            const isSelected = isDateSelected(day);
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();

            calendarDays.push(
                <div
                    key={day}
                    className={`calendar-day ${hasSnapshot ? 'has-snapshot' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => hasSnapshot && handleDateClick(day)}
                    style={{ cursor: hasSnapshot ? 'pointer' : 'default' }}
                >
                    <span className="day-number">{day}</span>
                    {hasSnapshot && <div className="snapshot-indicator"></div>}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className={`calendar-selector ${className}`}>
            {label && <div className="calendar-label">{label}</div>}

            {/* Month Dropdown */}
            <div className="calendar-month-selector" style={{ position: 'relative' }}>
                <button
                    className="selector-btn"
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
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
                                    onClick={() => handleMonthSelect(null)}
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
                                onClick={() => handleMonthSelect(monthKey)}
                            >
                                📆 {formatMonthLabel(monthKey)}
                                <span className="week-count">{snapshotsByMonth[monthKey].length} snap</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Calendar Grid - Only show when month is selected and calendar is open */}
            {selectedMonth && isCalendarOpen && (
                <div className="calendar-popup">
                    <div className="calendar-popup-header">
                        <span className="calendar-popup-title">{formatMonthLabel(selectedMonth)}</span>
                        <button className="calendar-close-btn" onClick={() => setIsCalendarOpen(false)}>×</button>
                    </div>

                    {/* Weekday headers */}
                    <div className="calendar-weekdays">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                            <div key={i} className="calendar-weekday">{day}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="calendar-grid">
                        {buildCalendarGrid()}
                    </div>

                    {/* Actions */}
                    <div className="calendar-actions">
                        <button
                            className={`calendar-action-btn ${!selectedDate ? 'active' : ''}`}
                            onClick={handleAcumuladoClick}
                        >
                            📊 Acumulado Mensual
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarSelector;
