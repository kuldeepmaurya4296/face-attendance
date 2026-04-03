import React, { useState } from 'react';
import api from '@/lib/api';
import { CameraCapture } from '@/components/CameraCapture';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserRegistrationModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState({ name: '', email: '', role: 'Employee', department: '', password: '' });
  const [userFace, setUserFace] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFace) return alert("Face ID is required.");
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', userFace);
      const mlRes = await fetch(`/api/ml/register`, { method: 'POST', body: formData });
      const mlData = await mlRes.json();
      
      if (!mlData.success) {
        throw new Error(mlData.detail || 'Face extraction failed.');
      }

      await api.post('/auth/register', {
        ...userData, 
        company_id: user?.company_id, 
        face_embeddings: mlData.embeddings
      });

      alert(`${userData.role} successfully registered.`);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 overflow-y-auto">
      <div className="border border-border rounded-lg bg-white max-w-2xl w-full p-8 space-y-6 my-8">
        <h3 className="text-[24px] font-bold text-center">Register New User</h3>
        {error && <div className="p-3 bg-red-50 text-danger text-[14px] text-center rounded-md">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            <input required type="email" placeholder="Email" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            <input required type="password" placeholder="Password" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            <input required placeholder="Department" value={userData.department} onChange={e => setUserData({...userData, department: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
            <select required value={userData.role} onChange={e => setUserData({...userData, role: e.target.value})} className="col-span-2 bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]">
              <option value="Employee">Employee (Company)</option>
              <option value="Student">Student (College)</option>
              <option value="User">General User</option>
              <option value="Admin">System Admin</option>
            </select>
          </div>
          <div className="space-y-2">
             <div className="rounded-md border-2 border-dashed border-border p-2 bg-surface flex items-center justify-center min-h-[300px] relative">
               {userFace ? (
                  <div className="relative w-full h-full">
                    <img src={URL.createObjectURL(userFace)} className="w-full h-full object-cover rounded-md" alt="Captured" />
                    <button type="button" onClick={() => setUserFace(null)} className="absolute top-2 right-2 p-2 bg-danger rounded-md text-white"><Trash2 size={16}/></button>
                  </div>
               ) : (
                  <CameraCapture onCapture={setUserFace} blinkMode={true} />
               )}
             </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium">Cancel</button>
            <button disabled={loading || !userFace} type="submit" className="flex-[2] p-3 rounded-md bg-primary text-white text-[14px] font-medium">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}