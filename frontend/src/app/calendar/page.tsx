'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'calendar_events';

const USER_OPTIONS = ['sabir2014852', 'Naeem Shahzad'];
const PROFILE_OPTIONS = [{ id: 'p1', name: 'Profile 303' }];

// Generate time options every 15 minutes (12:00 am → 11:45 pm)
const generateTimeOptions = () => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h < 12 ? 'am' : 'pm';
      const minuteStr = String(m).padStart(2, '0');
      opts.push(`${hour12}:${minuteStr} ${period}`);
    }
  }
  return opts;
};

const TIME_OPTIONS = generateTimeOptions();

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const [openSections, setOpenSections] = useState({
    home: true,
    organization: true,
    library: true,
    analytics: true,
  });

  // ====== VIEW STATE (NEW) ======
  const [view, setView] = useState<'calendar' | 'account-info' | 'account-settings'>('calendar');

  // ====== ACCOUNT MENU (NEW) ======
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'Calendar' | 'Agenda'>('Calendar');
  const [viewMode, setViewMode] = useState<'Day' | 'Week'>('Week');

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // ====== CREATE EVENT MODAL ======
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    eventName: '',
    date: '',
    startTime: '12:00 pm',
    endTime: '1:00 pm',
    users: [] as string[],
    profiles: [] as string[],
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Time dropdown state
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef<HTMLDivElement>(null);

  // User / Profile dropdowns
  const [usersOpen, setUsersOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const usersRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<any[]>([]);

  // ====== ACCOUNT INFO FORM (NEW) ======
  const [activeInfoTab, setActiveInfoTab] = useState<'user' | 'business'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [website, setWebsite] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // ====== ACCOUNT SETTINGS (NEW) ======
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
    } else {
      router.push('/');
      return;
    }

    const storedEvents = localStorage.getItem(STORAGE_KEY);
    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) setEvents(parsed);
      } catch (err) {
        console.error(err);
      }
    }

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

    setEventsLoaded(true);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (eventsLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, eventsLoaded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (startTimeRef.current && !startTimeRef.current.contains(t)) setStartTimeOpen(false);
      if (endTimeRef.current && !endTimeRef.current.contains(t)) setEndTimeOpen(false);
      if (usersRef.current && !usersRef.current.contains(t)) setUsersOpen(false);
      if (profilesRef.current && !profilesRef.current.contains(t)) setProfilesOpen(false);
      if (accountMenuRef.current && !accountMenuRef.current.contains(t)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (createModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [createModalOpen]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
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

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  const fmtShort = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const fmtDayHeader = (d: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${days[d.getDay()]} ${mm}/${dd}`;
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  const formatHour = (h: number) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const closeModal = () => {
    setCreateModalOpen(false);
    setFormData({
      eventName: '',
      date: '',
      startTime: '12:00 pm',
      endTime: '1:00 pm',
      users: [],
      profiles: [],
      note: '',
    });
    setValidationErrors({});
    setStartTimeOpen(false);
    setEndTimeOpen(false);
    setUsersOpen(false);
    setProfilesOpen(false);
  };

  const toggleUser = (u: string) => {
    setFormData((prev) => ({
      ...prev,
      users: prev.users.includes(u) ? prev.users.filter((x) => x !== u) : [...prev.users, u],
    }));
    if (validationErrors.users) setValidationErrors({ ...validationErrors, users: '' });
  };

  const removeUser = (u: string) => {
    setFormData((prev) => ({ ...prev, users: prev.users.filter((x) => x !== u) }));
  };

  const toggleProfile = (p: string) => {
    setFormData((prev) => ({
      ...prev,
      profiles: prev.profiles.includes(p) ? prev.profiles.filter((x) => x !== p) : [...prev.profiles, p],
    }));
    if (validationErrors.profiles) setValidationErrors({ ...validationErrors, profiles: '' });
  };

  const removeProfile = (p: string) => {
    setFormData((prev) => ({ ...prev, profiles: prev.profiles.filter((x) => x !== p) }));
  };

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!formData.eventName.trim()) errors.eventName = 'Event Name is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.startTime) errors.startTime = 'Start Time is required';
    if (!formData.endTime) errors.endTime = 'End Time is required';
    if (formData.users.length === 0) errors.users = 'User is required';
    if (formData.profiles.length === 0) errors.profiles = 'Profile is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const newEvent = {
      id: Date.now(),
      title: formData.eventName,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      users: formData.users,
      profiles: formData.profiles,
      note: formData.note,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setSaving(false);
    closeModal();
    setToast({ message: 'Event created successfully', type: 'success' });
  };

  const getEventsForDay = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    return events.filter((e) => e.date === key);
  };

  const timeToHour = (t: string) => {
    const [time, period] = t.split(' ');
    const [h] = time.split(':');
    let hour = Number(h);
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return hour;
  };

  // ====== SAVE ACCOUNT INFO (NEW) ======
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

  // ====== LOGO UPLOAD (NEW) ======
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

  // ====== SAVE SETTINGS (NEW) ======
  const handleSaveSettings = () => {
    localStorage.setItem('account_settings', JSON.stringify({
      primaryColor,
      accountLogo,
      integrations,
    }));
    setToast({ message: 'Account settings saved', type: 'success' });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  const displayDays = viewMode === 'Week' ? weekDays : [new Date()];

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
                <NavLink href="/calendar" label="Calendar" active icon={<IconCalendar />} />
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
                <NavLink href="/profiles" label="Profiles" icon={<IconProfiles />} />
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

          {/* ACCOUNT MENU (NEW) */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                {getInitials(user.name)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                <p className="text-[11px] text-gray-500 leading-none mt-1">{user.role}</p>
              </div>
            </button>

            {accountMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-[320px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-[15px] font-semibold text-gray-900">{user.name}</p>
                  <p className="text-[12.5px] text-gray-500 mt-0.5">{user.role}</p>
                </div>
                <div className="py-2">
                  <button onClick={() => { setAccountMenuOpen(false); setView('calendar'); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
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

        {/* ==================== CALENDAR VIEW ==================== */}
        {view === 'calendar' && (
          <div className="flex-1 p-8 overflow-y-auto bg-[#f7f8fa]">

            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
                <p className="text-sm text-gray-500">View and manage your schedule and Events.</p>
              </div>
              <div className="flex items-center gap-2">
                <FilterButton label="All Groups" />
                <FilterButton label="All Users" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setActiveTab('Calendar')} className={`px-5 py-2 text-sm font-medium rounded-md transition ${activeTab === 'Calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Calendar</button>
                  <button onClick={() => setActiveTab('Agenda')} className={`px-5 py-2 text-sm font-medium rounded-md transition ${activeTab === 'Agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Agenda</button>
                </div>
                <button onClick={() => setCreateModalOpen(true)} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Create Event
                </button>
              </div>

              <div className="px-6 py-4 flex items-center gap-3 flex-wrap border-b border-gray-100">
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  {fmtShort(currentWeekStart)} – {fmtShort(weekEnd)}
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
                <button onClick={goToToday} className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50">Today</button>
                <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setViewMode('Day')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'Day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Day</button>
                  <button onClick={() => setViewMode('Week')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'Week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Week</button>
                </div>
              </div>

              {activeTab === 'Calendar' ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-[88px] border-r border-b border-gray-200 bg-white"></th>
                        {displayDays.map((d, i) => (
                          <th key={i} className={`border-r border-b border-gray-200 bg-white py-3.5 px-2 text-center text-sm font-semibold ${isToday(d) ? 'text-[#1a73e8]' : 'text-gray-800'}`}>
                            {fmtDayHeader(d)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map((hour) => (
                        <tr key={hour}>
                          <td className="w-[88px] border-r border-b border-gray-100 bg-white text-right align-top pt-2 pb-3 pr-3 text-[12px] text-gray-500 font-normal">
                            {formatHour(hour)}
                          </td>
                          {displayDays.map((d, i) => {
                            const dayEvents = getEventsForDay(d).filter((e) => timeToHour(e.startTime) === hour);
                            return (
                              <td key={i} className={`border-r border-b border-gray-100 align-top pt-1 pb-1 px-1.5 h-[68px] ${isToday(d) ? 'bg-blue-50/40' : 'bg-white'}`}>
                                {dayEvents.map((ev) => (
                                  <div key={ev.id} className="bg-[#1a73e8] text-white text-[11px] font-medium rounded-md px-2 py-1.5 mb-1 truncate" title={`${ev.title} (${ev.startTime} - ${ev.endTime})`}>
                                    {ev.title}
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6">
                  {events.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">No events scheduled.</div>
                  ) : (
                    <div className="space-y-3">
                      {[...events].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)).map((ev) => (
                        <div key={ev.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                          <div className="w-16 text-center flex-shrink-0">
                            <p className="text-xs text-gray-500 font-medium">{new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                            <p className="text-xl font-bold text-gray-800">{new Date(ev.date + 'T00:00:00').getDate()}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{ev.startTime} – {ev.endTime}</p>
                            {ev.note && <p className="text-xs text-gray-500 mt-1">{ev.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                        <div className="w-[220px] h-[220px] rounded-full bg-gray-200 flex items-center justify-center mb-6">
                          <span className="text-[42px] font-semibold text-gray-600">{getInitials(user.name)}</span>
                        </div>
                        <button type="button" onClick={() => setToast({ message: 'Photo upload coming soon', type: 'success' })} className="px-6 h-[42px] border border-gray-300 rounded-full bg-white hover:bg-gray-50 text-[14px] font-medium text-gray-700 transition">Change photo</button>
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
                      <button type="button" onClick={() => setView('calendar')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
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
                      <button type="button" onClick={() => setView('calendar')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
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
                  {/* InBody */}
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

                  {/* Evolt */}
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

                  {/* Styku */}
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

      {/* ==================== CREATE EVENT MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={closeModal} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="px-7 pt-7 pb-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0.5">Create Event</h2>
                <p className="text-sm text-gray-500">Schedule a new event.</p>
              </div>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto px-7 pb-4" noValidate>
              <div className="space-y-5">

                {/* Event Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Training Session"
                    value={formData.eventName}
                    onChange={(e) => {
                      setFormData({ ...formData, eventName: e.target.value });
                      if (validationErrors.eventName) setValidationErrors({ ...validationErrors, eventName: '' });
                    }}
                    className={`w-full h-11 px-4 border rounded-lg text-sm outline-none transition ${
                      validationErrors.eventName ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'
                    }`}
                  />
                  {validationErrors.eventName && <p className="text-xs text-red-500 mt-1.5">{validationErrors.eventName}</p>}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => {
                        setFormData({ ...formData, date: e.target.value });
                        if (validationErrors.date) setValidationErrors({ ...validationErrors, date: '' });
                      }}
                      className={`w-full h-11 pl-11 pr-3 border rounded-lg text-sm outline-none transition bg-white ${
                        validationErrors.date ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'
                      }`}
                    />
                  </div>
                  {validationErrors.date && <p className="text-xs text-red-500 mt-1.5">{validationErrors.date}</p>}
                </div>

                {/* Start Time + End Time */}
                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={startTimeRef}>
                      <button
                        type="button"
                        onClick={() => setStartTimeOpen(!startTimeOpen)}
                        className={`w-full h-11 px-4 border rounded-lg text-sm bg-white flex items-center justify-between outline-none transition ${
                          validationErrors.startTime
                            ? 'border-red-400'
                            : startTimeOpen
                            ? 'border-[#1a73e8] ring-4 ring-[#1a73e8]/10'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="text-gray-800">{formData.startTime}</span>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${startTimeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {startTimeOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
                          {TIME_OPTIONS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, startTime: t });
                                setStartTimeOpen(false);
                                if (validationErrors.startTime) setValidationErrors({ ...validationErrors, startTime: '' });
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition ${
                                formData.startTime === t
                                  ? 'bg-[#1a73e8] text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {validationErrors.startTime && <p className="text-xs text-red-500 mt-1.5">{validationErrors.startTime}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={endTimeRef}>
                      <button
                        type="button"
                        onClick={() => setEndTimeOpen(!endTimeOpen)}
                        className={`w-full h-11 px-4 border rounded-lg text-sm bg-white flex items-center justify-between outline-none transition ${
                          validationErrors.endTime
                            ? 'border-red-400'
                            : endTimeOpen
                            ? 'border-[#1a73e8] ring-4 ring-[#1a73e8]/10'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="text-gray-800">{formData.endTime}</span>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${endTimeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {endTimeOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
                          {TIME_OPTIONS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, endTime: t });
                                setEndTimeOpen(false);
                                if (validationErrors.endTime) setValidationErrors({ ...validationErrors, endTime: '' });
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition ${
                                formData.endTime === t
                                  ? 'bg-[#1a73e8] text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {validationErrors.endTime && <p className="text-xs text-red-500 mt-1.5">{validationErrors.endTime}</p>}
                  </div>
                </div>

                {/* User(s) */}
                <div className="relative" ref={usersRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    User(s) <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => setUsersOpen(!usersOpen)}
                    className={`w-full min-h-11 px-2 py-1.5 border rounded-lg text-sm bg-white cursor-pointer flex flex-wrap items-center gap-1.5 ${
                      validationErrors.users ? 'border-red-400' : 'border-gray-300'
                    }`}
                  >
                    {formData.users.length === 0 ? (
                      <span className="text-gray-400 pl-2 py-1">Select user(s)...</span>
                    ) : (
                      formData.users.map((u) => (
                        <span key={u} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-md">
                          {u}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeUser(u); }} className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))
                    )}
                    <svg className={`w-4 h-4 text-gray-500 ml-auto mr-1 transition-transform flex-shrink-0 ${usersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {usersOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                        {USER_OPTIONS.map((u) => {
                          const checked = formData.users.includes(u);
                          return (
                            <label key={u} className="flex items-center gap-3 cursor-pointer select-none">
                              <span className={`w-5 h-5 flex items-center justify-center rounded border-2 transition ${checked ? 'bg-[#1a73e8] border-[#1a73e8]' : 'bg-white border-gray-300'}`}>
                                {checked && (<svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>)}
                              </span>
                              <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleUser(u)} />
                              <span className="text-sm text-gray-800 font-medium">{u}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {validationErrors.users && <p className="text-xs text-red-500 mt-1.5">{validationErrors.users}</p>}
                </div>

                {/* Profile(s) */}
                <div className="relative" ref={profilesRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Profile(s) <span className="text-red-500">*</span></label>
                  <div
                    onClick={() => setProfilesOpen(!profilesOpen)}
                    className={`w-full min-h-11 px-2 py-1.5 border rounded-lg text-sm bg-white cursor-pointer flex flex-wrap items-center gap-1.5 ${
                      validationErrors.profiles ? 'border-red-400' : 'border-gray-300'
                    }`}
                  >
                    {formData.profiles.length === 0 ? (
                      <span className="text-gray-400 pl-2 py-1">Select profile(s)...</span>
                    ) : (
                      formData.profiles.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-md">
                          {p}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeProfile(p); }} className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))
                    )}
                    <svg className={`w-4 h-4 text-gray-500 ml-auto mr-1 transition-transform flex-shrink-0 ${profilesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {profilesOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                        {PROFILE_OPTIONS.map((prof) => {
                          const checked = formData.profiles.includes(prof.name);
                          return (
                            <label key={prof.id} className="flex items-center gap-3 cursor-pointer select-none">
                              <span className={`w-5 h-5 flex items-center justify-center rounded border-2 transition ${checked ? 'bg-[#1a73e8] border-[#1a73e8]' : 'bg-white border-gray-300'}`}>
                                {checked && (<svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>)}
                              </span>
                              <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleProfile(prof.name)} />
                              <span className="text-sm text-gray-800 font-medium">{prof.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {validationErrors.profiles && <p className="text-xs text-red-500 mt-1.5">{validationErrors.profiles}</p>}
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Note</label>
                  <textarea
                    rows={3}
                    placeholder="Add a note (optional)"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 transition resize-none"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition ${
                    saving ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a73e8] hover:bg-[#1557b0]'
                  }`}
                >
                  {saving ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
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

function FilterButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 bg-white font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
      {label}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </button>
  );
}

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