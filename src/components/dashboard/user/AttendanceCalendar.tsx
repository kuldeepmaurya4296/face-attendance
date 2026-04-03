'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'Present': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '✓' },
  'Late': { bg: 'bg-amber-100', text: 'text-amber-700', label: '⚠' },
  'Half-Day': { bg: 'bg-orange-100', text: 'text-orange-700', label: '◐' },
  'Absent': { bg: 'bg-red-100', text: 'text-red-700', label: '✗' },
  'On-Leave': { bg: 'bg-violet-100', text: 'text-violet-700', label: '📋' },
  'Holiday': { bg: 'bg-sky-100', text: 'text-sky-700', label: '🎉' },
  'Weekend': { bg: 'bg-gray-100', text: 'text-gray-400', label: '—' },
  'Early-Departure': { bg: 'bg-pink-100', text: 'text-pink-700', label: '⏪' },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendanceCalendar() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/monthly?month=${month}&year=${year}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday = 0, Sunday = 6 for our grid
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const calendarCells: (any | null)[] = [];
  for (let i = 0; i < startDow; i++) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = data.find(d => d.date === dateStr);
    calendarCells.push({ day, ...dayData });
  }

  // Summary counts
  const summary: Record<string, number> = {};
  data.forEach(d => {
    if (d.status) summary[d.status] = (summary[d.status] || 0) + 1;
  });

  const monthName = new Date(year, month - 1).toLocaleString(undefined, { month: 'long' });

  return (
    <div className="border border-border rounded-lg bg-white p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Attendance Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-surface border border-border"><ChevronLeft size={16} /></button>
          <span className="text-[14px] font-semibold min-w-[140px] text-center">{monthName} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-surface border border-border"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(summary).map(([status, count]) => {
          const color = STATUS_COLORS[status];
          if (!color) return null;
          return (
            <span key={status} className={`px-2 py-0.5 rounded text-[12px] font-medium ${color.bg} ${color.text}`}>
              {count} {status}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : (
        <>
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-muted py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;

              const status = cell.status;
              const colors = status ? STATUS_COLORS[status] : null;
              const isToday = cell.is_today;

              return (
                <button
                  key={`day-${cell.day}`}
                  onClick={() => setSelectedDay(cell)}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[13px] font-medium transition-all hover:scale-105 relative ${
                    colors ? `${colors.bg} ${colors.text}` : 'bg-surface text-muted'
                  } ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                >
                  <span className="text-[12px]">{cell.day}</span>
                  {colors && <span className="text-[10px] leading-none">{colors.label}</span>}
                  {isToday && !status && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border-light">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1 text-[11px] text-muted">
                <span className={`w-3 h-3 rounded ${color.bg} flex items-center justify-center text-[8px] ${color.text}`}>{color.label}</span>
                {status}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Popover for selected day */}
      {selectedDay && selectedDay.status && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedDay(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white border border-border rounded-lg p-6 max-w-sm w-full m-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[16px] font-bold">
                {new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${STATUS_COLORS[selectedDay.status]?.bg} ${STATUS_COLORS[selectedDay.status]?.text}`}>
                {selectedDay.status}
              </span>
            </div>

            {selectedDay.holiday_name && (
              <p className="text-[14px] text-sky-700 font-medium">🎉 {selectedDay.holiday_name}</p>
            )}

            {selectedDay.check_in && (
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-muted">Check In</span>
                  <span className="font-medium">{new Date(selectedDay.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {selectedDay.check_out && (
                  <div className="flex justify-between">
                    <span className="text-muted">Check Out</span>
                    <span className="font-medium">{new Date(selectedDay.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {selectedDay.work_hours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Work Hours</span>
                    <span className="font-medium">{selectedDay.work_hours}h</span>
                  </div>
                )}
                {selectedDay.is_late && (
                  <div className="flex justify-between">
                    <span className="text-muted">Late By</span>
                    <span className="font-medium text-amber-600">{selectedDay.late_minutes} min</span>
                  </div>
                )}
                {selectedDay.is_overtime && (
                  <div className="flex justify-between">
                    <span className="text-muted">Overtime</span>
                    <span className="font-medium text-blue-600">Yes</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Mode</span>
                  <span className="font-medium">{selectedDay.mode}</span>
                </div>
              </div>
            )}

            <button onClick={() => setSelectedDay(null)} className="w-full p-2 rounded-md bg-surface border border-border text-[13px] font-medium mt-2">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
