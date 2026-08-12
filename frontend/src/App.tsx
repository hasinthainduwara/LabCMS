import { useEffect, useState, FormEvent, ChangeEvent } from 'react';

// --- Interfaces ---
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  avatar: string;
}

interface Chemical {
  id: string;
  name: string;
  formula: string;
  cas: string;
  quantity: number;
  unit: string;
  state: string;
  grade: string;
  department: string;
  location: string;
  grant_ref: string | null;
  hazards: string[];
  expiry: string;
}

interface RequestItem {
  id: string;
  chemical_id: string;
  chemical_name: string;
  quantity: number;
  unit: string;
  student_name: string;
  student_email: string;
  department: string;
  submission_date: string;
  needed_by: string;
  purpose: string;
  status: string;
  grant_id: string | null;
  approved_by: string;
  rejection_reason: string;
}

interface Grant {
  id: string;
  name: string;
  funding_org: string;
  pi_name: string;
  budget: number;
  used: number;
  start_date: string;
  end_date: string;
}

interface Department {
  id: string;
  name: string;
  faculty: string;
  location: string;
  technical_officer: string;
  head_of_department: string;
}

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  status: string;
}

interface NotificationItem {
  id: number;
  user_id: string;
  message: string;
  is_read: boolean;
  timestamp: string;
}

interface ExcelUpload {
  id: string;
  uploadedBy: string;
  department: string;
  timestamp: string;
  status: string;
  chemicals: Partial<Chemical>[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // --- States ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // DB-Fetched State
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [excelQueue, setExcelQueue] = useState<ExcelUpload[]>([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<RequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectionInput, setShowRejectionInput] = useState<boolean>(false);

  // Forms State
  const [loginEmail, setLoginEmail] = useState<string>('admin@university.edu');
  const [loginPassword, setLoginPassword] = useState<string>('password');

  // Password Reset Flow
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>(
    () => (new URLSearchParams(window.location.search).get('token') ? 'reset' : 'login')
  );
  const [resetToken] = useState<string>(() => new URLSearchParams(window.location.search).get('token') || '');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Chemical Form (Add / Edit)
  const [chemFormId, setChemFormId] = useState<string>('');
  const [chemName, setChemName] = useState<string>('');
  const [chemFormula, setChemFormula] = useState<string>('');
  const [chemCas, setChemCas] = useState<string>('');
  const [chemQty, setChemQty] = useState<number>(0);
  const [chemUnit, setChemUnit] = useState<string>('Liters');
  const [chemState, setChemState] = useState<string>('Liquid');
  const [chemGrade, setChemGrade] = useState<string>('');
  const [chemDept, setChemDept] = useState<string>('');
  const [chemLocation, setChemLocation] = useState<string>('');
  const [chemGrant, setChemGrant] = useState<string>('');
  const [chemExpiry, setChemExpiry] = useState<string>('');
  const [chemHazards, setChemHazards] = useState<Record<string, boolean>>({
    flammable: false,
    corrosive: false,
    toxic: false,
    gas: false,
  });

  // Requisition Form
  const [reqChemSelect, setReqChemSelect] = useState<string>('');
  const [reqQty, setReqQty] = useState<number>(0);
  const [reqDate, setReqDate] = useState<string>('');
  const [reqGrant, setReqGrant] = useState<string>('');
  const [reqPurpose, setReqPurpose] = useState<string>('');

  // User Form
  const [userFormName, setUserFormName] = useState<string>('');
  const [userFormEmail, setUserFormEmail] = useState<string>('');
  const [userFormRole, setUserFormRole] = useState<string>('student');
  const [userFormDept, setUserFormDept] = useState<string>('');

  // Grant Form
  const [grantFormId, setGrantFormId] = useState<string>('');
  const [grantFormName, setGrantFormName] = useState<string>('');
  const [grantFormFunding, setGrantFormFunding] = useState<string>('');
  const [grantFormPi, setGrantFormPi] = useState<string>('');
  const [grantFormBudget, setGrantFormBudget] = useState<number>(0);
  const [grantFormStart, setGrantFormStart] = useState<string>('');
  const [grantFormEnd, setGrantFormEnd] = useState<string>('');

  // Department Form
  const [deptFormName, setDeptFormName] = useState<string>('');
  const [deptFormFaculty, setDeptFormFaculty] = useState<string>('');
  const [deptFormLocation, setDeptFormLocation] = useState<string>('');
  const [deptFormTo, setDeptFormTo] = useState<string>('');
  const [deptFormHead, setDeptFormHead] = useState<string>('');

  // Landing tab per role: student/itadmin have no Dashboard access
  const getDefaultTab = (role: string): string => {
    if (role === 'student') return 'requests';
    if (role === 'itadmin') return 'users';
    return 'dashboard';
  };

  // --- Session Check ---
  useEffect(() => {
    const saved = sessionStorage.getItem('labcms_session_user');
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        setCurrentUser(u);
        setActiveTab(getDefaultTab(u.role));
      } catch (e) {
        console.error('Session parse failed', e);
      }
    }
  }, []);

  // --- Global Data Polling / Loading ---
  useEffect(() => {
    if (!currentUser) return;
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      // Fetch Chemicals
      const chemRes = await fetch(`/api/chemicals?search=${encodeURIComponent(searchQuery)}&state=${filterState}&department=${filterDept}`);
      const chemData = await chemRes.json() as Chemical[];
      setChemicals(chemData);

      // Fetch Requests
      const reqRes = await fetch('/api/requests');
      const reqData = await reqRes.json() as RequestItem[];
      setRequests(reqData);

      // Fetch Grants
      const grantRes = await fetch('/api/grants');
      const grantData = await grantRes.json() as Grant[];
      setGrants(grantData);

      // Fetch Users
      const userRes = await fetch('/api/users');
      const userData = await userRes.json() as User[];
      setUsers(userData);

      // Fetch Departments
      const deptRes = await fetch('/api/departments');
      const deptData = await deptRes.json() as Department[];
      setDepartments(deptData);

      // Fetch Logs
      const logsRes = await fetch('/api/logs');
      const logsData = await logsRes.json() as AuditLog[];
      setAuditLogs(logsData);

      // Fetch Notifications
      const notifRes = await fetch(`/api/notifications?userId=${currentUser?.role}`);
      const notifData = await notifRes.json() as NotificationItem[];
      setNotifications(notifData);

      // Fetch Excel uploads staging queue
      const excelRes = await fetch('/api/excel/queue');
      const excelData = await excelRes.json() as ExcelUpload[];
      setExcelQueue(excelData);
    } catch (err: any) {
      showToast(`Error fetching system data: ${err.message}`, 'error');
    }
  };

