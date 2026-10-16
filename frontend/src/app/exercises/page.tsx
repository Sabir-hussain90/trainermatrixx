'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ====== CONSTANTS ======
const EXERCISES_STORAGE_KEY = 'exercises_data';
const ACCESS_OPTIONS = ['Myself', 'Shared with All Users', 'Shared with Groups'];
const BODY_SEGMENT_OPTIONS = ['Upper Body', 'Lower Body', 'Core', 'Full Body', 'Arms', 'Legs', 'Back', 'Chest', 'Shoulders'];
const UNITS_OF_MEASURE = ['Reps', 'Weight', 'Distance', 'Time'];
const PRIMARY_MUSCLE_OPTIONS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body',
];
const EQUIPMENT_OPTIONS = [
  'None', 'Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Band',
  'Machine', 'Cable', 'Bodyweight', 'Medicine Ball', 'TRX',
];
const MECHANICS_OPTIONS = ['Compound', 'Isolation'];
const FORCE_OPTIONS = ['Push', 'Pull', 'Static'];
const COLUMN_OPTIONS = ['Name', 'Primary Muscle', 'Equipment', 'Mechanics', 'Force', 'Access'];
const VALUE_OPTIONS = ['Any', 'Contains', 'Equals', 'Starts with', 'Ends with'];

// ==================== MAIN PAGE ====================
export default function ExercisesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // VIEW: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingExercise, setEditingExercise] = useState<any | null>(null);

  // Sidebar sections
  const [openSections, setOpenSections] = useState({
    home: true, organization: true, library: true, analytics: true,
  });

  // LIST STATE
  const [activeTab, setActiveTab] = useState('All Exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [exercises, setExercises] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // FILTERS
  const [fieldFilter, setFieldFilter] = useState<string | null>(null);
  const [fieldFilterCount, setFieldFilterCount] = useState(0);
  const [fieldOpen, setFieldOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const [columnOpen, setColumnOpen] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [selectedColumn, setSelectedColumn] = useState('');

  const [valueOpen, setValueOpen] = useState(false);
  const valueRef = useRef<HTMLDivElement>(null);
  const [selectedValue, setSelectedValue] = useState('');

  // FORM STATE
  const [name, setName] = useState('');
  const [access, setAccess] = useState('Myself');
  const [units, setUnits] = useState<string[]>(['Reps']);
  const [bodySegment, setBodySegment] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [mechanics, setMechanics] = useState('');
  const [force, setForce] = useState('');
  const [instructions, setInstructions] = useState('');
  const [videoPlatform, setVideoPlatform] = useState<'None' | 'YouTube' | 'Vimeo'>('None');
  const [videoUrl, setVideoUrl] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);

  // ACTIONS
  const [actionsExercise, setActionsExercise] = useState<any | null>(null);
  const [deleteExercise, setDeleteExercise] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // ====== LOAD ======
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser({ name: 'Naeem2004', email: 'naeem@example.com', role: 'Admin' });

    const stored = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setExercises(parsed);
      } catch (err) { console.error(err); }
    }
    setDataLoaded(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (dataLoaded) localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
  }, [exercises, dataLoaded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (fieldRef.current && !fieldRef.current.contains(t)) setFieldOpen(false);
      if (columnRef.current && !columnRef.current.contains(t)) setColumnOpen(false);
      if (valueRef.current && !valueRef.current.contains(t)) setValueOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (deleteExercise || actionsExercise) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [deleteExercise, actionsExercise]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ====== HELPERS ======
  const getInitials = (n: string) => {
    const parts = n.split(/[.\s+_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUnit = (u: string) => {
    setUnits((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]);
    if (formErrors.units) setFormErrors({ ...formErrors, units: '' });
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File too large. Max 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ====== OPEN CREATE ======
  const openCreateForm = () => {
    setName('');
    setAccess('Myself');
    setUnits(['Reps']);
    setBodySegment('');
    setPrimaryMuscle('');
    setEquipment('');
    setMechanics('');
    setForce('');
    setInstructions('');
    setVideoPlatform('None');
    setVideoUrl('');
    setSourceLabel('');
    setScreenshot(null);
    setShareWithCommunity(false);
    setFormErrors({});
    setEditingExercise(null);
    setView('create');
  };

  // ====== OPEN EDIT ======
  const openEditForm = (ex: any) => {
    setName(ex.name || '');
    setAccess(ex.access || 'Myself');
    setUnits(ex.units || ['Reps']);
    setBodySegment(ex.bodySegment || '');
    setPrimaryMuscle(ex.primaryMuscle || '');
    setEquipment(ex.equipment || '');
    setMechanics(ex.mechanics || '');
    setForce(ex.force || '');
    setInstructions(ex.instructions || '');
    setVideoPlatform(ex.videoPlatform || 'None');
    setVideoUrl(ex.videoUrl || '');
    setSourceLabel(ex.sourceLabel || '');
    setScreenshot(ex.screenshot || null);
    setShareWithCommunity(ex.shareWithCommunity || false);
    setFormErrors({});
    setEditingExercise(ex);
    setActionsExercise(null);
    setView('edit');
  };

  const closeForm = () => {
    setView('list');
    setEditingExercise(null);
  };

  // ====== SAVE ======
  const handleSave = async () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Exercise name is required';
    if (units.length === 0) errs.units = 'Select at least one unit of measure';

    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setFormErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    if (editingExercise) {
      setExercises((prev) =>
        prev.map((e) =>
          e.id === editingExercise.id
            ? {
                ...e, name: name.trim(), access, units, bodySegment, primaryMuscle,
                equipment, mechanics, force, instructions, videoPlatform, videoUrl,
                sourceLabel, screenshot, shareWithCommunity,
                classification: { ...e.classification, muscleGroup: primaryMuscle || bodySegment, equipment },
              }
            : e
        )
      );
      setToast({ message: 'Exercise updated successfully' });
    } else {
      const newExercise = {
        id: Date.now(),
        name: name.trim(),
        access, units, bodySegment, primaryMuscle, equipment, mechanics, force,
        instructions, videoPlatform, videoUrl, sourceLabel, screenshot, shareWithCommunity,
        classification: { category: '', muscleGroup: primaryMuscle || bodySegment, equipment },
        creator: user?.name || 'Admin',
        createdAt: new Date().toISOString(),
      };
      setExercises((prev) => [newExercise, ...prev]);
      setToast({ message: 'Exercise created successfully' });
    }
    setSaving(false);
    setView('list');
    setEditingExercise(null);
  };

  // ====== ACTIONS ======
  const handleEditFromActions = () => { if (actionsExercise) openEditForm(actionsExercise); };

  const handleDuplicateExercise = () => {
    if (!actionsExercise) return;
    const dup = { ...actionsExercise, id: Date.now(), name: `${actionsExercise.name} - duplicate` };
    setExercises((prev) => [dup, ...prev]);
    setToast({ message: `"${actionsExercise.name}" duplicated` });
    setActionsExercise(null);
  };

  const handleOpenDelete = () => {
    if (actionsExercise) { setDeleteExercise(actionsExercise); setActionsExercise(null); }
  };

  const confirmDeleteExercise = () => {
    if (deleteExercise) {
      setExercises((prev) => prev.filter((e) => e.id !== deleteExercise.id));
      setToast({ message: 'Exercise deleted successfully' });
      setDeleteExercise(null);
    }
  };

  // ====== VIDEO PREVIEW ======
  const getYoutubeThumb = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
  };
  const getVimeoThumb = (url: string) => {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? `https://vumbnail.com/${m[1]}.jpg` : '';
  };
  const previewThumb =
    videoPlatform === 'YouTube' ? getYoutubeThumb(videoUrl)
    : videoPlatform === 'Vimeo' ? getVimeoThumb(videoUrl)
    : '';

  // ====== FILTERING ======
  const filteredExercises = exercises.filter((e) => {
    if (activeTab === 'My Exercises' && e.creator !== user?.name) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (e.name || '').toLowerCase().includes(q) ||
        (e.primaryMuscle || '').toLowerCase().includes(q) ||
        (e.equipment || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filteredExercises.length;
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

      {/* TOAST */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300]">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 py-3.5 px-5 flex items-center gap-3 min-w-[320px]">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen">
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-white">
            {!logoError ? (
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
            ) : (
              <span className="text-white text-sm font-bold bg-amber-600 w-full h-full flex items-center justify-center">{getInitials(user.name)}</span>
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
                <NavLink href="/exercises" label="Exercises" active icon={<IconActivity />} />
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
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">{getInitials(user.name)}</div>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
              <p className="text-[11px] text-gray-500 leading-none mt-1">{user.role}</p>
            </div>
          </div>
        </header>

        {/* ======================== LIST VIEW ======================== */}
        {view === 'list' && (
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercises</h1>
                <p className="text-sm text-gray-500">Manage your exercise library and filter by training attributes.</p>
              </div>
              <button
                onClick={openCreateForm}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Exercise
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Toolbar */}
              <div className="px-6 py-4 flex items-center gap-3 flex-wrap border-b border-gray-100">
                <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 rounded-full p-1">
                  {['All Exercises', 'My Exercises'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap ${
                        activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Field */}
                <div className="relative flex-shrink-0" ref={fieldRef}>
                  <button
                    onClick={() => setFieldOpen(!fieldOpen)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium whitespace-nowrap border-2 transition ${
                      fieldFilterCount > 0
                        ? 'border-[#1a73e8] text-[#1a73e8] bg-blue-50/50'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Field {fieldFilterCount > 0 ? `(${fieldFilterCount})` : ''}
                    <svg className={`w-3.5 h-3.5 transition-transform ${fieldOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {fieldOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4">
                      <p className="text-[12px] font-semibold text-gray-500 tracking-wider mb-3">FILTER BY FIELD</p>
                      <div className="space-y-2">
                        {COLUMN_OPTIONS.map((col) => (
                          <label key={col} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fieldFilter === col}
                              onChange={() => {
                                setFieldFilter(fieldFilter === col ? null : col);
                                setFieldFilterCount(fieldFilter === col ? 0 : 1);
                              }}
                              className="rounded border-gray-300 w-4 h-4 text-[#1a73e8] focus:ring-[#1a73e8]"
                            />
                            <span className="text-[14px] text-gray-800">{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column */}
                <div className="relative flex-shrink-0" ref={columnRef}>
                  <button
                    onClick={() => setColumnOpen(!columnOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 bg-white font-medium whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {selectedColumn || 'Column'}
                    <svg className={`w-3.5 h-3.5 transition-transform ${columnOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {columnOpen && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                      {COLUMN_OPTIONS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setSelectedColumn(c); setColumnOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedColumn === c ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="relative flex-shrink-0" ref={valueRef}>
                  <button
                    onClick={() => setValueOpen(!valueOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 bg-white font-medium whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {selectedValue || 'Value'}
                    <svg className={`w-3.5 h-3.5 transition-transform ${valueOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {valueOpen && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                      {VALUE_OPTIONS.map((v) => (
                        <button
                          key={v}
                          onClick={() => { setSelectedValue(v); setValueOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedValue === v ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-64 outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                  </div>

                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-md px-3 py-2 outline-none bg-white font-medium"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* FILTER BY FIELD chip */}
              {fieldFilter && (
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/40">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-[13.5px] text-gray-700 shadow-sm">
                    <span className="font-semibold tracking-wider text-[11.5px] text-gray-500 uppercase">FILTER BY FIELD</span>
                    <span className="text-gray-800">{fieldFilter}</span>
                    <button
                      onClick={() => { setFieldFilter(null); setFieldFilterCount(0); }}
                      className="ml-1 w-4 h-4 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/40">
                      <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></th>
                      <th className="px-4 py-3 font-medium text-xs">Name <span className="text-[#1a73e8]">▲</span></th>
                      <th className="px-4 py-3 font-medium text-xs">Primary Muscle</th>
                      <th className="px-4 py-3 font-medium text-xs">Equipment</th>
                      <th className="px-4 py-3 font-medium text-xs">Mechanics</th>
                      <th className="px-4 py-3 font-medium text-xs">Force</th>
                      <th className="px-4 py-3 font-medium text-xs">Access</th>
                      <th className="px-6 py-3 font-medium text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExercises.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                          No exercises yet. Click <button onClick={openCreateForm} className="font-medium text-[#1a73e8] hover:underline">Create Exercise</button> to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredExercises.map((ex: any) => (
                        <tr key={ex.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                                </svg>
                              </div>
                              <span className="font-medium text-gray-800">{ex.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{ex.primaryMuscle || ex.classification?.muscleGroup || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{ex.equipment || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{ex.mechanics || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{ex.force || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{ex.access || '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setActionsExercise(ex)}
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 inline-flex"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of{' '}
                  <span className="font-semibold text-gray-700">{totalItems}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${
                      currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                  </button>
                  <button
                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${
                      currentPage >= totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================== CREATE / EDIT EXERCISE FULL PAGE ======================== */}
        {(view === 'create' || view === 'edit') && (
          <div className="flex-1 overflow-y-auto bg-[#f5f6f8]">

            {/* Header — matches the screenshot exactly */}
            <div className="bg-white px-8 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={closeForm}
                  className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 transition"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-[19px] font-bold text-gray-900 leading-tight">
                    {view === 'edit' ? 'Edit Exercise' : 'Create Exercise'}
                  </h1>
                  <p className="text-[13px] text-gray-500 leading-tight mt-0.5">
                    {view === 'edit' ? 'Update the exercise details below.' : 'Fill in the details to add a new exercise.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-10 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-7">

                {/* ===== LEFT ===== */}
                <div className="space-y-6">

                  {/* BASIC INFO */}
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-6">Basic Info</h3>

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[13.5px] font-semibold text-gray-800">
                          Exercise Name <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[12px] text-gray-400">{name.length}/100</span>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        autoFocus
                        placeholder="e.g. Barbell Back Squat"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${
                          formErrors.name
                            ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                            : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'
                        }`}
                      />
                      {formErrors.name && <p className="text-xs text-red-500 mt-1.5">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Access</label>
                      <div className="relative">
                        <select
                          value={access}
                          onChange={(e) => setAccess(e.target.value)}
                          className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                        >
                          {ACCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* CLASSIFICATION */}
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-6">Classification</h3>

                    <div className="mb-6">
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-3">
                        Units of Measure <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {UNITS_OF_MEASURE.map((u) => {
                          const active = units.includes(u);
                          return (
                            <button
                              key={u}
                              type="button"
                              onClick={() => toggleUnit(u)}
                              className={`px-5 h-[42px] rounded-full text-[14px] font-medium transition border ${
                                active
                                  ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {u}
                            </button>
                          );
                        })}
                      </div>
                      {formErrors.units && <p className="text-xs text-red-500 mt-2">{formErrors.units}</p>}
                    </div>

                    <div className="mb-5">
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Body Segment</label>
                      <div className="relative">
                        <select value={bodySegment} onChange={(e) => setBodySegment(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                          <option value="">— Select —</option>
                          {BODY_SEGMENT_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Primary Muscle</label>
                      <div className="relative">
                        <select value={primaryMuscle} onChange={(e) => setPrimaryMuscle(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                          <option value="">— Select —</option>
                          {PRIMARY_MUSCLE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Equipment</label>
                      <div className="relative">
                        <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                          <option value="">— Select —</option>
                          {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Mechanics</label>
                        <div className="relative">
                          <select value={mechanics} onChange={(e) => setMechanics(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                            <option value="">— Select —</option>
                            {MECHANICS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Force</label>
                        <div className="relative">
                          <select value={force} onChange={(e) => setForce(e.target.value)} className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                            <option value="">— Select —</option>
                            {FORCE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INSTRUCTIONS */}
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[16px] font-bold text-gray-900">Instructions</h3>
                      <span className="text-[12px] text-gray-400">{instructions.length}/1000</span>
                    </div>
                    <textarea
                      rows={6}
                      maxLength={1000}
                      placeholder="Describe how to perform this exercise step by step..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] outline-none transition resize-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                    />
                  </div>
                </div>

                {/* ===== RIGHT ===== */}
                <div className="space-y-6">

                  {/* VIDEO CARD */}
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-6">Video</h3>

                    <div className="aspect-video rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden bg-[#0b1426]">
                      {previewThumb ? (
                        <img src={previewThumb} alt="Video preview" className="w-full h-full object-cover" />
                      ) : videoPlatform === 'YouTube' ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-[#ff0000] flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                          <p className="text-[13.5px] text-white/70 font-medium">YouTube video</p>
                          <p className="text-[12px] text-white/40 mt-1">Paste a URL below to see preview</p>
                        </>
                      ) : videoPlatform === 'Vimeo' ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-[#1ab7ea] flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                          <p className="text-[13.5px] text-white/70 font-medium">Vimeo video</p>
                          <p className="text-[12px] text-white/40 mt-1">Paste a URL below to see preview</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-white/50 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                          <p className="text-[13.5px] text-white/50">Select a platform and enter a URL</p>
                        </>
                      )}
                    </div>

                    <div className="mb-5">
                      <label className="block text-[14px] font-bold text-gray-900 mb-3">Platform</label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {(['None', 'YouTube', 'Vimeo'] as const).map((p) => {
                          const active = videoPlatform === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setVideoPlatform(p)}
                              className={`px-6 h-[46px] rounded-full text-[15px] font-medium transition ${
                                active ? 'bg-[#1e293b] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label className="block text-[14px] font-bold text-gray-900 mb-3">Video URL</label>
                      <div className="relative">
                        {videoPlatform === 'YouTube' ? (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md bg-[#ff0000]">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" /></svg>
                          </span>
                        ) : videoPlatform === 'Vimeo' ? (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md bg-[#1ab7ea]">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M22 7.4c-.2-1.1-.9-1.9-2-2.1C18.3 5 12 5 12 5s-6.3 0-8 .3c-1.1.2-1.8 1-2 2.1C1.8 9 1.8 12 1.8 12s0 3 .2 4.6c.2 1.1.9 1.9 2 2.1 1.7.3 8 .3 8 .3s6.3 0 8-.3c1.1-.2 1.8-1 2-2.1.2-1.6.2-4.6.2-4.6s0-3-.2-4.6zM9.8 15.5V8.5l6 3.5-6 3.5z" /></svg>
                          </span>
                        ) : null}
                        <input
                          type="text"
                          placeholder={videoPlatform === 'None' ? 'Select a platform first' : `Paste ${videoPlatform} URL...`}
                          value={videoUrl}
                          disabled={videoPlatform === 'None'}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className={`w-full h-[48px] pr-4 border border-gray-300 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 disabled:bg-gray-50 disabled:text-gray-400 ${
                            videoPlatform !== 'None' ? 'pl-14' : 'pl-4'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-gray-900 mb-3">Source Label (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Coach John's Tutorial"
                        value={sourceLabel}
                        onChange={(e) => setSourceLabel(e.target.value)}
                        className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                      />
                    </div>
                  </div>

                  {/* SCREENSHOT + SHARE */}
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-6">Screenshot</h3>

                    <input
                      ref={screenshotRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />

                    {screenshot ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-5">
                        <img src={screenshot} alt="Screenshot" className="w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow text-gray-600 hover:text-red-500 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => screenshotRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-12 flex flex-col items-center justify-center hover:border-[#1a73e8] hover:bg-blue-50/30 transition mb-5"
                      >
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                          </svg>
                        </div>
                        <p className="text-[14.5px] font-semibold text-gray-800 mb-1">Click to upload</p>
                        <p className="text-[12.5px] text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </button>
                    )}

                    {/* Share with community */}
                    <div className="flex items-center gap-4 px-5 py-4 border border-gray-200 rounded-xl bg-gray-50/40">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-[14.5px] font-semibold text-gray-900 leading-tight">Share with community</p>
                        <p className="text-[12.5px] text-gray-500 leading-tight mt-0.5">Make this exercise visible to other users</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={shareWithCommunity}
                        onClick={() => setShareWithCommunity(!shareWithCommunity)}
                        className={`relative w-12 h-7 rounded-full transition flex-shrink-0 ${
                          shareWithCommunity ? 'bg-[#1a73e8]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                            shareWithCommunity ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-7 mt-7 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 h-[44px] text-[14px] font-semibold text-white rounded-lg transition ${
                    saving ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a73e8] hover:bg-[#1557b0]'
                  }`}
                >
                  {saving
                    ? (view === 'edit' ? 'Saving...' : 'Creating...')
                    : (view === 'edit' ? 'Save Changes' : 'Create Exercise')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== EXERCISE ACTIONS MODAL ==================== */}
      {actionsExercise && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActionsExercise(null)}>
          <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-bold text-gray-900 leading-tight">Exercise actions</h3>
              <button onClick={() => setActionsExercise(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 -mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              <button onClick={handleEditFromActions} className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition">
                <svg className="w-[20px] h-[20px] text-[#1a73e8] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="text-[15px] font-semibold text-gray-900">Edit exercise</span>
              </button>

              <button onClick={handleDuplicateExercise} className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition">
                <svg className="w-[20px] h-[20px] text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                <span className="text-[15px] font-semibold text-gray-900">Duplicate exercise</span>
              </button>

              <button onClick={handleOpenDelete} className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-red-200 bg-red-50/50 text-[#b83232] hover:bg-red-50 text-left transition">
                <svg className="w-[20px] h-[20px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                <span className="text-[15px] font-semibold">Delete exercise</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION ==================== */}
      {deleteExercise && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative p-7">
            <button onClick={() => setDeleteExercise(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-3 pr-8">Delete &quot;{deleteExercise.name}&quot;?</h2>
            <p className="text-[15px] text-gray-500 mb-7">Are you sure you want to delete this exercise? This action cannot be undone.</p>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteExercise(null)} className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDeleteExercise} className="px-6 py-3 text-sm font-semibold text-white bg-[#e51b48] hover:bg-[#c9173d] rounded-full transition">Delete</button>
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
    <Link href={href} className={`relative flex items-center gap-3 px-3 py-2.5 text-[13.5px] rounded-md transition ${active ? 'bg-[#eef2fb] text-[#1a73e8] font-medium' : 'text-gray-600 hover:bg-[#f4f6fb] font-medium'}`}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#1a73e8] rounded-r"></span>}
      <span className={active ? 'text-[#1a73e8]' : 'text-gray-500'}>{icon}</span>
      <span>{label}</span>
    </Link>
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