'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme, ThemeType } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { CameraCapture } from "@/components/CameraCapture";
import {
  LayoutDashboard, LogOut, Building, CheckCircle, Plus, Loader2,
  Users, Calendar, Camera, Trash2, FileText, Send, ChevronLeft,
  X, Shield, Star, Clock, Pencil
} from "lucide-react";

export default function DashboardLayout({ params }: { params: Promise<{ role: string }> }) {
  const { user, logout, isLoading } = useAuth();
  const { theme: currentTheme, setTheme } = useTheme();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [companyAttendance, setCompanyAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  
  const [isOnboardingCompany, setIsOnboardingCompany] = useState(false);
  const [onboardData, setOnboardData] = useState({ companyName: '', plan: 'Free', adminName: '', adminEmail: '', adminPassword: '' });
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [companyPersonnel, setCompanyPersonnel] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', role: 'User', department: '', password: '' });
  const [userFace, setUserFace] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [leaveData, setLeaveData] = useState({ reason: '', date: '' });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [compSettings, setCompSettings] = useState({ office_timing: '09:00', late_threshold_minutes: 15 });

  // Edit user state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editData, setEditData] = useState({ name: '', email: '', department: '', role: '', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const { role } = React.use(params);

  useEffect(() => {
    setLeaveData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));

    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (user?.role === 'Owner') {
      api.get('/companies').then(res => setCompanies(res.data));
    }

    if (user?.role === 'SuperAdmin' || user?.role === 'Admin') {
      api.get('/users').then(res => setPersonnel(res.data));
      api.get('/leaves').then(res => setLeaves(res.data));
      api.get('/attendance/company').then(res => setCompanyAttendance(res.data)).catch(() => {});
      
      if (user?.company_id) {
         api.get(`/companies/${user.company_id}`).then(res => {
            setCompSettings({ 
               office_timing: res.data.settings?.office_timing || '09:00', 
               late_threshold_minutes: res.data.settings?.late_threshold_minutes || 15 
            });
         });
      }
    }

    if (user?.role === 'User') {
       api.get('/attendance').then(res => setAttendance(res.data));
       api.get('/leaves').then(res => setLeaves(res.data));
    }
  }, [user, isLoading, router]);

  const handleOnboardCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/companies/onboard', onboardData);
      alert("New tenant company and SuperAdmin successfully onboarded.");
      setIsOnboardingCompany(false);
      setOnboardData({ companyName: '', plan: 'Free', adminName: '', adminEmail: '', adminPassword: '' });
      api.get('/companies').then(res => setCompanies(res.data));
    } catch (err: any) {
      alert(err.response?.data?.error || "Onboarding failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectCompany = async (company: any) => {
    setSelectedCompany(company);
    setLoadingMembers(true);
    try {
      const res = await api.get('/users');
      setCompanyPersonnel(res.data.filter((u: any) => u.company_id === company._id));
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOnboardUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFace) return alert("Face ID is required. Look at camera and blink to capture.");
    setActionLoading(true);
    setRegistrationError('');

    try {
      // Step 1: Get face embeddings from the captured image
      const formData = new FormData();
      formData.append('file', userFace);
      
      const mlRes = await fetch(`/api/ml/register`, {
        method: 'POST', body: formData
      });
      const mlData = await mlRes.json();
      
      if (!mlData.success) {
        setRegistrationError(mlData.detail || 'Face extraction failed.');
        setActionLoading(false);
        return;
      }

      // Step 2: Check for duplicate face in the company gallery
      if (user?.company_id) {
        const galleryRes = await api.get(`/users/gallery/${user.company_id}`);
        const gallery = galleryRes.data;
        
        if (gallery.length > 0) {
          const dupFormData = new FormData();
          dupFormData.append('file', userFace);
          dupFormData.append('gallery_data', JSON.stringify(gallery));
          
          const dupRes = await fetch(`/api/ml/check-duplicate`, {
            method: 'POST', body: dupFormData
          });
          const dupData = await dupRes.json();
          
          if (dupData.duplicate) {
            const matchedUser = gallery.find((g: any) => g.user_id === dupData.matched_user_id);
            const matchName = matchedUser ? matchedUser.name : 'unknown';
            setRegistrationError(`This face is already registered to "${matchName}". Each person can only have one account.`);
            setActionLoading(false);
            return;
          }
        }
      }

      // Step 3: Register the user
      await api.post('/auth/register', {
        ...userData, 
        company_id: user?.company_id, 
        face_embeddings: mlData.embeddings, 
        department: userData.department
      });

      alert(`${userData.role} successfully registered.`);
      setIsAddingUser(false);
      setUserData({ name: '', email: '', role: 'User', department: '', password: '' });
      setUserFace(null);
      setRegistrationError('');
      api.get('/users').then(res => setPersonnel(res.data));
    } catch (err: any) {
      setRegistrationError(err.response?.data?.error || "User registration failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await api.post('/leaves', leaveData);
       alert("Leave successfully requested.");
       setIsApplyingLeave(false);
       api.get('/leaves').then(res => setLeaves(res.data));
    } catch (err: any) {
       alert(err.response?.data?.error || "Failed to submit request.");
    }
  };

  // DELETE user handler
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      alert(`"${userName}" has been deleted.`);
      // Refresh personnel and attendance lists
      api.get('/users').then(res => setPersonnel(res.data));
      api.get('/attendance/company').then(res => setCompanyAttendance(res.data)).catch(() => {});
      api.get('/leaves').then(res => setLeaves(res.data)).catch(() => {});
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  // EDIT user — open modal
  const handleOpenEdit = (u: any) => {
    setEditTarget(u);
    setEditData({ name: u.name, email: u.email, department: u.department || '', role: u.role, password: '' });
    setEditError('');
    setIsEditingUser(true);
  };

  // EDIT user — submit
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/users/${editTarget._id}`, editData);
      alert(`"${editData.name}" updated successfully.`);
      setIsEditingUser(false);
      setEditTarget(null);
      // Refresh personnel list
      api.get('/users').then(res => setPersonnel(res.data));
      api.get('/attendance/company').then(res => setCompanyAttendance(res.data)).catch(() => {});
      api.get('/leaves').then(res => setLeaves(res.data)).catch(() => {});
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="border border-border rounded-lg bg-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
               <h1 className="text-[16px] font-bold text-foreground">Aura Dashboard</h1>
               <p className="text-[12px] text-muted capitalize">{role} Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[14px] font-medium">{user.name}</p>
              <p className="text-[12px] text-primary">{user.role}</p>
            </div>
            <button onClick={logout} className="p-2 border border-border rounded-md hover:bg-surface text-muted hover:text-danger">
               <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg bg-white p-6 col-span-1 lg:col-span-2">
            <h2 className="text-[24px] font-bold text-foreground mb-4">
              {role === 'platform' && selectedCompany ? `${selectedCompany.name} — Overview` : 'Dashboard Overview'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: role === 'platform' ? 'Companies' : 'Personnel', value: role === 'platform' ? (selectedCompany ? companyPersonnel.length : companies.length) : personnel.length, icon: Users, color: 'text-primary' },
                { label: 'Attendance', value: (role === 'admin' || role === 'company') ? companyAttendance.length : attendance.length, icon: CheckCircle, color: 'text-success' },
                { label: 'Leave Requests', value: leaves.length || '0', icon: FileText, color: 'text-warning' },
                { label: 'Security', value: 'AES-256', icon: Shield, color: 'text-info' },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-surface rounded-md border border-border-light">
                  <stat.icon size={16} className={`${stat.color} mb-2`} />
                  <p className="text-[12px] text-muted mb-1">{stat.label}</p>
                  <p className="text-[16px] font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg bg-white p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-[12px] font-semibold text-muted uppercase">Quick Actions</h3>
              <div className="space-y-2">
                {user.role === 'Owner' && (
                  <button onClick={() => setIsOnboardingCompany(true)} className="w-full p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2"><Plus size={16}/> Onboard Company</span>
                  </button>
                )}
                {(user.role === 'SuperAdmin' || user.role === 'Admin') && (
                  <button onClick={() => { setIsAddingUser(true); setRegistrationError(''); setUserFace(null); }} className="w-full p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2"><Plus size={16}/> Register User</span>
                  </button>
                )}
                {user.role === 'User' && (
                  <button onClick={() => setIsApplyingLeave(true)} className="w-full p-3 rounded-md bg-surface hover:bg-surface-hover border border-border text-[14px] font-medium flex items-center gap-2">
                    <Send size={16} /> Apply for Leave
                  </button>
                )}
                <button onClick={() => router.push('/kiosk')} className="w-full p-3 rounded-md bg-surface hover:bg-surface-hover border border-border text-[14px] font-medium flex items-center gap-2">
                  <Camera size={16} /> Open Kiosk
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Modules */}
        <div className="grid grid-cols-1 gap-6">
           
          {/* PLATFORM OWNER */}
          {role === 'platform' && (
            <>
              {!selectedCompany ? (
                <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                  <h3 className="text-[16px] font-bold">Companies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(c => (
                      <div key={c._id} className="p-5 bg-surface rounded-md border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-[14px]">{c.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${c.plan === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.plan}</span>
                        </div>
                        <button onClick={() => handleInspectCompany(c)} className="w-full py-2 bg-white border border-border rounded-md text-[12px] font-medium hover:bg-surface-hover">View Details</button>
                      </div>
                    ))}
                    {companies.length === 0 && <div className="col-span-full py-12 text-center text-muted text-[14px]">No companies found. Start onboarding.</div>}
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedCompany(null)} className="p-2 bg-surface border border-border rounded-md hover:bg-surface-hover">
                        <ChevronLeft size={18} />
                      </button>
                      <div>
                        <h3 className="text-[16px] font-bold">{selectedCompany.name} — Personnel</h3>
                        <p className="text-[12px] text-muted">Company members list</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-md border border-border">
                    {loadingMembers ? (
                      <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                          <tr>
                            <th className="p-3 px-4">Name</th>
                            <th className="p-3">Department</th>
                            <th className="p-3 text-center">Face ID</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-[14px]">
                          {companyPersonnel.map(u => (
                            <tr key={u._id} className="border-t border-border-light hover:bg-surface">
                              <td className="p-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center font-semibold text-primary text-[14px]">{u.name[0]}</div>
                                  <div>
                                    <p className="font-medium text-[14px]">{u.name}</p>
                                    <p className="text-[12px] text-muted">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3"><span className="text-[12px] text-muted">{u.department || 'General'}</span></td>
                              <td className="p-3 text-center">
                                {u.has_face_id ? <CheckCircle size={16} className="text-success mx-auto" /> : <X size={16} className="text-danger mx-auto" />}
                              </td>
                              <td className="p-3 text-right">
                                <button className="p-1.5 text-muted hover:text-danger"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SUPERADMIN/ADMIN - Personnel + Attendance */}
          {(role === 'admin' || role === 'company') && (
            <>
              {/* Personnel Table */}
              <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                <h3 className="text-[16px] font-bold">Organization Personnel</h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-left">
                    <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                      <tr>
                        <th className="p-3 px-4">Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Role</th>
                        <th className="p-3 text-center">Face ID</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px]">
                      {personnel.map(u => (
                        <tr key={u._id} className="border-t border-border-light hover:bg-surface">
                          <td className="p-3 px-4">
                            <p className="font-medium text-[14px]">{u.name}</p>
                            <p className="text-[12px] text-muted">{u.email}</p>
                          </td>
                          <td className="p-3 text-[12px] text-muted">{u.department || 'General'}</td>
                          <td className="p-3 text-[12px]">
                            <span className={`px-2 py-0.5 rounded font-medium ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-center text-[12px]">
                            {u.has_face_id ? (
                              <span className="text-success font-medium">Registered</span>
                            ) : (
                              <span className="text-danger font-medium">Required</span>
                            )}
                          </td>
                          <td className="p-3 text-right flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenEdit(u)} className="p-1.5 text-muted hover:text-primary" title="Edit user">
                              <Pencil size={16} />
                            </button>
                            {u.role !== 'SuperAdmin' && (
                              <button onClick={() => handleDeleteUser(u._id, u.name)} className="p-1.5 text-muted hover:text-danger" title="Delete user">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Records Table */}
              <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold">Attendance Records</h3>
                  <span className="text-[12px] text-muted">{companyAttendance.length} records</span>
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-left">
                    <thead className="bg-surface text-[12px] font-semibold text-muted border-b border-border">
                      <tr>
                        <th className="p-3 px-4">Employee</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Check In</th>
                        <th className="p-3">Check Out</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px]">
                      {companyAttendance.map(a => (
                        <tr key={a._id} className="border-t border-border-light hover:bg-surface">
                          <td className="p-3 px-4">
                            <p className="font-medium text-[14px]">{a.user_id?.name || 'Unknown'}</p>
                            <p className="text-[12px] text-muted">{a.user_id?.email || ''}</p>
                          </td>
                          <td className="p-3 text-[12px]">
                            {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-3 text-[12px]">
                            {a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="p-3 text-[12px]">
                            {a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="p-3 text-[12px] text-muted">{a.mode}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${
                              a.status === 'Present' ? 'bg-green-100 text-green-700' : 
                              a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>{a.status}</span>
                          </td>
                        </tr>
                      ))}
                      {companyAttendance.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted text-[14px]">No attendance records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* USER - Attendance & Leaves */}
          {role === 'user' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                <h3 className="text-[16px] font-bold">Attendance Log</h3>
                <div className="space-y-2">
                  {attendance.map(a => (
                    <div key={a._id} className="p-4 bg-surface rounded-md flex items-center justify-between border border-border-light">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-primary" />
                        <div>
                          <p className="font-medium text-[14px]">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                          <p className="text-[12px] text-muted">Check-in: {new Date(a.check_in).toLocaleTimeString()} — {a.mode}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${a.status === 'Present' ? 'bg-green-100 text-green-700' : a.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                    </div>
                  ))}
                  {attendance.length === 0 && <div className="py-8 text-center text-muted text-[14px]">No attendance records found.</div>}
                </div>
              </div>

              <div className="border border-border rounded-lg bg-white p-6 space-y-4">
                <h3 className="text-[16px] font-bold">Leave Requests</h3>
                <div className="space-y-2">
                  {leaves.map(l => (
                    <div key={l._id} className="p-4 bg-surface rounded-md flex items-center justify-between border border-border-light">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-warning" />
                        <div>
                          <p className="font-medium text-[14px]">{new Date(l.date).toLocaleDateString()}</p>
                          <p className="text-[12px] text-muted truncate max-w-[200px]">{l.reason}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[12px] font-medium ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Onboard Company Modal */}
      {isOnboardingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="border border-border rounded-lg bg-white max-w-xl w-full p-8 space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-[24px] font-bold">Onboard Company</h3>
              <p className="text-[12px] text-muted">Create a new tenant organization</p>
            </div>
            <form onSubmit={handleOnboardCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-muted">Organization Name</label>
                  <input required placeholder="E.g. Acme Corp" value={onboardData.companyName} onChange={e => setOnboardData({...onboardData, companyName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">SuperAdmin Name</label>
                  <input required placeholder="Name" value={onboardData.adminName} onChange={e => setOnboardData({...onboardData, adminName: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">SuperAdmin Email</label>
                  <input required type="email" placeholder="Email" value={onboardData.adminEmail} onChange={e => setOnboardData({...onboardData, adminEmail: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-muted">Password</label>
                  <input required type="password" placeholder="••••••••" value={onboardData.adminPassword} onChange={e => setOnboardData({...onboardData, adminPassword: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOnboardingCompany(false)} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover">Cancel</button>
                <button disabled={actionLoading} type="submit" className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium">
                  {actionLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Confirm Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal — with blink-based Face ID */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 overflow-y-auto">
          <div className="border border-border rounded-lg bg-white max-w-2xl w-full p-8 space-y-6 my-8">
            <h3 className="text-[24px] font-bold text-center">Register New User</h3>
            
            {registrationError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-[14px] text-center">
                {registrationError}
              </div>
            )}
            
            <form onSubmit={handleOnboardUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Full Name" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                <input required type="email" placeholder="Email" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                <input required minLength={6} type="password" placeholder="Password for login" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                <input required placeholder="Department (HR, IT, etc.)" value={userData.department} onChange={e => setUserData({...userData, department: e.target.value})} className="bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
                <select required value={userData.role} onChange={e => setUserData({...userData, role: e.target.value})} className="col-span-2 bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]">
                  <option value="User">User Account</option>
                  <option value="Admin">HR / Admin Account</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-muted flex items-center gap-1.5">
                    <Camera size={14}/> Face ID (Blink to Capture)
                  </label>
                  {userFace && <span className="text-[12px] text-success font-medium">Face ID Captured ✓</span>}
                </div>
                <div className="rounded-md border-2 border-dashed border-border p-2 bg-surface overflow-hidden relative min-h-[300px] flex items-center justify-center">
                  {userFace ? (
                    <div className="relative w-full h-full">
                      <img src={URL.createObjectURL(userFace)} className="w-full h-full object-cover rounded-md" alt="Captured face" />
                      <button type="button" onClick={() => setUserFace(null)} className="absolute top-2 right-2 p-2 bg-danger rounded-md text-white hover:opacity-80">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ) : (
                    <CameraCapture onCapture={setUserFace} blinkMode={true} />
                  )}
                </div>
                <p className="text-[12px] text-muted">Look at the camera and blink. Face ID will be captured automatically.</p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsAddingUser(false); setRegistrationError(''); }} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover">Cancel</button>
                <button disabled={actionLoading || !userFace} type="submit" className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium disabled:opacity-50">
                  {actionLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditingUser && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="border border-border rounded-lg bg-white max-w-lg w-full p-8 space-y-6">
            <h3 className="text-[24px] font-bold text-center">Edit User</h3>
            
            {editError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-danger text-[14px] text-center">
                {editError}
              </div>
            )}
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Name</label>
                <input required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Email</label>
                <input required type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Change Password (optional)</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Department</label>
                <input value={editData.department} onChange={e => setEditData({...editData, department: e.target.value})} placeholder="HR, IT, Finance..." className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              {editTarget.role !== 'SuperAdmin' && (
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-muted">Role</label>
                  <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]">
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsEditingUser(false); setEditError(''); }} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover">Cancel</button>
                <button disabled={editLoading} type="submit" className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium disabled:opacity-50">
                  {editLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {isApplyingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="border border-border rounded-lg bg-white max-w-md w-full p-8 space-y-6">
            <h3 className="text-[24px] font-bold text-center">Apply for Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Date</label>
                <input required type="date" value={leaveData.date} onChange={e => setLeaveData({...leaveData, date: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-muted">Reason</label>
                <textarea required placeholder="Brief reason for leave..." value={leaveData.reason} onChange={e => setLeaveData({...leaveData, reason: e.target.value})} className="w-full bg-surface border border-border rounded-md p-3 h-28 outline-none focus:border-primary text-[14px]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsApplyingLeave(false)} className="flex-1 p-3 rounded-md bg-surface border border-border text-[14px] font-medium hover:bg-surface-hover">Cancel</button>
                <button className="flex-[2] p-3 rounded-md bg-primary hover:bg-primary-hover text-white text-[14px] font-medium">Submit Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