  // Re-fetch on filter changes
  useEffect(() => {
    if (!currentUser) return;
    const delayDebounceFn = setTimeout(() => {
      fetchChemicalsList();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterState, filterDept]);

  const fetchChemicalsList = async () => {
    try {
      const chemRes = await fetch(`/api/chemicals?search=${encodeURIComponent(searchQuery)}&state=${filterState}&department=${filterDept}`);
      const chemData = await chemRes.json() as Chemical[];
      setChemicals(chemData);
    } catch (err: any) {
      console.error(err);
    }
  };

  // --- Toasts Helper ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Auth Handlers ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (!res.ok) {
        const errorData = await res.json() as { message: string };
        showToast(errorData.message || 'Login failed', 'error');
        return;
      }
      const data = await res.json() as User;
      setCurrentUser(data);
      sessionStorage.setItem('labcms_session_user', JSON.stringify(data));
      showToast(`Welcome back, ${data.name}!`, 'success');
      setActiveTab(getDefaultTab(data.role));
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handleDemoLogin = async (role: string) => {
    if (role === 'guest') {
      handleLogout();
      return;
    }
    try {
      const res = await fetch('/api/auth/login-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!res.ok) {
        showToast('Demo account profile not found', 'error');
        return;
      }
      const data = await res.json() as User;
      setCurrentUser(data);
      sessionStorage.setItem('labcms_session_user', JSON.stringify(data));
      showToast(`Switched instantly to ${data.name} (${role.toUpperCase()})`, 'success');
      setActiveTab(getDefaultTab(data.role));
    } catch (err: any) {
      showToast(`Demo login error: ${err.message}`, 'error');
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    sessionStorage.removeItem('labcms_session_user');
    showToast('Successfully logged out', 'info');
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json() as { message: string };
      showToast(data.message, 'info');
      setAuthView('login');
      setForgotEmail('');
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json() as { message: string };
      if (!res.ok) {
        showToast(data.message || 'Reset failed', 'error');
        return;
      }
      showToast(data.message, 'success');
      window.history.replaceState({}, '', window.location.pathname);
      setAuthView('login');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    }
  };

  // --- Chemical Operations ---
  const openAddChemical = () => {
    setChemFormId('');
    setChemName('');
    setChemFormula('');
    setChemCas('');
    setChemQty(0);
    setChemUnit('Liters');
    setChemState('Liquid');
    setChemGrade('');
    setChemDept(departments[0]?.name || '');
    setChemLocation('');
    setChemGrant('');
    setChemExpiry('');
    setChemHazards({ flammable: false, corrosive: false, toxic: false, gas: false });
    setActiveTab('add-chemical');
  };

  const openEditChemical = (chem: Chemical) => {
    setChemFormId(chem.id);
    setChemName(chem.name);
    setChemFormula(chem.formula);
    setChemCas(chem.cas);
    setChemQty(chem.quantity);
    setChemUnit(chem.unit);
    setChemState(chem.state);
    setChemGrade(chem.grade);
    setChemDept(chem.department);
    setChemLocation(chem.location);
    setChemGrant(chem.grant_ref || '');
    setChemExpiry(chem.expiry);

    const haz: Record<string, boolean> = { flammable: false, corrosive: false, toxic: false, gas: false };
    chem.hazards.forEach(h => { haz[h] = true; });
    setChemHazards(haz);

    setActiveTab('add-chemical');
  };

  const handleChemicalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const activeHazards = Object.keys(chemHazards).filter(k => chemHazards[k]);
    const payload = {
      name: chemName,
      formula: chemFormula,
      cas: chemCas,
      quantity: chemQty,
      unit: chemUnit,
      state: chemState,
      grade: chemGrade,
      department: chemDept || departments[0]?.name || 'Organic Chemistry',
      location: chemLocation,
      grant_ref: chemGrant || null,
      hazards: activeHazards,
      expiry: chemExpiry || 'Indefinite'
    };

    try {
      const url = chemFormId ? `/api/chemicals/${chemFormId}` : '/api/chemicals';
      const method = chemFormId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        showToast('Failed to save chemical record', 'error');
        return;
      }

      showToast(chemFormId ? 'Chemical record updated' : 'Chemical record created', 'success');
      fetchData();
      setActiveTab('inventory');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteChemical = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete chemical ${id}?`)) return;
    try {
      const res = await fetch(`/api/chemicals/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete chemical', 'error');
        return;
      }
      showToast('Chemical deleted successfully', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Requisition Request Operations ---
  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reqChemSelect) {
      showToast('Please select a chemical first', 'error');
      return;
    }
    const payload = {
      chemicalId: reqChemSelect,
      quantity: reqQty,
      neededBy: reqDate,
      grantId: reqGrant || null,
      purpose: reqPurpose,
      studentName: currentUser?.name || 'Unknown student',
      studentEmail: currentUser?.email || 'student@student.edu',
      department: currentUser?.department || 'Organic Chemistry'
    };

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        showToast('Failed to submit requisition request', 'error');
        return;
      }

      showToast('Requisition form submitted successfully', 'success');
      setReqQty(0);
      setReqDate('');
      setReqPurpose('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openReviewRequest = (reqItem: RequestItem) => {
    setSelectedReviewRequest(reqItem);
    setRejectionReason('');
    setShowRejectionInput(false);
    setActiveTab('review-request');
  };

  const handleRequestApprove = async () => {
    if (!selectedReviewRequest) return;
    try {
      const res = await fetch(`/api/requests/${selectedReviewRequest.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser?.name })
      });
      if (!res.ok) {
        showToast('Error approving requisition', 'error');
        return;
      }
      showToast('Requisition request approved and stock deducted', 'success');
      fetchData();
      setActiveTab('requests');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestReject = async () => {
    if (!selectedReviewRequest) return;
    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }
    if (!rejectionReason) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/requests/${selectedReviewRequest.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser?.name, rejectionReason })
      });
      if (!res.ok) {
        showToast('Error rejecting requisition', 'error');
        return;
      }
      showToast('Requisition request disapproved/rejected', 'info');
      fetchData();
      setActiveTab('requests');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- User Form Handler ---
  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userFormName,
          email: userFormEmail,
          role: userFormRole,
          department: userFormDept || departments[0]?.name || 'Organic Chemistry'
        })
      });

      if (!res.ok) {
        showToast('Failed to create user', 'error');
        return;
      }

      showToast(`User profile created for ${userFormName}. A set-password link was emailed to them.`, 'success');
      setUserFormName('');
      setUserFormEmail('');
      fetchData();
      setActiveTab('users');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete user', 'error');
        return;
      }
      showToast('User deleted successfully', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Grant Form Handler ---
  const handleGrantSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grantFormId,
          name: grantFormName,
          fundingOrg: grantFormFunding,
          piName: grantFormPi,
          budget: grantFormBudget,
          startDate: grantFormStart,
          endDate: grantFormEnd
        })
      });

      if (!res.ok) {
        showToast('Failed to register research grant', 'error');
        return;
      }

      showToast(`Research grant ${grantFormId} registered successfully`, 'success');
      setGrantFormId('');
      setGrantFormName('');
      setGrantFormFunding('');
      setGrantFormPi('');
      setGrantFormBudget(0);
      setGrantFormStart('');
      setGrantFormEnd('');
      fetchData();
      setActiveTab('grants');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Department Form Handler ---
  const handleDeptSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deptFormName,
          faculty: deptFormFaculty,
          location: deptFormLocation,
          technicalOfficer: deptFormTo,
          headOfDepartment: deptFormHead
        })
      });

      if (!res.ok) {
        showToast('Failed to add department', 'error');
        return;
      }

      showToast(`Department ${deptFormName} saved successfully`, 'success');
      setDeptFormName('');
      setDeptFormFaculty('');
      setDeptFormLocation('');
      setDeptFormTo('');
      setDeptFormHead('');
      fetchData();
      setActiveTab('departments');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Notification Handlers ---
  const markNotifRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) return;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifs = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser?.role}`, { method: 'DELETE' });
      if (!res.ok) return;
      setNotifications([]);
      showToast('Notifications cleared', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Excel simulator bulk upload ---
  const triggerSimulatedBulkImport = async () => {
    const mockImport = {
      uploadedBy: currentUser?.name || 'System Simulator',
      department: currentUser?.department || 'Organic Chemistry',
      chemicals: [
        { name: 'Silver Nitrate', formula: 'AgNO3', cas: '7761-88-8', quantity: 250, unit: 'Grams', state: 'Solid', grade: 'ACS Grade', department: currentUser?.department || 'Organic Chemistry', location: 'Restricted Safe Cabinet', grant: '', expiry: '2027-01-20', hazards: [] },
        { name: 'Methanol', formula: 'CH3OH', cas: '67-56-1', quantity: 4.0, unit: 'Liters', state: 'Liquid', grade: 'HPLC Grade', department: currentUser?.department || 'Organic Chemistry', location: 'Solvents Locker C', grant: '', expiry: '2026-05-15', hazards: ['flammable', 'toxic'] }
      ]
    };
    try {
      const res = await fetch('/api/excel/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockImport)
      });
      if (!res.ok) {
        showToast('Error uploading spreadsheet mock', 'error');
        return;
      }
      showToast('Excel document uploaded to review queue successfully', 'success');
      fetchData();
      setActiveTab('inventory');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const approveExcelUpload = async (id: string) => {
    try {
      const res = await fetch(`/api/excel/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: currentUser?.name })
      });
      if (!res.ok) {
        showToast('Error approving staging import', 'error');
        return;
      }
      showToast('Spreadsheet imports approved and integrated into inventory', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Simulation Exports ---
  const simulateExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      // Build a basic CSV string and trigger download
      let csvContent = 'data:text/csv;charset=utf-8,ID,Chemical Name,Formula,CAS,Quantity,Unit,State,Location,Expiry\n';
      chemicals.forEach(c => {
        csvContent += `"${c.id}","${c.name}","${c.formula}","${c.cas}",${c.quantity},"${c.unit}","${c.state}","${c.location}","${c.expiry}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'labcms_inventory_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV export initialized successfully', 'success');
    } else {
      window.print();
      showToast('PDF compilation ready. Printing window triggered', 'success');
    }
  };

  // Prepopulate form defaults if departments list gets loaded
  useEffect(() => {
    if (departments.length > 0) {
      setChemDept(departments[0].name);
      setUserFormDept(departments[0].name);
    }
  }, [departments]);

  // Set default chemical dropdown option when chemicals are fetched
  useEffect(() => {
    if (chemicals.length > 0) {
      setReqChemSelect(chemicals[0].id);
    }
  }, [chemicals]);

  // --- Render Login View ---
  if (!currentUser) {
    return (
      <div className="text-on-surface min-h-screen flex flex-col">
        {/* Login view body */}
        <div className="login-bg flex-grow flex items-center justify-center p-md">
          <main className="w-full max-w-[500px] bg-white rounded-xl shadow-lg border border-outline-variant p-xl flex flex-col gap-lg">
            <div className="text-center flex flex-col items-center">
              <img src="/images.png" alt="LabCMS Logo" className="h-16 w-auto mb-sm object-contain" />
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">LabCMS</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Chemical Management System Portal</p>
            </div>

            {/* Standard Login */}
            {authView === 'login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-md">
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">Institutional Email</label>
                    <input
                      className="w-full px-md py-2 bg-transparent border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-sm"
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="username@university.edu"
                      required
                    />
                  </div>
                  <div className="space-y-xs">
                    <div className="flex justify-between items-center">
                      <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Password</label>
                      <a
                        className="font-label-sm text-label-sm text-primary hover:underline"
                        href="#"
                        onClick={(e) => { e.preventDefault(); setAuthView('forgot'); }}
                      >
                        Forgot?
                      </a>
                    </div>
                    <input
                      className="w-full px-md py-2 bg-transparent border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-sm"
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-base">
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                  </button>
                </form>

                {/* SSO Alternative */}
                <div className="flex items-center gap-md">
                  <div className="flex-1 h-px bg-outline-variant" />
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>
                <button
                  type="button"
                  onClick={() => showToast('University SSO is not configured yet. Contact IT Admin.', 'info')}
                  className="w-full py-2 border border-outline text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-base"
                >
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  <span>Sign in with University SSO</span>
                </button>
              </>
            )}

            {/* Forgot Password Request */}
            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-md">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Enter your institutional email and we'll send you a password reset link.
                </p>
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="forgot-email">Institutional Email</label>
                  <input
                    className="w-full px-md py-2 bg-transparent border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-sm"
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="username@university.edu"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-base">
                  <span>Send Reset Link</span>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="w-full py-2 text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-base"
                >
                  <span>Back to Sign In</span>
                </button>
              </form>
            )}

            {/* Reset Password */}
            {authView === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-md">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Choose a new password for your account.
                </p>
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="new-password">New Password</label>
                  <input
                    className="w-full px-md py-2 bg-transparent border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-sm"
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    className="w-full px-md py-2 bg-transparent border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-body-sm"
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-base">
                  <span>Update Password</span>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </button>
              </form>
            )}
          </main>
        </div>

        {/* Global Toast Container */}
        <div id="toast-container" className="fixed top-12 right-6 z-[9999] flex flex-col gap-sm pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={`p-md rounded-xl shadow-lg text-white font-label-md text-xs transition-all pointer-events-auto border flex items-center gap-base ${toast.type === 'success' ? 'bg-primary border-primary-fixed/20' : toast.type === 'error' ? 'bg-error border-error-container/20' : 'bg-secondary border-outline-variant'}`}>
              <span className="material-symbols-outlined text-[18px]">
                {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
              </span>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Role Permissions ---
  // Matrix: Student / TO / Super Admin / IT Admin
  const canViewDashboard = currentUser.role === 'superadmin' || currentUser.role === 'to';
  const canUploadExcel = currentUser.role === 'superadmin' || currentUser.role === 'to';
  const canApproveExcel = currentUser.role === 'superadmin';
  const canViewGrants = currentUser.role === 'superadmin' || currentUser.role === 'itadmin' || currentUser.role === 'to';
  const canCreateGrants = currentUser.role === 'superadmin' || currentUser.role === 'itadmin';
  const canViewReports = currentUser.role === 'superadmin' || currentUser.role === 'itadmin' || currentUser.role === 'to';

  // TO's dashboard/reports figures are scoped to their own department
  const isDeptScoped = currentUser.role === 'to';
  const scopedChemicals = isDeptScoped ? chemicals.filter(c => c.department === currentUser.department) : chemicals;
  const scopedRequests = isDeptScoped ? requests.filter(r => r.department === currentUser.department) : requests;

  // --- Render Authenticated Dashboard ---
  return (
    <div className="text-on-surface min-h-screen flex flex-col">

      <div className="flex-grow flex">
        {/* Sidebar Navigation */}
        <aside className="w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-lg px-md z-40 relative shadow-sm">
          <div className="px-md mb-xl flex flex-col gap-xs">
            <div className="flex items-center gap-xs">
              <img src="/images.png" alt="LabCMS Logo" className="h-10 w-auto object-contain" />
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">LabCMS</h2>
            </div>
            <p className="font-label-md text-label-md text-outline uppercase tracking-wider">{currentUser.role} Console</p>
          </div>

          {/* Dynamic Navigation */}
          <nav className="flex-grow flex flex-col gap-xs">
            {canViewDashboard && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'dashboard' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </button>
            )}

            {(currentUser.role === 'superadmin' || currentUser.role === 'to' || currentUser.role === 'student') && (
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'inventory' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">inventory</span>
                <span>Inventory</span>
              </button>
            )}

            {(currentUser.role === 'superadmin' || currentUser.role === 'to' || currentUser.role === 'student') && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'requests' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">order_approve</span>
                <span>Requisitions</span>
              </button>
            )}

            {canViewGrants && (
              <button
                onClick={() => setActiveTab('grants')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'grants' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>Grants</span>
              </button>
            )}

            {(currentUser.role === 'superadmin' || currentUser.role === 'itadmin') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'users' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">group</span>
                <span>Users</span>
              </button>
            )}

            {(currentUser.role === 'superadmin' || currentUser.role === 'itadmin') && (
              <button
                onClick={() => setActiveTab('departments')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'departments' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">corporate_fare</span>
                <span>Departments</span>
              </button>
            )}

            {canViewReports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-base px-md py-base rounded-lg font-label-md text-left transition-all ${activeTab === 'reports' ? 'bg-primary-fixed text-primary font-bold shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined">analytics</span>
                <span>Reports</span>
              </button>
            )}
          </nav>

          {/* Sidebar Footer Profile */}
          <div className="border-t border-outline-variant pt-lg mt-auto flex flex-col gap-sm">
            <button onClick={handleLogout} className="w-full flex items-center gap-base px-md py-base text-error hover:bg-error-container/10 transition-all rounded-lg font-label-md">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </button>
            <div className="flex items-center gap-sm px-md py-sm">
              <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src={currentUser.avatar} alt="Profile" />
              <div className="overflow-hidden">
                <p className="font-label-md text-label-md leading-none text-on-surface truncate">{currentUser.name}</p>
                <p className="text-[10px] text-on-surface-variant truncate mt-1">{currentUser.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-lg z-30 shadow-sm">
            <div className="flex items-center gap-md">
              <h2 className="font-headline-md text-headline-md font-bold text-primary capitalize">{activeTab.replace('-', ' ')}</h2>
            </div>
            <div className="flex items-center gap-md">
              {/* Notification System */}
              {currentUser.role !== 'itadmin' && (
                <div className="relative">
                  <button onClick={() => setShowNotifications(p => !p)} className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors active:scale-95">
                    <span className="material-symbols-outlined">notifications</span>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-outline-variant py-sm z-[100] max-h-96 overflow-y-auto custom-scrollbar">
                      <div className="px-md py-xs border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                        <span className="text-xs font-bold text-primary">System Notifications</span>
                        <button onClick={clearAllNotifs} className="text-[10px] text-error hover:underline font-bold">Clear All</button>
                      </div>
                      <div className="divide-y divide-outline-variant">
                        {notifications.length === 0 ? (
                          <div className="p-md text-center text-xs text-outline">No notifications yet.</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} onClick={() => markNotifRead(n.id)} className={`p-md text-xs transition-colors hover:bg-surface-container-low cursor-pointer flex flex-col gap-xs ${!n.is_read ? 'bg-primary-fixed/10 font-medium' : ''}`}>
                              <p className="text-on-surface leading-normal">{n.message}</p>
                              <span className="text-[10px] text-outline">{n.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors active:scale-95" onClick={() => showToast('Settings console unlocked', 'info')}>
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </header>

          {/* Canvas Scrollable */}
          <main className="flex-1 overflow-y-auto p-lg custom-scrollbar">

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && canViewDashboard && (
              <div className="space-y-lg animate-in fade-in duration-300">
                {isDeptScoped && (
                  <div className="bg-primary-fixed/20 border border-primary/20 rounded-lg px-md py-2 text-xs text-on-primary-fixed-variant font-semibold">
                    Showing figures scoped to {currentUser.department}
                  </div>
                )}
                {/* Bento Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex items-center gap-md">
                    <span className="p-3 bg-primary-fixed text-primary rounded-lg material-symbols-outlined">science</span>
                    <div>
                      <h4 className="text-xs font-semibold text-outline uppercase tracking-wider leading-none mb-1">Total Stocks</h4>
                      <p className="text-2xl font-bold text-on-surface">{scopedChemicals.length} Chemicals</p>
                    </div>
                  </div>
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex items-center gap-md">
                    <span className="p-3 bg-error-container text-error rounded-lg material-symbols-outlined">warning</span>
                    <div>
                      <h4 className="text-xs font-semibold text-outline uppercase tracking-wider leading-none mb-1">Low/Empty</h4>
                      <p className="text-2xl font-bold text-on-surface">{scopedChemicals.filter(c => c.quantity <= 5).length} Records</p>
                    </div>
                  </div>
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex items-center gap-md">
                    <span className="p-3 bg-yellow-100 text-yellow-800 rounded-lg material-symbols-outlined">hourglass_empty</span>
                    <div>
                      <h4 className="text-xs font-semibold text-outline uppercase tracking-wider leading-none mb-1">Pending Approvals</h4>
                      <p className="text-2xl font-bold text-on-surface">{scopedRequests.filter(r => r.status === 'PENDING').length} Requisitions</p>
                    </div>
                  </div>
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex items-center gap-md">
                    <span className="p-3 bg-green-100 text-green-800 rounded-lg material-symbols-outlined">payments</span>
                    <div>
                      <h4 className="text-xs font-semibold text-outline uppercase tracking-wider leading-none mb-1">Active Grants</h4>
                      <p className="text-2xl font-bold text-on-surface">{grants.length} Budgets</p>
                    </div>
                  </div>
                </div>

                {/* Usage graph & expiry alert block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                  {/* Stock Bar Chart */}
                  <div className="lg:col-span-8 bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-lg">
                      <h3 className="font-headline-sm text-headline-sm">Chemical Allocation & Stock Levels</h3>
                      <div className="text-xs text-outline font-semibold">Live System Metrics</div>
                    </div>
                    {/* Dynamic Bar Charts */}
                    <div className="h-64 flex items-end justify-around pt-lg gap-base border-b border-outline-variant pb-xs">
                      {scopedChemicals.length === 0 ? (
                        <div className="w-full text-center text-xs text-outline pb-12">No chemical records stored to display graph.</div>
                      ) : (
                        scopedChemicals.slice(0, 7).map(c => {
                          // max reference scale: 500
                          const percentage = Math.min(100, Math.max(12, (c.quantity / (c.unit === 'Grams' ? 500 : 10)) * 100));
                          return (
                            <div key={c.id} className="flex flex-col items-center flex-grow group max-w-[80px]">
                              <div
                                style={{ height: `${percentage}%` }}
                                className="w-8 rounded-t bg-primary group-hover:bg-primary-container transition-all flex items-end justify-center text-[10px] text-white font-bold pb-1 shadow-sm chart-bar"
                              >
                                {Math.round(c.quantity)}
                              </div>
                              <span className="text-[10px] text-on-surface-variant font-medium truncate w-full text-center mt-2" title={c.name}>
                                {c.name.split(',')[0]}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Alert Block */}
                  <div className="lg:col-span-4 flex flex-col gap-md">
                    <div className="bg-error-container/20 border border-error/20 p-lg rounded-xl flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-error flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[24px]">warning</span>
                          <span>Security Alert Board</span>
                        </h4>
                        <p className="text-body-sm text-on-surface-variant mt-sm">Expired chemicals and low stock thresholds must be audited immediately to ensure regulatory safety compliance.</p>
                      </div>
                      <div className="mt-md space-y-2">
                        {scopedChemicals.filter(c => c.expiry !== 'Indefinite' && new Date(c.expiry) < new Date()).slice(0, 2).map(c => (
                          <div key={c.id} className="bg-white p-2.5 rounded-lg border border-outline-variant text-xs flex justify-between">
                            <span className="font-bold text-error">Expired</span>
                            <span className="font-mono text-on-surface-variant truncate max-w-[150px]">{c.name}</span>
                          </div>
                        ))}
                        {scopedChemicals.filter(c => c.quantity <= 5).slice(0, 1).map(c => (
                          <div key={c.id} className="bg-white p-2.5 rounded-lg border border-outline-variant text-xs flex justify-between">
                            <span className="font-bold text-yellow-600">Low Stock</span>
                            <span className="font-mono text-on-surface-variant truncate max-w-[150px]">{c.name}</span>
                          </div>
                        ))}
                        <button
                          onClick={() => setActiveTab('inventory')}
                          className="w-full text-center py-2 bg-error text-white font-label-md text-label-sm rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Audit Inventory
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Feed Table */}
                <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                  <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                    <h3 className="font-headline-sm text-headline-sm">System Audit Activity</h3>
                    <button onClick={() => setActiveTab('reports')} className="text-primary text-label-md font-bold hover:underline">Full Analytics Logs</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-low text-label-sm text-on-surface-variant">
                        <tr>
                          <th className="px-lg py-3 font-semibold uppercase tracking-wider">Timestamp</th>
                          <th className="px-lg py-3 font-semibold uppercase tracking-wider">Authorized User</th>
                          <th className="px-lg py-3 font-semibold uppercase tracking-wider">Action / Log</th>
                          <th className="px-lg py-3 font-semibold uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-body-sm">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-lg py-6 text-center text-outline">No logs found in DB.</td>
                          </tr>
                        ) : (
                          auditLogs.slice(0, 5).map(log => (
                            <tr key={log.id} className="hover:bg-surface-container-low transition-all">
                              <td className="px-lg py-3.5 font-mono text-outline">{log.timestamp}</td>
                              <td className="px-lg py-3.5 font-semibold">{log.user}</td>
                              <td className="px-lg py-3.5">{log.action}</td>
                              <td className="px-lg py-3.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-error-container text-error'}`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="space-y-md animate-in fade-in duration-300">
                <div className="flex justify-between items-center gap-md flex-wrap">
                  <p className="text-body-md text-on-surface-variant">Review available chemicals, track expiry warnings, and filter by storage location.</p>
                  <div className="flex items-center gap-md">
                    {canUploadExcel && (
                      <button onClick={() => setActiveTab('excel-import')} className="flex items-center gap-base px-md py-2 border border-outline text-on-surface hover:bg-surface-container-low transition-all rounded-lg font-label-md text-body-sm active:scale-95">
                        <span className="material-symbols-outlined text-[18px]">file_upload</span>
                        <span>Excel Bulk Upload</span>
                      </button>
                    )}
                    {(currentUser.role === 'superadmin' || currentUser.role === 'to') && (
                      <button onClick={openAddChemical} className="flex items-center gap-base px-md py-2 bg-primary text-on-primary hover:opacity-90 transition-all rounded-lg font-label-md text-body-sm shadow-sm active:scale-95">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Add Chemical</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Staging Bulk Approval Alerts for Super Admin */}
                {canApproveExcel && excelQueue.filter(x => x.status === 'PENDING').length > 0 && (
                  <div className="space-y-sm">
                    {excelQueue.filter(x => x.status === 'PENDING').map(stage => (
                      <div key={stage.id} className="bg-primary-fixed/20 border border-primary/20 p-md rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-base text-xs text-on-primary-fixed-variant">
                          <span className="material-symbols-outlined text-primary text-[20px]">table_chart</span>
                          <div>
                            <p className="font-bold">Pending Staged Import Approval Queue</p>
                            <p className="text-outline">Uploaded by {stage.uploadedBy} for {stage.department} ({stage.chemicals.length} items)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => approveExcelUpload(stage.id)}
                          className="px-md py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 shadow-sm active:scale-95 transition-all"
                        >
                          Approve Staged Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search & Filters */}
                <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-wrap items-center gap-md">
                  <div className="flex-1 min-w-[240px] relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                      placeholder="Search by Chemical Name, CAS#, or Storage Location..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-base">
                    <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="filter-state">State:</label>
                    <select
                      id="filter-state"
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant rounded-lg text-body-sm py-1.5 px-md focus:ring-1 focus:ring-primary min-w-[120px]"
                    >
                      <option value="all">All States</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Solid">Solid</option>
                      <option value="Gas">Gas</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-base">
                    <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="filter-dept">Department:</label>
                    <select
                      id="filter-dept"
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant rounded-lg text-body-sm py-1.5 px-md focus:ring-1 focus:ring-primary min-w-[150px]"
                    >
                      <option value="all">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container text-label-sm text-on-surface-variant uppercase tracking-wider">
                        <tr>
                          <th className="px-md py-4">Chemical Details</th>
                          <th className="px-md py-4">CAS Number</th>
                          <th className="px-md py-4">Quantity / Unit</th>
                          <th className="px-md py-4">State & Grade</th>
                          <th className="px-md py-4">Department</th>
                          <th className="px-md py-4">Storage Location</th>
                          <th className="px-md py-4">Expiry Date</th>
                          <th className="px-md py-4">Grant ref</th>
                          <th className="px-md py-4 text-center">Hazards</th>
                          {(currentUser.role === 'superadmin' || currentUser.role === 'to') && (
                            <th className="px-md py-4">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-body-sm">
                        {chemicals.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-md py-8 text-center text-outline">No chemical records matching filters found.</td>
                          </tr>
                        ) : (
                          chemicals.map(chem => {
                            const isExpired = chem.expiry !== 'Indefinite' && new Date(chem.expiry) < new Date();
                            const isLowStock = chem.quantity <= 5;
                            return (
                              <tr key={chem.id} className="hover:bg-surface-container-low transition-colors">
                                <td className="px-md py-4">
                                  <div>
                                    <p className="font-semibold text-primary">{chem.name}</p>
                                    <p className="text-[10px] text-outline font-mono mt-0.5">{chem.formula || 'N/A'}</p>
                                  </div>
                                </td>
                                <td className="px-md py-4 font-mono">{chem.cas}</td>
                                <td className="px-md py-4">
                                  <span className={`font-semibold ${isLowStock ? 'text-error font-bold' : ''}`}>{chem.quantity}</span> {chem.unit}
                                </td>
                                <td className="px-md py-4">
                                  <p>{chem.state}</p>
                                  <p className="text-[10px] text-outline mt-0.5">{chem.grade}</p>
                                </td>
                                <td className="px-md py-4 font-medium">{chem.department}</td>
                                <td className="px-md py-4">{chem.location}</td>
                                <td className="px-md py-4">
                                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${isExpired ? 'bg-error-container text-error border border-error/20' : 'bg-surface-container-high text-on-surface'}`}>
                                    {chem.expiry}
                                  </span>
                                </td>
                                <td className="px-md py-4 font-mono text-outline">{chem.grant_ref || 'Free Stock'}</td>
                                <td className="px-md py-4 text-center">
                                  <div className="flex gap-1 justify-center">
                                    {chem.hazards.map(haz => (
                                      <span
                                        key={haz}
                                        title={haz.toUpperCase()}
                                        className={`material-symbols-outlined text-[16px] p-0.5 rounded ${haz === 'flammable' ? 'text-red-500 bg-red-100' : haz === 'corrosive' ? 'text-yellow-600 bg-yellow-100' : haz === 'toxic' ? 'text-purple-600 bg-purple-100' : 'text-blue-500 bg-blue-100'}`}
                                      >
                                        {haz === 'flammable' ? 'local_fire_department' : haz === 'corrosive' ? 'warning' : haz === 'toxic' ? 'skull' : 'gas_meter'}
                                      </span>
                                    ))}
                                    {chem.hazards.length === 0 && <span className="text-[10px] text-outline font-medium">None</span>}
                                  </div>
                                </td>
                                {(currentUser.role === 'superadmin' || currentUser.role === 'to') && (
                                  <td className="px-md py-4">
                                    <div className="flex items-center gap-sm">
                                      <button onClick={() => openEditChemical(chem)} className="p-1 hover:bg-primary-fixed/20 text-primary rounded" title="Edit chemical">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                      </button>
                                      <button onClick={() => deleteChemical(chem.id)} className="p-1 hover:bg-error-container/20 text-error rounded" title="Delete chemical">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REQUISITIONS */}
            {activeTab === 'requests' && (
              <div className="grid grid-cols-12 gap-lg animate-in fade-in duration-300">
                {/* Left Form: Submit Requisition Form (students only — TOs/admins review, they don't self-request) */}
                {currentUser.role === 'student' && (
                <div className="col-span-12 lg:col-span-5 space-y-md">
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
                    <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm mb-md text-primary">
                      <span className="material-symbols-outlined">edit_note</span>
                      <span>Request Requisition</span>
                    </h3>

                    <form onSubmit={handleRequestSubmit} className="space-y-md">
                      <div className="bg-primary-fixed/20 p-md rounded-lg text-xs flex gap-sm border border-primary/10 text-on-primary-fixed-variant">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <p>Select a chemical from the drop-down, input usage quantity, and specify needed by date.</p>
                      </div>

                      <div className="space-y-xs">
                        <label className="block text-label-sm text-on-surface font-semibold" htmlFor="req-chem-select">Choose Chemical</label>
                        <select
                          id="req-chem-select"
                          value={reqChemSelect}
                          onChange={(e) => setReqChemSelect(e.target.value)}
                          className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                          required
                        >
                          {chemicals.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.quantity} {c.unit} avail)</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-md">
                        <div className="space-y-xs">
                          <label className="block text-label-sm text-on-surface font-semibold" htmlFor="req-qty">Quantity Needed</label>
                          <input
                            id="req-qty"
                            type="number"
                            step="any"
                            value={reqQty}
                            onChange={(e) => setReqQty(Number(e.target.value))}
                            className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="0.0"
                            required
                          />
                        </div>
                        <div className="space-y-xs">
                          <label className="block text-label-sm text-on-surface font-semibold" htmlFor="req-date">Needed By</label>
                          <input
                            id="req-date"
                            type="date"
                            value={reqDate}
                            onChange={(e) => setReqDate(e.target.value)}
                            className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-xs">
                        <label className="block text-label-sm text-on-surface font-semibold" htmlFor="req-grant">Link to Research Grant</label>
                        <select
                          id="req-grant"
                          value={reqGrant}
                          onChange={(e) => setReqGrant(e.target.value)}
                          className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="">No Grant (Free Stock)</option>
                          {grants.map(g => (
                            <option key={g.id} value={g.id}>{g.id} - {g.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-xs">
                        <label className="block text-label-sm text-on-surface font-semibold" htmlFor="req-purpose">Intended Experiment Purpose</label>
                        <textarea
                          id="req-purpose"
                          rows={3}
                          value={reqPurpose}
                          onChange={(e) => setReqPurpose(e.target.value)}
                          className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                          placeholder="Provide experimental summary for supervisor review..."
                          required
                        />
                      </div>

                      <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md hover:shadow-md transition-all active:scale-[0.98]">
                        Submit Request Form
                      </button>
                    </form>
                  </div>
                </div>
                )}

                {/* Right Panel: Requests Requisition Log */}
                <div className={`col-span-12 ${currentUser.role === 'student' ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                  <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                      <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary">history</span>
                        <span>Requisitions Log</span>
                      </h3>
                    </div>
                    <div className="flex-grow overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container text-[11px] text-on-surface-variant uppercase font-semibold">
                          <tr>
                            <th className="px-md py-3">ID</th>
                            <th className="px-md py-3">Requester Details</th>
                            <th className="px-md py-3">Chemical</th>
                            <th className="px-md py-3 text-center">Amount</th>
                            <th className="px-md py-3">Needed By</th>
                            <th className="px-md py-3">Status</th>
                            {(currentUser.role === 'superadmin' || currentUser.role === 'to') && (
                              <th className="px-md py-3 text-right">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant text-body-sm">
                          {requests.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-md py-6 text-center text-outline">No requisitions recorded in database.</td>
                            </tr>
                          ) : (
                            requests.map(req => (
                              <tr key={req.id} className="hover:bg-surface-container-low transition-all">
                                <td className="px-md py-3.5 font-mono font-bold text-outline">{req.id}</td>
                                <td className="px-md py-3.5">
                                  <div>
                                    <p className="font-semibold">{req.student_name}</p>
                                    <p className="text-[10px] text-outline">{req.student_email}</p>
                                  </div>
                                </td>
                                <td className="px-md py-3.5 font-semibold text-primary">{req.chemical_name}</td>
                                <td className="px-md py-3.5 text-center font-bold">{req.quantity} {req.unit}</td>
                                <td className="px-md py-3.5">{req.needed_by}</td>
                                <td className="px-md py-3.5">
                                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {req.status}
                                  </span>
                                  {req.status === 'REJECTED' && req.rejection_reason && (
                                    <p className="text-[9px] text-error mt-0.5 truncate max-w-[120px]" title={req.rejection_reason}>
                                      Reason: {req.rejection_reason}
                                    </p>
                                  )}
                                </td>
                                {(currentUser.role === 'superadmin' || currentUser.role === 'to') && (
                                  <td className="px-md py-3.5 text-right">
                                    {req.status === 'PENDING' ? (
                                      <button
                                        onClick={() => openReviewRequest(req)}
                                        className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded hover:opacity-90 shadow-sm active:scale-95 transition-all"
                                      >
                                        Review
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-outline font-medium">Checked by {req.approved_by || 'Officer'}</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REVIEW REQUEST BOARD */}
            {activeTab === 'review-request' && selectedReviewRequest && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-outline-variant shadow-sm p-xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                    <h3 className="font-headline-sm text-headline-sm text-primary">Review Chemical Requisition</h3>
                    <button onClick={() => setActiveTab('requests')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Requests</span>
                    </button>
                  </div>

                  <div className="space-y-sm text-xs bg-surface-container-low p-md rounded-lg border border-outline-variant text-on-surface">
                    <p><strong>Request ID:</strong> <span className="font-mono">{selectedReviewRequest.id}</span></p>
                    <p><strong>Requester:</strong> <span>{selectedReviewRequest.student_name} ({selectedReviewRequest.student_email})</span></p>
                    <p><strong>Department:</strong> <span>{selectedReviewRequest.department}</span></p>
                    <p><strong>Chemical:</strong> <span className="font-bold">{selectedReviewRequest.chemical_name}</span></p>
                    <p><strong>Amount:</strong> <span className="font-bold">{selectedReviewRequest.quantity} {selectedReviewRequest.unit}</span></p>
                    <p><strong>Need By:</strong> <span>{selectedReviewRequest.needed_by}</span></p>
                    <p><strong>Purpose:</strong> <span className="italic">{selectedReviewRequest.purpose}</span></p>
                    {selectedReviewRequest.grant_id && (
                      <p><strong>Grant reference:</strong> <span className="font-mono">{selectedReviewRequest.grant_id}</span></p>
                    )}
                  </div>

                  {/* Rejection input board */}
                  {showRejectionInput && (
                    <div className="space-y-xs border border-error/20 p-sm rounded-lg bg-error-container/10">
                      <label htmlFor="reject-reason-input" className="block text-xs font-bold text-error">Rejection Reason</label>
                      <input
                        type="text"
                        id="reject-reason-input"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full text-xs bg-white border border-outline-variant rounded px-2 py-1.5 focus:ring-1 focus:ring-error focus:border-error"
                        placeholder="Type administrative reason for disapproval..."
                      />
                    </div>
                  )}

                  <div className="flex gap-md pt-sm">
                    <button onClick={handleRequestApprove} className="flex-1 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 shadow-sm active:scale-95">
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      <span>Approve Requisition</span>
                    </button>
                    <button onClick={handleRequestReject} className="flex-1 py-2 border border-error text-error rounded-lg text-xs font-semibold hover:bg-error-container/10 transition-colors flex items-center justify-center gap-1 active:scale-95">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>{showRejectionInput ? 'Confirm Reject' : 'Disapprove / Reject'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GRANTS */}
            {activeTab === 'grants' && canViewGrants && (
              <div className="space-y-md animate-in fade-in duration-300">
                <div className="flex justify-between items-center flex-wrap gap-sm">
                  <p className="text-body-md text-on-surface-variant">
                    {canCreateGrants ? 'Manage university research grants, budgets, and track chemical expenditure.' : 'View research grant budgets and usage to assign against chemical requests.'}
                  </p>
                  {canCreateGrants && (
                    <button onClick={() => setActiveTab('add-grant')} className="flex items-center gap-base px-md py-2 bg-primary text-on-primary hover:opacity-90 transition-all rounded-lg font-label-md text-body-sm shadow-sm active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Add New Grant</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {grants.length === 0 ? (
                    <div className="col-span-3 text-center text-outline p-8 bg-white border border-outline-variant rounded-xl shadow-sm">No grants stored in DB.</div>
                  ) : (
                    grants.map(g => {
                      const budgetVal = Number(g.budget);
                      const usedVal = Number(g.used);
                      const ratio = budgetVal > 0 ? (usedVal / budgetVal) * 100 : 0;
                      return (
                        <div key={g.id} className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between gap-md hover:border-primary transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-sm">
                              <span className="px-2 py-0.5 bg-primary-fixed text-primary text-[10px] font-bold rounded font-mono">{g.id}</span>
                              <span className="text-[10px] text-outline font-semibold">{g.funding_org}</span>
                            </div>
                            <h4 className="font-headline-sm text-body-lg font-bold leading-tight line-clamp-1 mb-1">{g.name}</h4>
                            <p className="text-xs text-on-surface-variant font-medium">PI: {g.pi_name}</p>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-outline mb-1">
                              <span>Budget Spent</span>
                              <span>${usedVal.toLocaleString()} / ${budgetVal.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                              <div style={{ width: `${Math.min(100, ratio)}%` }} className="bg-primary h-full rounded-full" />
                            </div>
                            <div className="flex justify-between text-[9px] text-outline mt-2">
                              <span>Start: {g.start_date}</span>
                              <span>End: {g.end_date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: ADD GRANT */}
            {activeTab === 'add-grant' && canCreateGrants && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-outline-variant shadow-sm p-xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                    <h3 className="font-headline-sm text-headline-sm text-primary">Register Research Grant</h3>
                    <button onClick={() => setActiveTab('grants')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Grants</span>
                    </button>
                  </div>
                  <form onSubmit={handleGrantSubmit} className="space-y-md">
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-id">Grant Reference ID</label>
                      <input id="grant-id" value={grantFormId} onChange={(e) => setGrantFormId(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. NIH-2027-MD" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-name">Grant / Study Title</label>
                      <input id="grant-name" value={grantFormName} onChange={(e) => setGrantFormName(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Quantum Dot Bio-Imaging Study" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-funding">Funding Organization</label>
                      <input id="grant-funding" value={grantFormFunding} onChange={(e) => setGrantFormFunding(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. National Science Foundation" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-pi">Principal Investigator (PI)</label>
                      <input id="grant-pi" value={grantFormPi} onChange={(e) => setGrantFormPi(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Dr. Sarah Jenkins" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-budget">Total Allocated Budget ($)</label>
                      <input id="grant-budget" value={grantFormBudget} onChange={(e) => setGrantFormBudget(Number(e.target.value))} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="number" placeholder="e.g. 150000" />
                    </div>
                    <div className="grid grid-cols-2 gap-sm">
                      <div className="space-y-xs">
                        <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-start">Start Date</label>
                        <input id="grant-start" value={grantFormStart} onChange={(e) => setGrantFormStart(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer" required type="date" />
                      </div>
                      <div className="space-y-xs">
                        <label className="block text-label-sm text-on-surface font-semibold" htmlFor="grant-end">End Date</label>
                        <input id="grant-end" value={grantFormEnd} onChange={(e) => setGrantFormEnd(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer" required type="date" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md hover:shadow-md transition-all active:scale-[0.98]">
                      Register Research Grant
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-md animate-in fade-in duration-300">
                <div className="flex justify-between items-center flex-wrap gap-sm">
                  <p className="text-body-md text-on-surface-variant">Manage portal user credentials, privileges, roles, and administrative statuses.</p>
                  <button onClick={() => setActiveTab('add-user')} className="flex items-center gap-base px-md py-2 bg-primary text-on-primary hover:opacity-90 transition-all rounded-lg font-label-md text-body-sm shadow-sm active:scale-95">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Create New User</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container text-label-sm text-on-surface-variant uppercase tracking-wider">
                        <tr>
                          <th className="px-lg py-4">User Profile</th>
                          <th className="px-lg py-4">Access Privilege</th>
                          <th className="px-lg py-4">Department</th>
                          <th className="px-lg py-4 text-center">Status</th>
                          <th className="px-lg py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-body-sm">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-surface-container-low transition-all">
                            <td className="px-lg py-4">
                              <div className="flex items-center gap-sm">
                                <img className="w-9 h-9 rounded-full border border-outline-variant object-cover" src={u.avatar} alt="Profile" />
                                <div>
                                  <p className="font-semibold text-primary">{u.name}</p>
                                  <p className="text-[10px] text-outline font-mono mt-0.5">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-lg py-4 font-bold capitalize">{u.role}</td>
                            <td className="px-lg py-4">{u.department}</td>
                            <td className="px-lg py-4 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-outline-variant text-on-surface-variant'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-lg py-4 text-center">
                              <button
                                onClick={() => deleteUser(u.id, u.name)}
                                className="p-2 text-error hover:bg-error-container/10 rounded-lg transition-colors active:scale-95"
                                title="Delete user"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADD USER */}
            {activeTab === 'add-user' && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-outline-variant shadow-sm p-xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                    <h3 className="font-headline-sm text-headline-sm text-primary">Create User Profile</h3>
                    <button onClick={() => setActiveTab('users')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Users</span>
                    </button>
                  </div>
                  <form onSubmit={handleUserSubmit} className="space-y-md">
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="user-name-inp">Full Name</label>
                      <input id="user-name-inp" value={userFormName} onChange={(e) => setUserFormName(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Prof. Alice Smith" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="user-email-inp">Institutional Email</label>
                      <input id="user-email-inp" value={userFormEmail} onChange={(e) => setUserFormEmail(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="email" placeholder="e.g. a.smith@university.edu" />
                    </div>
                    <p className="text-[11px] text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-lg px-md py-2">
                      A "set your password" link will be emailed to this address after the profile is created.
                    </p>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="user-role-inp">Access Role</label>
                      <select id="user-role-inp" value={userFormRole} onChange={(e) => setUserFormRole(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                        <option value="itadmin">IT Admin</option>
                        <option value="to">Technical Officer</option>
                        <option value="student">UG/PG Student</option>
                      </select>
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="user-dept-inp">Department</label>
                      <select id="user-dept-inp" value={userFormDept} onChange={(e) => setUserFormDept(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                        {departments.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md hover:shadow-md transition-all active:scale-[0.98]">
                      Register User Profile
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: DEPARTMENTS */}
            {activeTab === 'departments' && (
              <div className="space-y-md animate-in fade-in duration-300">
                <div className="flex justify-between items-center flex-wrap gap-sm">
                  <p className="text-body-md text-on-surface-variant">Register university faculties, laboratory complexes, and assign Technical Officers.</p>
                  <button onClick={() => setActiveTab('add-dept')} className="flex items-center gap-base px-md py-2 bg-primary text-on-primary hover:opacity-90 transition-all rounded-lg font-label-md text-body-sm shadow-sm active:scale-95">
                    <span className="material-symbols-outlined text-[18px]">add_home</span>
                    <span>Add Department</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container text-label-sm text-on-surface-variant uppercase tracking-wider">
                        <tr>
                          <th className="px-lg py-4">Department Name</th>
                          <th className="px-lg py-4">Faculty Affiliation</th>
                          <th className="px-lg py-4">Physical Location</th>
                          <th className="px-lg py-4">Assigned Technical Officer</th>
                          <th className="px-lg py-4">Head of Department</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-body-sm">
                        {departments.map(d => (
                          <tr key={d.id} className="hover:bg-surface-container-low transition-all">
                            <td className="px-lg py-4 font-semibold text-primary">{d.name}</td>
                            <td className="px-lg py-4">{d.faculty}</td>
                            <td className="px-lg py-4 font-mono">{d.location}</td>
                            <td className="px-lg py-4">{d.technical_officer}</td>
                            <td className="px-lg py-4 font-medium">{d.head_of_department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADD DEPARTMENT */}
            {activeTab === 'add-dept' && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-outline-variant shadow-sm p-xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                    <h3 className="font-headline-sm text-headline-sm text-primary">Add University Department</h3>
                    <button onClick={() => setActiveTab('departments')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Departments</span>
                    </button>
                  </div>
                  <form onSubmit={handleDeptSubmit} className="space-y-md">
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="dept-name">Department Name</label>
                      <input id="dept-name" value={deptFormName} onChange={(e) => setDeptFormName(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Nanotechnology Department" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="dept-faculty">Faculty Affiliation</label>
                      <input id="dept-faculty" value={deptFormFaculty} onChange={(e) => setDeptFormFaculty(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Faculty of Technology" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="dept-location">Physical Location</label>
                      <input id="dept-location" value={deptFormLocation} onChange={(e) => setDeptFormLocation(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Tech complex 3rd Floor" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="dept-to">Assigned Technical Officer</label>
                      <input id="dept-to" value={deptFormTo} onChange={(e) => setDeptFormTo(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Robert Vance" />
                    </div>
                    <div className="space-y-xs">
                      <label className="block text-label-sm text-on-surface font-semibold" htmlFor="dept-head">Head of Department</label>
                      <input id="dept-head" value={deptFormHead} onChange={(e) => setDeptFormHead(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Prof. Sarah Jenkins" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md hover:shadow-md transition-all active:scale-[0.98]">
                      Save Department
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === 'reports' && canViewReports && (
              <div className="space-y-lg animate-in fade-in duration-300">
                {isDeptScoped && (
                  <div className="bg-primary-fixed/20 border border-primary/20 rounded-lg px-md py-2 text-xs text-on-primary-fixed-variant font-semibold">
                    Showing figures scoped to {currentUser.department}
                  </div>
                )}
                <div className="flex justify-between items-center flex-wrap gap-sm border-b border-outline-variant pb-md">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary">Consolidated Reports</h3>
                    <p className="text-body-sm text-on-surface-variant">Download and export system auditing worksheets.</p>
                  </div>
                  <div className="flex gap-md">
                    <button onClick={() => simulateExport('csv')} className="px-md py-2 bg-surface-container-high rounded-lg text-xs font-semibold flex items-center gap-xs hover:bg-surface-container-highest transition-colors active:scale-95 border border-outline-variant shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Export Inventory (CSV)</span>
                    </button>
                    <button onClick={() => simulateExport('pdf')} className="px-md py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold flex items-center gap-xs hover:opacity-90 transition-all active:scale-95 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                      <span>Generate PDF / Print</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Regulatory hazard profiling */}
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between gap-md">
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary mb-xs">Regulatory Hazard Profile</h4>
                      <p className="text-xs text-on-surface-variant">Audit summary of hazard certifications recorded in current stocks.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-1 border-b border-outline-variant">
                        <span className="font-semibold text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">local_fire_department</span> Flammables</span>
                        <span className="font-bold">{scopedChemicals.filter(c => c.hazards.includes('flammable')).length} items</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-outline-variant">
                        <span className="font-semibold text-yellow-600 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">warning</span> Corrosives</span>
                        <span className="font-bold">{scopedChemicals.filter(c => c.hazards.includes('corrosive')).length} items</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-outline-variant">
                        <span className="font-semibold text-purple-600 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">skull</span> Toxics</span>
                        <span className="font-bold">{scopedChemicals.filter(c => c.hazards.includes('toxic')).length} items</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="font-semibold text-blue-500 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">gas_meter</span> Gas Cylinders</span>
                        <span className="font-bold">{scopedChemicals.filter(c => c.hazards.includes('gas')).length} items</span>
                      </div>
                    </div>
                  </div>

                  {/* Requests breakdown */}
                  <div className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between gap-md">
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-primary mb-xs">Consolidated Requisitions Status</h4>
                      <p className="text-xs text-on-surface-variant">Overview of chemical requests status in active database.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-1 border-b border-outline-variant">
                        <span className="font-semibold text-yellow-600">Pending Review</span>
                        <span className="font-bold">{scopedRequests.filter(r => r.status === 'PENDING').length} items</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-outline-variant">
                        <span className="font-semibold text-green-700">Approved requisitions</span>
                        <span className="font-bold">{scopedRequests.filter(r => r.status === 'APPROVED').length} items</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="font-semibold text-error">Disapproved / Rejected</span>
                        <span className="font-bold">{scopedRequests.filter(r => r.status === 'REJECTED').length} items</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADD / EDIT CHEMICAL */}
            {activeTab === 'add-chemical' && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md mb-lg">
                    <h3 className="font-headline-sm text-headline-sm text-primary">
                      {chemFormId ? `Edit Chemical Details (${chemFormId})` : 'Register Chemical Stock'}
                    </h3>
                    <button onClick={() => setActiveTab('inventory')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Inventory</span>
                    </button>
                  </div>

                  <form onSubmit={handleChemicalSubmit} className="grid grid-cols-12 gap-lg text-on-surface">
                    {/* Left Column */}
                    <div className="col-span-12 lg:col-span-6 space-y-md">
                      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg space-y-md">
                        <div className="flex items-center gap-base border-b border-outline-variant pb-sm mb-xs">
                          <span className="material-symbols-outlined text-primary text-[20px]">science</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Molecular Specifications</h4>
                        </div>
                        <div className="space-y-xs">
                          <label className="block text-xs font-semibold" htmlFor="chem-name-inp">Chemical Name</label>
                          <input id="chem-name-inp" value={chemName} onChange={(e) => setChemName(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. Sodium Hydroxide" />
                        </div>
                        <div className="grid grid-cols-2 gap-md">
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-formula-inp">Chemical Formula</label>
                            <input id="chem-formula-inp" value={chemFormula} onChange={(e) => setChemFormula(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. NaOH" />
                          </div>
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-cas-inp">CAS Registry Number</label>
                            <input id="chem-cas-inp" value={chemCas} onChange={(e) => setChemCas(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required type="text" placeholder="e.g. 1310-73-2" />
                          </div>
                        </div>
                      </div>

                      {/* Hazards */}
                      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg space-y-md">
                        <div className="flex items-center gap-base border-b border-outline-variant pb-sm mb-xs">
                          <span className="material-symbols-outlined text-error text-[20px]">dangerous</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-error">GHS Hazard Classifications</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-sm">
                          {Object.keys(chemHazards).map(haz => (
                            <label key={haz} className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer select-none transition-all hover:bg-surface-container-low ${chemHazards[haz] ? 'bg-primary-fixed/30 border-primary text-primary font-bold shadow-sm' : 'border-outline-variant text-outline'}`}>
                              <input
                                type="checkbox"
                                checked={chemHazards[haz]}
                                onChange={(e) => setChemHazards(prev => ({ ...prev, [haz]: e.target.checked }))}
                                className="sr-only"
                              />
                              <span className="material-symbols-outlined text-[24px] mb-1">
                                {haz === 'flammable' ? 'local_fire_department' : haz === 'corrosive' ? 'warning' : haz === 'toxic' ? 'skull' : 'gas_meter'}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider">{haz}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-12 lg:col-span-6 space-y-md">
                      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg space-y-md">
                        <div className="flex items-center gap-base border-b border-outline-variant pb-sm mb-xs">
                          <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Measurement Metrics</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-md">
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-qty-inp">Quantity</label>
                            <input id="chem-qty-inp" type="number" step="any" value={chemQty} onChange={(e) => setChemQty(Number(e.target.value))} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required placeholder="0.0" />
                          </div>
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-unit-inp">Unit</label>
                            <select id="chem-unit-inp" value={chemUnit} onChange={(e) => setChemUnit(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                              <option value="Liters">Liters</option>
                              <option value="Grams">Grams</option>
                              <option value="PSI">PSI</option>
                              <option value="Cylinder">Cylinder</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-md">
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-state-inp">Physical State</label>
                            <select id="chem-state-inp" value={chemState} onChange={(e) => setChemState(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                              <option value="Liquid">Liquid</option>
                              <option value="Solid">Solid</option>
                              <option value="Gas">Gas</option>
                            </select>
                          </div>
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-grade-inp">Grade / Quality</label>
                            <input id="chem-grade-inp" value={chemGrade} onChange={(e) => setChemGrade(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required placeholder="e.g. Analytical Grade" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-lg space-y-md">
                        <div className="flex items-center gap-base border-b border-outline-variant pb-sm mb-xs">
                          <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Storage & Source</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-md">
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-dept-inp">Department Registry</label>
                            <select id="chem-dept-inp" value={chemDept} onChange={(e) => setChemDept(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                              {departments.map(d => (
                                <option key={d.id} value={d.name}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-loc-inp">Storage Location info</label>
                            <input id="chem-loc-inp" value={chemLocation} onChange={(e) => setChemLocation(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required placeholder="e.g. Cabinet A-12" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-md">
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-expiry-inp">Expiry Date</label>
                            <input id="chem-expiry-inp" value={chemExpiry} onChange={(e) => setChemExpiry(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md" required placeholder="YYYY-MM-DD or Indefinite" />
                          </div>
                          <div className="space-y-xs">
                            <label className="block text-xs font-semibold" htmlFor="chem-grant-inp">Purchase Source / Grant</label>
                            <select id="chem-grant-inp" value={chemGrant} onChange={(e) => setChemGrant(e.target.value)} className="w-full bg-background border border-outline-variant rounded-lg text-body-sm py-2 px-md cursor-pointer">
                              <option value="">No Grant (Free Stock)</option>
                              {grants.map(g => (
                                <option key={g.id} value={g.id}>{g.id} - {g.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit buttons */}
                    <div className="col-span-12 flex justify-end gap-md pt-md border-t border-outline-variant">
                      <button type="button" onClick={() => setActiveTab('inventory')} className="px-5 py-2.5 border border-outline text-on-surface hover:bg-surface-container-low transition-colors rounded-lg font-label-md text-xs font-semibold">
                        Cancel
                      </button>
                      <button type="submit" className="px-8 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-xs shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Save Chemical Record</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: EXCEL IMPORT SIMULATOR */}
            {activeTab === 'excel-import' && canUploadExcel && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-outline-variant shadow-sm p-xl space-y-md">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-md">
                    <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary">file_upload</span>
                      <span>Excel Bulk Import Simulator</span>
                    </h3>
                    <button onClick={() => setActiveTab('inventory')} className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      <span>Back to Inventory</span>
                    </button>
                  </div>
                  <div className="space-y-md text-body-sm">
                    <p>Standard CSV or Excel spreadsheet configuration matching chemical registry format rules.</p>
                    <div
                      className="border-2 border-dashed border-outline-variant p-lg rounded-xl text-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer"
                      onClick={triggerSimulatedBulkImport}
                    >
                      <span className="material-symbols-outlined text-[48px] text-outline mb-xs">table_chart</span>
                      <p className="font-bold text-primary">Click here to simulate importing sample data</p>
                      <p className="text-xs text-outline mt-xs">Will automatically read 2 bulk chemicals & stage for supervisor audit approval</p>
                    </div>
                    <div className="bg-primary-fixed/20 p-md rounded-lg text-xs text-on-primary-fixed-variant border border-primary/10">
                      <p className="font-bold mb-xs">Sample Format Rows:</p>
                      <p className="font-mono">Name, Formula, CAS, Quantity, State, Grade, Expiry</p>
                      <p className="font-mono text-outline mt-xs">Silver Nitrate, AgNO3, 7761-88-8, 250g, Solid, ACS Grade, 2027-01-20</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Global Toast Container */}
      <div id="toast-container" className="fixed top-12 right-6 z-[9999] flex flex-col gap-sm pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-md rounded-xl shadow-lg text-white font-label-md text-xs transition-all pointer-events-auto border flex items-center gap-base ${toast.type === 'success' ? 'bg-primary border-primary-fixed/20' : toast.type === 'error' ? 'bg-error border-error-container/20' : 'bg-secondary border-outline-variant'}`}>
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
