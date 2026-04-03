'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/dashboard/shared/PageHeader';
import { Loader2, Plus, Calendar, Trash2, Edit } from 'lucide-react';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '', type: 'Public' });
  const [saving, setSaving] = useState(false);

  const fetchHolidays = () => {
    setLoading(true);
    api.get(`/holidays?year=${year}`).then(res => {
      setHolidays(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/holidays', formData);
      setShowModal(false);
      setFormData({ date: '', name: '', type: 'Public' });
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove holiday "${name}"?`)) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchHolidays();
    } catch(err: any) {
      alert('Failed to delete');
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Holiday Calendar" subtitle="Manage non-working days" />

      <div className="border border-border rounded-lg bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[16px] font-bold">Holidays List</h3>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-surface border border-border rounded px-2 py-1 text-[13px] outline-none">
              {[year-1, year, year+1, year+2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-[14px]">
             <Plus size={16} /> Add Holiday
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                <tr>
                  <th className="p-3 px-4 w-12 text-center"><Calendar size={14} className="mx-auto" /></th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Holiday Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {holidays.map(h => (
                  <tr key={h._id} className="border-t border-border-light hover:bg-surface">
                    <td className="p-3 px-4 text-center">
                      <div className="w-8 h-8 rounded bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-[12px]">
                        {new Date(h.date).getDate()}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-[13px]">{new Date(h.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', weekday: 'short' })}</td>
                    <td className="p-3 text-[14px]">{h.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        h.type === 'Public' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>{h.type}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(h._id, h.name)} className="p-1.5 text-muted hover:text-danger rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">No holidays defined for {year}.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="text-[18px] font-bold">Add Holiday</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-border p-2 rounded text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Holiday Name</label>
                <input required placeholder="E.g. Diwali" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-border p-2 rounded text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-border p-2 rounded text-[14px]">
                  <option value="Public">Public Holiday</option>
                  <option value="Company">Company Holiday</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-2 bg-surface border border-border rounded text-[13px] font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 p-2 bg-primary text-white rounded text-[13px] font-medium flex justify-center">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
