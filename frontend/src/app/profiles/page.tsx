'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'profiles_data';

const TABS = [
  { id: 'profile-info', label: 'Profile Info', type: 'info' },
  { id: 'parq', label: 'PAR-Q', type: 'form' },
  { id: 'custom-1', label: 'Aut et fuga Perfere', type: 'form' },
  { id: 'custom-2', label: 'amplify_form_1', type: 'form' },
  { id: 'custom-3', label: 'Fitness Assessment', type: 'form' },
  { id: 'custom-4', label: 'Thousand', type: 'form' },
  { id: 'custom-5', label: '1101', type: 'form' },
  { id: 'custom-6', label: 'Tuseday Test', type: 'form' },
  { id: 'custom-7', label: 'New', type: 'form' },
  { id: 'custom-8', label: 'sdf1234', type: 'form' },
  { id: 'custom-9', label: 'Naeem test', type: 'form' },
  { id: 'custom-10', label: 'Today', type: 'form' },
  { id: 'custom-11', label: 'Notepad', type: 'form' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));
const GROUP_OPTIONS = ['Group A', 'Group B', 'Group C'];
const STAFF_OPTIONS = ['Admin 1', 'Admin 2', 'Admin 3', 'sabir2014852'];

export default function ProfilesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [openSections, setOpenSections] = useState({
    home: true,
    organization: true,
    library: true,
    analytics: true,
  });

  // ====== VIEW STATE ======
  const [view, setView] = useState<'profiles' | 'account-info' | 'account-settings'>('profiles');

  // ====== ACCOUNT MENU ======
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [stats] = useState({
    missingParq: 0, noMetrics: 0, overdueMetrics: 0, noGoals: 0,
  });

  const [activeTab, setActiveTab] = useState('Active');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState('profile-info');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', sex: '', measurementSystem: 'Imperial',
    birthMonth: '', birthDay: '', birthYear: '', heightFt: '', heightIn: '',
    email: '', phone: '', groups: [] as string[], staff: '',
    clientAccess: 'deny', profilePhoto: '' as string | null,
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const groupsRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== ACCOUNT INFO FORM ======
  const [activeInfoTab, setActiveInfoTab] = useState<'user' | 'business'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ====== ACCOUNT PROFILE PHOTO (WORKING) ======
  const [accountPhoto, setAccountPhoto] = useState<string | null>(null);
  const accountPhotoInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [website, setWebsite] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // ====== ACCOUNT SETTINGS ======
  type SettingsTab = 'privileges' | 'metrics' | 'testing' | 'results' | 'branding' | 'integrations';
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('privileges');
  const [primaryColor, setPrimaryColor] = useState('#F59E0B');
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [integrations, setIntegrations] = useState({
    inbody: { enabled: false, apiUsername: '', apiKey: '' },
    evolt: { enabled: false, clientId: '', clientSecret: '' },
    styku: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      bodyFatMethod: 'BIA',
      circumferenceMeasurement: 'Left Side',
    },
  });

  // ====== LOAD ======
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      const parts = (parsed.name || '').split(/\s+/).filter(Boolean);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(parsed.email || '');
    } else { router.push('/'); return; }

    const storedProfiles = localStorage.getItem(STORAGE_KEY);
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        if (Array.isArray(parsed)) setProfiles(parsed);
      } catch (err) { console.error(err); }
    }

    // Load account profile photo (user-specific)
    const storedPhoto = localStorage.getItem('account_profile_photo');
    if (storedPhoto) setAccountPhoto(storedPhoto);

    // Load business info
    const storedBiz = localStorage.getItem('business_info');
    if (storedBiz) {
      try {
        const biz = JSON.parse(storedBiz);
        setCompanyName(biz.companyName || '');
        setPhone(biz.phone || '');
        setAddress(biz.address || '');
        setCity(biz.city || '');
        setStateName(biz.state || '');
        setZipCode(biz.zipCode || '');
        setWebsite(biz.website || '');
      } catch (err) { console.error(err); }
    }

    // Load account settings
    const storedSettings = localStorage.getItem('account_settings');
    if (storedSettings) {
      try {
        const s = JSON.parse(storedSettings);
        setPrimaryColor(s.primaryColor || '#F59E0B');
        setAccountLogo(s.accountLogo || null);
        if (s.integrations) {
          setIntegrations((prev) => ({
            ...prev,
            ...s.integrations,
            styku: {
              ...prev.styku,
              ...(s.integrations.styku || {}),
            },
          }));
        }
      } catch (err) { console.error(err); }
    }

    setDataLoaded(true);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (dataLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles, dataLoaded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (groupsRef.current && !groupsRef.current.contains(t)) setGroupsOpen(false);
      if (staffRef.current && !staffRef.current.contains(t)) setStaffOpen(false);
      if (accountMenuRef.current && !accountMenuRef.current.contains(t)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (createOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [createOpen]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const getInitials = (name: string) => {
    const parts = name.split(/[.\s+_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openCreateModal = () => {
    setModalTab('profile-info');
    setFormData({
      firstName: '', lastName: '', sex: '', measurementSystem: 'Imperial',
      birthMonth: '', birthDay: '', birthYear: '', heightFt: '', heightIn: '',
      email: '', phone: '', groups: [], staff: '', clientAccess: 'deny', profilePhoto: '',
    });
    setValidationErrors({});
    setCreateOpen(true);
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({ ...formData, profilePhoto: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ ...formData, profilePhoto: '' });
  };

  // ====== WORKING ACCOUNT PHOTO UPLOAD ======
  const handleAccountPhotoClick = () => {
    accountPhotoInputRef.current?.click();
  };

  const handleAccountPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 6MB)
    if (file.size > 6 * 1024 * 1024) {
      setToast({ message: 'File too large. Max 6MB.', type: 'error' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAccountPhoto(dataUrl);
      try {
        localStorage.setItem('account_profile_photo', dataUrl);
        setToast({ message: 'Profile photo updated successfully', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to save photo (storage full?)', type: 'error' });
      }
    };
    reader.onerror = () => {
      setToast({ message: 'Failed to read image file', type: 'error' });
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be chosen again
    e.target.value = '';
  };

  const handleRemoveAccountPhoto = () => {
    setAccountPhoto(null);
    localStorage.removeItem('account_profile_photo');
    setToast({ message: 'Profile photo removed', type: 'success' });
  };

  const toggleGroup = (g: string) => {
    setFormData((prev) => ({
      ...prev,
      groups: prev.groups.includes(g) ? prev.groups.filter((x) => x !== g) : [...prev.groups, g],
    }));
  };

  const removeGroup = (g: string) => {
    setFormData((prev) => ({ ...prev, groups: prev.groups.filter((x) => x !== g) }));
  };

  const handleNext = () => {
    const idx = TABS.findIndex((t) => t.id === modalTab);
    if (idx < TABS.length - 1) {
      setModalTab(TABS[idx + 1].id);
    }
  };

  const handleSaveProfile = async () => {
    const errors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.sex) errors.sex = 'Sex is required';
    if (!formData.birthMonth || !formData.birthDay || !formData.birthYear) errors.birthday = 'Birthday is required';
    if (!formData.heightFt) errors.heightFt = 'Height (ft) is required';
    if (!formData.heightIn) errors.heightIn = 'Height (in) is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setModalTab('profile-info');
      return;
    }

    setValidationErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const newProfile = {
      id: Date.now(),
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      firstName: formData.firstName, lastName: formData.lastName,
      email: formData.email, phone: formData.phone,
      age: '', sex: formData.sex, measurementSystem: formData.measurementSystem,
      birthday: `${formData.birthMonth} ${formData.birthDay}, ${formData.birthYear}`,
      heightFt: formData.heightFt, heightIn: formData.heightIn,
      staff: formData.staff, groups: formData.groups,
      clientAccess: formData.clientAccess,
      parq: 'Incomplete', lastTested: 'Never', nextGoal: '—', overdueMetrics: 0,
      profilePhoto: formData.profilePhoto || '',
      createdAt: new Date().toISOString(),
    };

    setProfiles((prev) => [newProfile, ...prev]);
    setSaving(false);
    setCreateOpen(false);
    setToast({ message: 'Profile created successfully', type: 'success' });
  };

  // ====== SAVE ACCOUNT INFO ======
  const handleSaveAccountInfo = async () => {
    const errs: { [key: string]: string } = {};

    if (activeInfoTab === 'user') {
      if (!firstName.trim()) errs.firstName = 'First name is required';
      if (!lastName.trim()) errs.lastName = 'Last name is required';
      if (!email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
      if (newPassword && newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
      if (newPassword && newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setToast({ message: 'Please fix the highlighted fields', type: 'error' });
        return;
      }

      setErrors({});
      setSavingInfo(true);
      await new Promise((r) => setTimeout(r, 400));

      const updatedUser = { ...(user as any), name: `${firstName} ${lastName}`.trim(), email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      if (newPassword) localStorage.setItem('user_password', newPassword);

      setNewPassword('');
      setConfirmPassword('');
      setSavingInfo(false);
      setToast({ message: 'User info saved successfully', type: 'success' });
    } else {
      if (!companyName.trim()) errs.companyName = 'Company name is required';
      if (!phone.trim()) errs.phone = 'Phone is required';

      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setToast({ message: 'Please fix the highlighted fields', type: 'error' });
        return;
      }

      setErrors({});
      setSavingInfo(true);
      await new Promise((r) => setTimeout(r, 400));

      localStorage.setItem('business_info', JSON.stringify({
        companyName: companyName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        zipCode: zipCode.trim(),
        website: website.trim(),
      }));

      setSavingInfo(false);
      setToast({ message: 'Business info saved successfully', type: 'success' });
    }
  };

  // ====== LOGO UPLOAD ======
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File too large. Max 5MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAccountLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ====== SAVE SETTINGS ======
  const handleSaveSettings = () => {
    localStorage.setItem('account_settings', JSON.stringify({
      primaryColor,
      accountLogo,
      integrations,
    }));
    setToast({ message: 'Account settings saved', type: 'success' });
  };

  const totalItems = profiles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300]">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-3.5 px-5 flex items-center gap-3 min-w-[320px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'error' ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {toast.type === 'error' ? (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-amber-600">
            {!logoError ? (
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
            ) : (
              <span className="text-white text-sm font-bold">{getInitials(user.name)}</span>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4v16M15 4v16" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <div className="mb-2">
            <button onClick={() => toggleSection('home')} className="w-full flex items-center justify-between px-6 py-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase hover:text-gray-600">
              Home
              <svg className={`w-3 h-3 transition-transform ${openSections.home ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openSections.home && (
              <nav className="px-3 pt-1 space-y-0.5">
                <NavLink href="/dashboard" label="Dashboard" icon={<IconDashboard />} />
                <NavLink href="/tasks" label="Tasks" icon={<IconTask />} />
                <NavLink href="/calendar" label="Calendar" icon={<IconCalendar />} />
                <NavLink href="/messages" label="Messages" icon={<IconMessage />} />
              </nav>
            )}
          </div>
          <div className="mb-2">
            <button onClick={() => toggleSection('organization')} className="w-full flex items-center justify-between px-6 py-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase hover:text-gray-600">
              Organization
              <svg className={`w-3 h-3 transition-transform ${openSections.organization ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openSections.organization && (
              <nav className="px-3 pt-1 space-y-0.5">
                <NavLink href="/profiles" label="Profiles" active icon={<IconProfiles />} />
                <NavLink href="/users" label="Users" icon={<IconUser />} />
                <NavLink href="/groups" label="Groups" icon={<IconGroup />} />
              </nav>
            )}
          </div>
          <div className="mb-2">
            <button onClick={() => toggleSection('library')} className="w-full flex items-center justify-between px-6 py-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase hover:text-gray-600">
              Library
              <svg className={`w-3 h-3 transition-transform ${openSections.library ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openSections.library && (
              <nav className="px-3 pt-1 space-y-0.5">
                <NavLink href="/programs" label="Programs" icon={<IconBook />} />
                <NavLink href="/workouts" label="Workouts" icon={<IconBolt />} />
                <NavLink href="/exercises" label="Exercises" icon={<IconActivity />} />
                <NavLink href="/forms" label="Forms" icon={<IconForm />} />
              </nav>
            )}
          </div>
          <div className="mb-2">
            <button onClick={() => toggleSection('analytics')} className="w-full flex items-center justify-between px-6 py-1.5 text-[10px] font-bold text-gray-400 tracking-wider uppercase hover:text-gray-600">
              Analytics
              <svg className={`w-3 h-3 transition-transform ${openSections.analytics ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openSections.analytics && (
              <nav className="px-3 pt-1 space-y-0.5">
                <NavLink href="/reports" label="Reports" icon={<IconChart />} />
              </nav>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-gray-600 font-medium">Online</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-end gap-4 flex-shrink-0">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* ACCOUNT MENU */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold overflow-hidden">
                {accountPhoto ? (
                  <img src={accountPhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                <p className="text-[11px] text-gray-500 leading-none mt-1">{user.role}</p>
              </div>
            </button>

            {accountMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-[320px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold overflow-hidden flex-shrink-0">
                    {accountPhoto ? (
                      <img src={accountPhoto} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[12.5px] text-gray-500 mt-0.5 truncate">{user.role}</p>
                  </div>
                </div>
                <div className="py-2">
                  <button onClick={() => { setAccountMenuOpen(false); setView('profiles'); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
                    <svg className="w-[18px] h-[18px] text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6" /></svg>
                    <span>Switch to Classic</span>
                  </button>
                  <button onClick={() => { setAccountMenuOpen(false); setView('account-info'); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
                    <svg className="w-[18px] h-[18px] text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>Account Info</span>
                  </button>
                  <button onClick={() => { setAccountMenuOpen(false); setView('account-settings'); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
                    <svg className="w-[18px] h-[18px] text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Account Settings</span>
                  </button>
                  <button onClick={() => setAccountMenuOpen(false)} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
                    <svg className="w-[18px] h-[18px] text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    <span>Billing</span>
                  </button>
                </div>
                <div className="border-t border-gray-100 py-2">
                  <button onClick={() => { setAccountMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-red-600 hover:bg-red-50 transition text-left">
                    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ==================== PROFILES VIEW ==================== */}
        {view === 'profiles' && (
          <div className="flex-1 p-8 overflow-y-auto bg-white">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard number={stats.missingParq} label="Missing PAR-Q" />
              <StatCard number={stats.noMetrics} label="No Metrics" />
              <StatCard number={stats.overdueMetrics} label="Overdue Metrics" />
              <StatCard number={stats.noGoals} label="No Goals" />
            </div>

            <div className="flex items-start justify-between mb-2 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Profiles</h1>
                <p className="text-sm text-gray-500">Manage and track your member profiles and progress.</p>
              </div>
              <button
                onClick={openCreateModal}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Profile
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
              <div className="px-6 py-4 flex items-center gap-3 overflow-x-auto border-b border-gray-100">
                <div className="flex items-center gap-1 flex-shrink-0">
                  {['Active', 'Unassigned', 'Archived', 'Template', 'All'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${activeTab === tab ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <FilterDropdown label="Group" />
                  <FilterDropdown label="Staff" />
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Search by name, email..." className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-64 outline-none focus:border-[#1a73e8]" />
                  </div>
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="text-sm border border-gray-200 rounded-md px-3 py-2 outline-none bg-white font-medium">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/40">
                      <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></th>
                      <th className="px-4 py-3 font-medium text-xs">Name <span className="text-[#1a73e8]">▲</span></th>
                      <th className="px-4 py-3 font-medium text-xs">Age</th>
                      <th className="px-4 py-3 font-medium text-xs">Staff</th>
                      <th className="px-4 py-3 font-medium text-xs">PAR-Q</th>
                      <th className="px-4 py-3 font-medium text-xs">Last Tested</th>
                      <th className="px-4 py-3 font-medium text-xs">Next Goal</th>
                      <th className="px-4 py-3 font-medium text-xs">Overdue Metrics</th>
                      <th className="px-4 py-3 font-medium text-xs">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.length === 0 ? (
                      <tr><td colSpan={9} className="px-6 py-16 text-center text-gray-400 text-sm">
                        No profiles yet. Click <button onClick={openCreateModal} className="font-medium text-[#1a73e8] hover:underline">Create Profile</button> to get started.
                      </td></tr>
                    ) : (
                      profiles.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0 overflow-hidden">
                                {p.profilePhoto ? <img src={p.profilePhoto} alt={p.name} className="w-full h-full object-cover" /> : getInitials(p.name)}
                              </div>
                              <span className="font-medium text-gray-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{p.age || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{p.staff || '—'}</td>
                          <td className="px-4 py-4">
                            {p.parq === 'Complete' ? (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Complete</span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">Incomplete</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-gray-600">{p.lastTested || 'Never'}</td>
                          <td className="px-4 py-4 text-gray-600">{p.nextGoal || '—'}</td>
                          <td className="px-4 py-4 text-gray-600 text-center">{p.overdueMetrics ?? 0}</td>
                          <td className="px-4 py-4 text-gray-500 text-xs max-w-[200px] truncate">{p.email || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of <span className="font-semibold text-gray-700">{totalItems}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                  </button>
                  <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${currentPage >= totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}>
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ACCOUNT INFO VIEW ==================== */}
        {view === 'account-info' && (
          <div className="flex-1 overflow-y-auto bg-[#f7f8fa]">
            <div className="px-10 pt-10 pb-6">
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight mb-1">Account Info</h1>
              <p className="text-[13.5px] text-gray-500">Manage your personal profile and business details.</p>
            </div>
            <div className="px-10 pb-10">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-8 pt-6 pb-5 border-b border-gray-100">
                  <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button onClick={() => { setActiveInfoTab('user'); setErrors({}); }} className={`px-5 py-2 text-[14px] font-medium rounded-full transition ${activeInfoTab === 'user' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>User Info</button>
                    <button onClick={() => { setActiveInfoTab('business'); setErrors({}); }} className={`px-5 py-2 text-[14px] font-medium rounded-full transition ${activeInfoTab === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Business Info</button>
                  </div>
                </div>

                {activeInfoTab === 'user' && (
                  <div className="p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">First name <span className="text-red-500">*</span></label>
                            <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${errors.firstName ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                            {errors.firstName && <p className="text-xs text-red-500 mt-1.5">{errors.firstName}</p>}
                          </div>
                          <div>
                            <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Last name <span className="text-red-500">*</span></label>
                            <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${errors.lastName ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                            {errors.lastName && <p className="text-xs text-red-500 mt-1.5">{errors.lastName}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Email <span className="text-red-500">*</span></label>
                          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${errors.email ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
                        </div>
                        <div className="border border-gray-200 rounded-2xl p-6">
                          <p className="text-[11px] font-bold text-gray-500 tracking-[0.12em] uppercase mb-5">Change password — leave blank to keep current</p>
                          <div className="space-y-5">
                            <div>
                              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">New password</label>
                              <div className="relative">
                                <input type={showNewPassword ? 'text' : 'password'} placeholder="Min 8 chars, upper, lower, number, special" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full h-[48px] px-4 pr-12 border rounded-lg text-[14px] placeholder-gray-400 outline-none transition ${errors.newPassword ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                              </div>
                              {errors.newPassword && <p className="text-xs text-red-500 mt-1.5">{errors.newPassword}</p>}
                            </div>
                            <div>
                              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Confirm new password</label>
                              <div className="relative">
                                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full h-[48px] px-4 pr-12 border rounded-lg text-[14px] placeholder-gray-400 outline-none transition ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                              </div>
                              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{errors.confirmPassword}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-start pt-2">
                        <p className="text-[14px] font-semibold text-gray-800 mb-5">Profile Photo</p>

                        {/* ===== WORKING PHOTO UPLOADER ===== */}
                        <input
                          ref={accountPhotoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={handleAccountPhotoChange}
                        />

                        <div className="relative w-[220px] h-[220px] mb-6">
                          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {accountPhoto ? (
                              <img src={accountPhoto} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[42px] font-semibold text-gray-600">{getInitials(user.name)}</span>
                            )}
                          </div>
                          {accountPhoto && (
                            <button
                              type="button"
                              onClick={handleRemoveAccountPhoto}
                              title="Remove photo"
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleAccountPhotoClick}
                          className="px-6 h-[42px] border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-[14px] font-medium text-gray-700 transition"
                        >
                          {accountPhoto ? 'Change photo' : 'Upload photo'}
                        </button>

                        <p className="text-xs text-gray-500 mt-3">JPG, PNG, GIF or WebP. Max 6MB.</p>

                        <div className="w-full border-t border-gray-100 my-8"></div>
                        <button type="button" onClick={() => setToast({ message: 'Google account connection coming soon', type: 'success' })} className="w-full flex items-center justify-center gap-3 h-[52px] border border-gray-200 rounded-full bg-white hover:bg-gray-50 text-[14.5px] font-medium text-gray-800 transition">
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24c0,2.209,1.791,4,4,4h8c-1.657,2.372-4.354,4-7.5,4c-4.971,0-9-4.029-9-9s4.029-9,9-9 c2.293,0,4.403,0.866,5.982,2.284l5.658-5.658C35.68,3.5,30.151,2,24,2C11.85,2,2,11.85,2,24s9.85,22,22,22c11.046,0,20.62-8.134,21.773-18.916 C45.937,25.023,45.5,22.5,45.5,20C45.5,19.566,45.451,19.145,45.354,18.738L43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c2.293,0,4.403,0.866,5.982,2.284l5.658-5.658 C35.68,3.5,30.151,2,24,2C16.318,2,9.656,6.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,46c5.152,0,9.861-1.971,13.409-5.192l-6.19-5.238C29.145,36.091,26.705,37,24,37 c-3.184,0-5.905-1.616-7.5-4.145l-6.531,5.027C13.18,42.317,18.223,46,24,46z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24c0,2.209,1.791,4,4,4h8c-0.796,1.14-1.848,2.084-3.076,2.774 c0.001-0.001,6.192,5.238,6.192,5.238C36.971,34.174,46,28,46,20C46,19.653,45.973,19.312,45.921,18.983L43.611,20.083z" />
                          </svg>
                          Connect with Google Calendar and Tasks
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-gray-100">
                      <button type="button" onClick={() => setView('profiles')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
                      <button type="button" onClick={handleSaveAccountInfo} disabled={savingInfo} className={`px-6 h-[44px] text-[14px] font-semibold text-white rounded-lg transition ${savingInfo ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a4db8] hover:bg-[#15409b]'}`}>{savingInfo ? 'Saving...' : 'Save changes'}</button>
                    </div>
                  </div>
                )}

                {activeInfoTab === 'business' && (
                  <div className="p-8 lg:p-10">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Company name <span className="text-red-500">*</span></label>
                          <input type="text" placeholder="e.g. TMQA" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Phone <span className="text-red-500">*</span></label>
                          <input type="tel" placeholder="+1 (234) 567-890" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Address</label>
                        <input type="text" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">City</label>
                          <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">State</label>
                          <input type="text" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Zip code</label>
                          <input type="text" placeholder="Zip code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Website</label>
                        <input type="url" placeholder="https://yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-gray-100">
                      <button type="button" onClick={() => setView('profiles')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
                      <button type="button" onClick={handleSaveAccountInfo} disabled={savingInfo} className={`px-6 h-[44px] text-[14px] font-semibold text-white rounded-lg transition ${savingInfo ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a4db8] hover:bg-[#15409b]'}`}>{savingInfo ? 'Saving...' : 'Save changes'}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ACCOUNT SETTINGS VIEW ==================== */}
        {view === 'account-settings' && (
          <div className="flex-1 overflow-y-auto bg-[#f7f8fa]">
            <div className="px-10 pt-10 pb-6">
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight mb-1">Account Settings</h1>
              <p className="text-[13.5px] text-gray-500">Manage branding, metrics, testing, integrations, and system configuration.</p>
            </div>

            <div className="px-10 pb-6">
              <div className="inline-flex items-center gap-1 bg-[#eef1f7] rounded-full p-1.5">
                {(['privileges', 'metrics', 'testing', 'results', 'branding', 'integrations'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`px-5 py-2 text-[14px] font-medium rounded-full transition capitalize ${
                      settingsTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-10 pb-10 max-w-[1400px]">
              {settingsTab === 'privileges' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2">Privileges</h3>
                    <p className="text-[13px] text-gray-500 mb-6">
                      Manage role-based permissions for account members.
                    </p>
                    <div className="space-y-4">
                      {[
                        'Admin — Full access to all features',
                        'Coach — Can manage assigned profiles and programs',
                        'Trainer — Can manage workouts and view assigned profiles',
                        'Member — Can view own data only',
                        'Viewer — Read-only access',
                      ].map((role) => (
                        <div key={role} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0">
                          <span className="text-[14px] text-gray-800">{role}</span>
                          <button
                            type="button"
                            onClick={() => setToast({ message: `${role.split(' — ')[0]} privileges configuration coming soon`, type: 'success' })}
                            className="text-[13px] font-medium text-[#1a73e8] hover:underline"
                          >
                            Configure
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'branding' && (
                <div className="space-y-10">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">Primary Color</h3>
                    <p className="text-[13px] text-gray-500 mb-4">Sets the main accent color for the account.</p>
                    <div className="flex items-center gap-4">
                      <div className="w-[100px] h-[52px] rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="w-full h-full rounded-md" style={{ backgroundColor: primaryColor }} />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: primaryColor }} />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-[52px] pl-11 pr-4 w-[180px] border border-gray-200 rounded-lg text-[14px] font-medium text-gray-800 outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">Account Logo</h3>
                    <p className="text-[13px] text-gray-500 mb-4">Upload your account logo. Max 5MB (PNG, JPG, GIF recommended).</p>
                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-[400px] h-[180px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#1a73e8] hover:bg-blue-50/30 transition relative overflow-hidden"
                      >
                        {accountLogo ? (
                          <img src={accountLogo} alt="Account logo" className="w-full h-full object-contain p-4" />
                        ) : (
                          <p className="text-[14px] font-medium text-gray-500">Logo</p>
                        )}
                      </button>
                      {accountLogo && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAccountLogo(null); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'integrations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-7">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-5">InBody</h3>
                    <label className="flex items-center gap-3 cursor-pointer select-none mb-5">
                      <input type="checkbox" checked={integrations.inbody.enabled} onChange={(e) => setIntegrations({ ...integrations, inbody: { ...integrations.inbody, enabled: e.target.checked } })} className="w-[18px] h-[18px] rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]" />
                      <span className="text-[14px] text-gray-800">Integration enabled?</span>
                    </label>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">API Username</label>
                        <input type="text" value={integrations.inbody.apiUsername} onChange={(e) => setIntegrations({ ...integrations, inbody: { ...integrations.inbody, apiUsername: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">API Key</label>
                        <input type="text" value={integrations.inbody.apiKey} onChange={(e) => setIntegrations({ ...integrations, inbody: { ...integrations.inbody, apiKey: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-7">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-5">Evolt</h3>
                    <label className="flex items-center gap-3 cursor-pointer select-none mb-5">
                      <input type="checkbox" checked={integrations.evolt.enabled} onChange={(e) => setIntegrations({ ...integrations, evolt: { ...integrations.evolt, enabled: e.target.checked } })} className="w-[18px] h-[18px] rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]" />
                      <span className="text-[14px] text-gray-800">Integration enabled?</span>
                    </label>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Client ID</label>
                        <input type="text" value={integrations.evolt.clientId} onChange={(e) => setIntegrations({ ...integrations, evolt: { ...integrations.evolt, clientId: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Client Secret</label>
                        <input type="text" value={integrations.evolt.clientSecret} onChange={(e) => setIntegrations({ ...integrations, evolt: { ...integrations.evolt, clientSecret: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-7">
                    <h3 className="text-[15px] font-bold text-gray-900 mb-5">Styku</h3>
                    <label className="flex items-center gap-3 cursor-pointer select-none mb-5">
                      <input type="checkbox" checked={integrations.styku.enabled} onChange={(e) => setIntegrations({ ...integrations, styku: { ...integrations.styku, enabled: e.target.checked } })} className="w-[18px] h-[18px] rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]" />
                      <span className="text-[14px] text-gray-800">Integration enabled?</span>
                    </label>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">API Key</label>
                        <input type="text" value={integrations.styku.apiKey} onChange={(e) => setIntegrations({ ...integrations, styku: { ...integrations.styku, apiKey: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">API Secret</label>
                        <input type="text" value={integrations.styku.apiSecret} onChange={(e) => setIntegrations({ ...integrations, styku: { ...integrations.styku, apiSecret: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Body Fat Method</label>
                        <div className="relative">
                          <select value={integrations.styku.bodyFatMethod} onChange={(e) => setIntegrations({ ...integrations, styku: { ...integrations.styku, bodyFatMethod: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                            <option value="BIA">BIA</option>
                            <option value="DEXA">DEXA</option>
                            <option value="Navy">Navy</option>
                            <option value="Skinfold">Skinfold</option>
                            <option value="3D Scan">3D Scan</option>
                          </select>
                          <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Circumference Measurement</label>
                        <div className="relative">
                          <select value={integrations.styku.circumferenceMeasurement} onChange={(e) => setIntegrations({ ...integrations, styku: { ...integrations.styku, circumferenceMeasurement: e.target.value } })} className="w-full h-[48px] px-4 border border-gray-200 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                            <option value="Left Side">Left Side</option>
                            <option value="Right Side">Right Side</option>
                            <option value="Average">Average</option>
                          </select>
                          <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab !== 'privileges' && settingsTab !== 'branding' && settingsTab !== 'integrations' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                  <p className="text-[15px] text-gray-400 capitalize">{settingsTab} settings coming soon</p>
                </div>
              )}

              {(settingsTab === 'branding' || settingsTab === 'integrations') && (
                <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-6 h-[44px] text-[14px] font-semibold text-white bg-[#1a4db8] hover:bg-[#15409b] rounded-lg transition"
                  >
                    Save settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================== CREATE PROFILE MODAL ==================== */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative my-4">

            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <button onClick={() => setCreateOpen(false)} className="w-11 h-11 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5 transition">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Create Profile</h1>
                  <p className="text-sm text-gray-500">Add a new profile with info, PAR-Q, and notepad.</p>
                </div>
                <button onClick={() => setCreateOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-8 border-b border-gray-100">
              <div className="flex items-center gap-2 overflow-x-auto py-3">
                {TABS.map((tab) => {
                  const isActive = modalTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setModalTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition ${isActive ? 'bg-[#f0f2f5] text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {tab.type === 'info' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-8 py-8 max-h-[60vh] overflow-y-auto">
              {modalTab === 'profile-info' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">First Name <span className="text-red-500">*</span></label>
                          <input type="text" value={formData.firstName}
                            onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); if (validationErrors.firstName) setValidationErrors({ ...validationErrors, firstName: '' }); }}
                            className={`w-full h-11 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.firstName ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {validationErrors.firstName && <p className="text-xs text-red-500 mt-1.5">{validationErrors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Last Name <span className="text-red-500">*</span></label>
                          <input type="text" value={formData.lastName}
                            onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); if (validationErrors.lastName) setValidationErrors({ ...validationErrors, lastName: '' }); }}
                            className={`w-full h-11 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.lastName ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {validationErrors.lastName && <p className="text-xs text-red-500 mt-1.5">{validationErrors.lastName}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Sex <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select value={formData.sex}
                              onChange={(e) => { setFormData({ ...formData, sex: e.target.value }); if (validationErrors.sex) setValidationErrors({ ...validationErrors, sex: '' }); }}
                              className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none transition appearance-none pr-10 ${validationErrors.sex ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`}>
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          {validationErrors.sex && <p className="text-xs text-red-500 mt-1.5">{validationErrors.sex}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Measurement System</label>
                          <div className="relative">
                            <select value={formData.measurementSystem}
                              onChange={(e) => setFormData({ ...formData, measurementSystem: e.target.value })}
                              className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                              <option value="Imperial">Imperial</option>
                              <option value="Metric">Metric</option>
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Birthday <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="relative">
                            <select value={formData.birthMonth}
                              onChange={(e) => { setFormData({ ...formData, birthMonth: e.target.value }); if (validationErrors.birthday) setValidationErrors({ ...validationErrors, birthday: '' }); }}
                              className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none transition appearance-none pr-10 ${validationErrors.birthday ? 'border-red-400' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`}>
                              <option value="">Month</option>
                              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          <div className="relative">
                            <select value={formData.birthDay}
                              onChange={(e) => { setFormData({ ...formData, birthDay: e.target.value }); if (validationErrors.birthday) setValidationErrors({ ...validationErrors, birthday: '' }); }}
                              className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none transition appearance-none pr-10 ${validationErrors.birthday ? 'border-red-400' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`}>
                              <option value="">Day</option>
                              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          <div className="relative">
                            <select value={formData.birthYear}
                              onChange={(e) => { setFormData({ ...formData, birthYear: e.target.value }); if (validationErrors.birthday) setValidationErrors({ ...validationErrors, birthday: '' }); }}
                              className={`w-full h-11 px-4 border rounded-lg text-sm bg-white outline-none transition appearance-none pr-10 ${validationErrors.birthday ? 'border-red-400' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`}>
                              <option value="">Year</option>
                              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        {validationErrors.birthday && <p className="text-xs text-red-500 mt-1.5">{validationErrors.birthday}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Height (ft) <span className="text-red-500">*</span></label>
                          <input type="number" value={formData.heightFt}
                            onChange={(e) => { setFormData({ ...formData, heightFt: e.target.value }); if (validationErrors.heightFt) setValidationErrors({ ...validationErrors, heightFt: '' }); }}
                            className={`w-full h-11 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.heightFt ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {validationErrors.heightFt && <p className="text-xs text-red-500 mt-1.5">{validationErrors.heightFt}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Height (in) <span className="text-red-500">*</span></label>
                          <input type="number" value={formData.heightIn}
                            onChange={(e) => { setFormData({ ...formData, heightIn: e.target.value }); if (validationErrors.heightIn) setValidationErrors({ ...validationErrors, heightIn: '' }); }}
                            className={`w-full h-11 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.heightIn ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {validationErrors.heightIn && <p className="text-xs text-red-500 mt-1.5">{validationErrors.heightIn}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                          <input type="email" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
                          <input type="tel" value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="relative" ref={groupsRef}>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Groups</label>
                          <div onClick={() => setGroupsOpen(!groupsOpen)}
                            className="w-full min-h-11 px-4 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer flex flex-wrap items-center gap-2">
                            {formData.groups.length === 0 ? (
                              <span className="text-gray-400 text-sm py-1">Select groups...</span>
                            ) : (
                              formData.groups.map((g) => (
                                <span key={g} className="inline-flex items-center gap-1 bg-blue-50 text-[#1a73e8] text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-md">
                                  {g}
                                  <button type="button" onClick={(e) => { e.stopPropagation(); removeGroup(g); }} className="hover:bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </span>
                              ))
                            )}
                            <svg className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${groupsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          {groupsOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto p-2">
                              {GROUP_OPTIONS.map((g) => {
                                const checked = formData.groups.includes(g);
                                return (
                                  <label key={g} className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer select-none hover:bg-gray-50">
                                    <span className={`w-4 h-4 flex items-center justify-center rounded border-2 transition ${checked ? 'bg-[#1a73e8] border-[#1a73e8]' : 'bg-white border-gray-300'}`}>
                                      {checked && (<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>)}
                                    </span>
                                    <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleGroup(g)} />
                                    <span className="text-sm text-gray-800">{g}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="relative" ref={staffRef}>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">Staff</label>
                          <button type="button" onClick={() => setStaffOpen(!staffOpen)}
                            className={`w-full h-11 px-4 border rounded-lg text-sm bg-white flex items-center justify-between outline-none transition ${staffOpen ? 'border-[#1a73e8] ring-4 ring-[#1a73e8]/10' : 'border-gray-200'}`}>
                            <span className={formData.staff ? 'text-gray-800' : 'text-gray-400'}>{formData.staff || 'Select staff...'}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${staffOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {staffOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
                              {STAFF_OPTIONS.map((s) => (
                                <button key={s} type="button"
                                  onClick={() => { setFormData({ ...formData, staff: s }); setStaffOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition ${formData.staff === s ? 'bg-[#1a73e8] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-sm font-semibold text-gray-800 mb-3">Client access</p>
                        <div className="flex flex-wrap items-center gap-8">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="radio" name="clientAccess" value="allow"
                              checked={formData.clientAccess === 'allow'}
                              onChange={(e) => setFormData({ ...formData, clientAccess: e.target.value })}
                              className="w-4 h-4 text-[#1a73e8] focus:ring-[#1a73e8]" />
                            <span className="text-sm text-gray-700">Allow access to Profile</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input type="radio" name="clientAccess" value="deny"
                              checked={formData.clientAccess === 'deny'}
                              onChange={(e) => setFormData({ ...formData, clientAccess: e.target.value })}
                              className="w-4 h-4 text-[#1a73e8] focus:ring-[#1a73e8]" />
                            <span className="text-sm text-gray-700">Do not allow access to Profile</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-sm font-semibold text-gray-800 mb-6">Profile Photo</p>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      <div onClick={handlePhotoClick}
                        className="relative w-40 h-40 rounded-full border-2 border-dashed border-gray-300 hover:border-[#1a73e8] flex flex-col items-center justify-center cursor-pointer transition overflow-hidden group">
                        {formData.profilePhoto ? (
                          <>
                            <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            <button type="button" onClick={removePhoto}
                              className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-red-600 transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <svg className="w-10 h-10 text-gray-400 mb-2 group-hover:text-[#1a73e8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="text-sm text-gray-500 group-hover:text-[#1a73e8] transition">Upload</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">JPG, JPEG or PNG. Max 6MB.<br />Min 100×100px.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="w-8 h-8 text-gray-400 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <p className="text-base text-gray-500">Loading form...</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex items-center gap-3">
              <button onClick={handleNext}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-1.5">
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button onClick={() => setCreateOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>

              <button onClick={handleSaveProfile} disabled={saving}
                className={`ml-auto px-6 py-2.5 text-sm font-medium text-white rounded-lg transition ${saving ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a73e8] hover:bg-[#1557b0]'}`}>
                {saving ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============== REUSABLE ==============

function NavLink({ href, label, icon, active = false }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} className={`relative flex items-center gap-3 px-3 py-2.5 text-[13.5px] rounded-md ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
      {active && (<span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#1a73e8] rounded-r"></span>)}
      <span className="text-gray-500">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function StatCard({ number, label }: { number: number; label: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">{number}</span>
        <span className="text-[15px] text-gray-700 font-medium">{label}</span>
      </div>
    </div>
  );
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 bg-white font-medium whitespace-nowrap">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
      {label}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
  );
}

// ============== ICONS ==============
function IconDashboard() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>; }
function IconTask() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function IconCalendar() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IconMessage() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>; }
function IconProfiles() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconUser() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function IconGroup() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function IconBook() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>; }
function IconBolt() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function IconActivity() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 12h3l3-9 4 18 3-9h5" /></svg>; }
function IconForm() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function IconChart() { return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }