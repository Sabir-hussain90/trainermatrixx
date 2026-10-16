'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ====== CONSTANTS ======
const REPORTS_STORAGE_KEY = 'reports_data';

const REPORT_TYPE_GROUPS = [
  { title: 'Profiles and Metric', subtitle: 'Standard' },
  { title: 'Users and Metric', subtitle: 'Standard' },
  { title: 'Groups and Metric', subtitle: 'Standard' },
  { title: 'Profiles and Tasks', subtitle: 'Standard' },
  { title: 'Profiles and Forms', subtitle: 'Standard' },
  { title: 'Users and Groups', subtitle: 'Standard' },
  { title: 'Workouts and Completion', subtitle: 'Standard' },
  { title: 'Programs and Progress', subtitle: 'Standard' },
  { title: 'Assessments and Results', subtitle: 'Standard' },
  { title: 'Activity and Engagement', subtitle: 'Standard' },
];

const METRIC_OPTIONS = [
  'Weight', 'Body Fat %', 'BMI', 'Chest Circumference',
  'Waist Circumference', 'Body Composition', 'Blood Pressure',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

// ====== TYPES ======
type Report = {
  id: number;
  name: string;
  type: string;
  category: string;
  description?: string;
  creator?: string;
  createdAt?: string;
  updatedAt?: string;
};

type User = {
  name: string;
  email: string;
  role: string;
};

// ==================== CHOOSE REPORT TYPE MODAL ====================
function ChooseReportTypeModal({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (type: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  if (!open) return null;

  const filtered = REPORT_TYPE_GROUPS.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[560px] max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-8 pb-4">
          <div className="w-12 h-12 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 20v-8M12 20V4M19 20v-12" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 leading-tight">Choose Report Type</h2>
        </div>

        <div className="px-8 pb-4">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              placeholder="Search report types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[52px] pl-11 pr-4 border-2 border-[#1a73e8] rounded-full text-[14.5px] outline-none transition focus:ring-4 focus:ring-[#1a73e8]/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No report types found.</div>
          ) : (
            filtered.map((g) => {
              const isHovered = hovered === g.title;
              return (
                <button
                  key={g.title}
                  type="button"
                  onMouseEnter={() => setHovered(g.title)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onChoose(g.title)}
                  className="w-full flex items-center justify-between py-4 border-b border-gray-100 text-left transition"
                >
                  <div>
                    <p className={`text-[15.5px] font-semibold transition ${isHovered ? 'text-[#1a73e8]' : 'text-gray-900'}`}>
                      {g.title}
                    </p>
                    <p className={`text-[13px] mt-0.5 transition ${isHovered ? 'text-[#1a73e8]/80' : 'text-gray-500'}`}>
                      {g.subtitle}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition ${isHovered ? 'text-[#1a73e8]' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== REPORT BUILDER VIEW ====================
function ReportBuilder({
  reportType,
  onBack,
}: {
  reportType: string;
  onBack: () => void;
}) {
  const [metric, setMetric] = useState('');
  const [ageFrom, setAgeFrom] = useState('');
  const [ageTo, setAgeTo] = useState('');
  const [gender, setGender] = useState('');
  const [groups, setGroups] = useState('');
  const [users, setUsers] = useState('');
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleRun = () => {
    if (!metric) {
      setToast({ message: 'Please select a metric first' });
      return;
    }
    setToast({ message: 'Running report...' });
  };

  const handleSave = () => {
    setToast({ message: 'Report saved' });
  };

  const handleExport = () => {
    setToast({ message: 'Exporting report...' });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f6f8]">

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

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 pt-7 pb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{reportType}</h1>
              <p className="text-[13px] text-gray-500 leading-tight mt-0.5">Standard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 h-[42px] rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[14px] font-medium text-gray-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
              </svg>
              Export
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 h-[42px] rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[14px] font-medium text-gray-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8" />
              </svg>
              Save
            </button>
            <button
              type="button"
              onClick={handleRun}
              className="flex items-center gap-2 px-5 h-[42px] rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[14px] font-semibold transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-7 max-w-[1400px] mx-auto space-y-6">

        {/* REPORT FILTERS CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
          <p className="text-[11px] font-bold text-gray-500 tracking-[0.12em] uppercase mb-6">Report Filters</p>

          {/* Row 1: Metric + Age From + Age To */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-5 mb-5">
            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">
                Metric: <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className={`w-full h-[48px] px-4 border rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10 ${
                    !metric ? 'text-gray-400' : 'text-gray-800'
                  } border-gray-300`}
                >
                  <option value="">Select Metric</option>
                  {METRIC_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Age From:</label>
              <div className="relative">
                <select
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className={`w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10 ${
                    !ageFrom ? 'text-gray-400' : 'text-gray-800'
                  }`}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 100 }).map((_, i) => (
                    <option key={i} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Age To:</label>
              <div className="relative">
                <select
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className={`w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10 ${
                    !ageTo ? 'text-gray-400' : 'text-gray-800'
                  }`}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 100 }).map((_, i) => (
                    <option key={i} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Gender + Date + Groups + Users */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-5">
            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Gender:</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10 ${
                    !gender ? 'text-gray-400' : 'text-gray-800'
                  }`}
                >
                  <option value="">Select a sex</option>
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Date:</label>
              <button
                type="button"
                className="w-full h-[48px] px-4 border border-gray-300 rounded-full bg-white flex items-center gap-2.5 text-[14px] text-gray-800 outline-none transition hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-[#1a73e8] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate">10/15/2025 – 10/15/2026</span>
                <svg className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Groups:</label>
              <button
                type="button"
                onClick={() => setGroups(groups ? '' : 'Selected group')}
                className="w-full h-[48px] px-4 border border-gray-300 rounded-full bg-white flex items-center gap-2.5 text-[14px] text-gray-500 outline-none transition hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-[#1a73e8] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate">{groups || 'Select group'}</span>
                <svg className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Users:</label>
              <button
                type="button"
                onClick={() => setUsers(users ? '' : 'Selected user')}
                className="w-full h-[48px] px-4 border border-gray-300 rounded-full bg-white flex items-center gap-2.5 text-[14px] text-gray-500 outline-none transition hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-[#1a73e8] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate">{users || 'Select user'}</span>
                <svg className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* REPORT DETAILS CARD (placeholder for next screen) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm min-h-[260px]">
          <p className="text-[11px] font-bold text-gray-500 tracking-[0.12em] uppercase mb-4">Report Details</p>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 20v-8M12 20V4M19 20v-12" />
              </svg>
            </div>
            <p className="text-[14px] text-gray-500">
              Select a metric and click <span className="font-semibold text-gray-800">Run</span> to see report details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN REPORTS PAGE ====================
export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [openSections, setOpenSections] = useState({
    home: true, organization: true, library: true, analytics: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState<Report[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // VIEW FLOW: 'list' | 'builder'
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [selectedType, setSelectedType] = useState<string>('');

  const [chooseTypeOpen, setChooseTypeOpen] = useState(false);
  const [actionsReport, setActionsReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser({ name: 'Naeem2004', email: 'naeem@example.com', role: 'Admin' });

    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setReports(parsed);
      } catch (err) { console.error(err); }
    }
    setDataLoaded(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (dataLoaded) localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }, [reports, dataLoaded]);

  useEffect(() => {
    if (deleteReport || actionsReport || chooseTypeOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [deleteReport, actionsReport, chooseTypeOpen]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const getInitials = (n: string) => {
    const parts = n.split(/[.\s+_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return '—'; }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openNewReportFlow = () => setChooseTypeOpen(true);

  const handleChooseType = (type: string) => {
    setChooseTypeOpen(false);
    setSelectedType(type);
    setView('builder');
  };

  const handleDuplicateReport = () => {
    if (!actionsReport) return;
    const dup: Report = {
      ...actionsReport,
      id: Date.now(),
      name: `${actionsReport.name} - duplicate`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReports((prev) => [dup, ...prev]);
    setToast({ message: `"${actionsReport.name}" duplicated` });
    setActionsReport(null);
  };

  const handleOpenDelete = () => {
    if (actionsReport) { setDeleteReport(actionsReport); setActionsReport(null); }
  };

  const confirmDeleteReport = () => {
    if (deleteReport) {
      setReports((prev) => prev.filter((r) => r.id !== deleteReport.id));
      setToast({ message: 'Report deleted successfully' });
      setDeleteReport(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filteredReports.length;
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
                <NavLink href="/reports" label="Reports" active icon={<IconChart />} />
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
                <p className="text-sm text-gray-500">Build and run analytics reports across profiles, users, groups, and more.</p>
              </div>
              <button
                onClick={openNewReportFlow}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Report
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center gap-3 flex-nowrap overflow-x-auto border-b border-gray-100">
                <div className="relative flex-1 min-w-[240px]">
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-full outline-none focus:border-[#1a73e8]"
                  />
                </div>

                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                    <button onClick={() => setViewMode('list')} className={`w-8 h-8 flex items-center justify-center rounded-full transition ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`w-8 h-8 flex items-center justify-center rounded-full transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
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
                      <th className="px-4 py-3 font-medium text-xs">Report Name</th>
                      <th className="px-4 py-3 font-medium text-xs">Report Type</th>
                      <th className="px-4 py-3 font-medium text-xs">Category</th>
                      <th className="px-4 py-3 font-medium text-xs">Created By</th>
                      <th className="px-4 py-3 font-medium text-xs">Updated</th>
                      <th className="px-6 py-3 font-medium text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                          No reports yet. Click <button onClick={openNewReportFlow} className="font-medium text-[#1a73e8] hover:underline">New Report</button> to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></td>
                          <td className="px-4 py-4 font-medium text-gray-800">{r.name}</td>
                          <td className="px-4 py-4 text-gray-600">{r.type || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{r.category || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{r.creator || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{formatDate(r.updatedAt || r.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setActionsReport(r)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 inline-flex">
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

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of{' '}
                  <span className="font-semibold text-gray-700">{totalItems}</span>
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

        {/* ======================== BUILDER VIEW ======================== */}
        {view === 'builder' && (
          <ReportBuilder reportType={selectedType} onBack={() => setView('list')} />
        )}
      </main>

      {/* CHOOSE REPORT TYPE MODAL */}
      <ChooseReportTypeModal
        open={chooseTypeOpen}
        onClose={() => setChooseTypeOpen(false)}
        onChoose={handleChooseType}
      />

      {/* ACTIONS MODAL */}
      {actionsReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActionsReport(null)}>
          <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-[22px] font-bold text-gray-900 leading-tight">Report actions</h3>
              <button onClick={() => setActionsReport(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 -mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setSelectedType(actionsReport.type || 'Profiles and Metric'); setView('builder'); setActionsReport(null); }}
                className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition">
                <svg className="w-[20px] h-[20px] text-[#1a73e8] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="text-[15px] font-semibold text-gray-900">Edit report</span>
              </button>
              <button onClick={handleDuplicateReport} className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition">
                <svg className="w-[20px] h-[20px] text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                <span className="text-[15px] font-semibold text-gray-900">Duplicate report</span>
              </button>
              <button onClick={handleOpenDelete} className="w-full flex items-center gap-3.5 px-5 py-[16px] rounded-xl border border-red-200 bg-red-50/50 text-[#b83232] hover:bg-red-50 text-left transition">
                <svg className="w-[20px] h-[20px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                <span className="text-[15px] font-semibold">Delete report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative p-7">
            <button onClick={() => setDeleteReport(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3 pr-8">Delete &quot;{deleteReport.name}&quot;?</h2>
            <p className="text-[15px] text-gray-500 mb-7">Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteReport(null)} className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDeleteReport} className="px-6 py-3 text-sm font-semibold text-white bg-[#e51b48] hover:bg-[#c9173d] rounded-full transition">Delete</button>
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