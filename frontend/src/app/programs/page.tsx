'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ====== CONSTANTS ======
const STORAGE_KEY = 'programs_data';
const WORKOUTS_STORAGE_KEY = 'workouts_data';
const EXERCISES_STORAGE_KEY = 'exercises_data';

const ACCESS_OPTIONS = ['Myself', 'Shared with All Users', 'Shared with Groups'];
const VISIBILITY_OPTIONS = [
  'Profiles can see all workouts',
  'Profiles can see assigned workouts',
  'Profiles cannot see workouts',
];

const METRIC_OPTIONS = [
  'Weight', 'Body Mass Index', 'Metabolic Rate: InBody', 'Metabolic Rate: Result',
  'Metabolic Rate: Harris-Benedict', 'Diastolic Blood Pressure: InBody',
  'Diastolic Blood Pressure: Result', 'Systolic Blood Pressure: InBody',
  'Systolic Blood Pressure: Result', 'Body Fat %: 3 Site Skinfold (Jackson & Pollock)',
  'Body Fat %: 7 Site Skinfold (Jackson & Pollock)', 'Body Fat %: BIA', 'Body Fat %: DEXA',
  'Body Fat %: Navy Method', 'Chest Circumference', 'Waist Circumference',
  'Hip Circumference', 'Thigh Circumference', 'Arm Circumference', 'Body Composition',
  'BMI', 'Lean Body Mass', 'Skeletal Muscle Mass', 'Body Water %',
  'Visceral Fat Level', 'Basal Metabolic Rate',
];

const ACTIVITY_TYPES = ['Workout', 'Rest Day', 'Assessment', 'Note'];
const DAYS = ['DAY 1', 'DAY 2', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 6', 'DAY 7'];

const WORKOUTS = [
  { id: 1, name: 'Full Body Strength', creator: 'Admin 1' },
  { id: 2, name: 'Upper Body Push', creator: 'Admin 1' },
  { id: 3, name: 'Lower Body Power', creator: 'Admin 1' },
  { id: 4, name: 'HIIT Cardio Blast', creator: 'Naeem Shahzad' },
  { id: 5, name: 'Core & Mobility', creator: 'Naeem Shahzad' },
  { id: 6, name: 'Pull Day', creator: 'sabir2014852' },
];

const EXERCISE_CATEGORIES = [
  'Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometrics', 'Core', 'Mobility',
];
const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body',
];
const EQUIPMENT_OPTIONS = [
  'None', 'Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Band', 'Machine', 'Cable', 'Bodyweight',
];

// ====== VIDEO URL HELPERS ======
// Extract YouTube video ID from any common YouTube URL format
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  // Matches:
  //   https://www.youtube.com/watch?v=VIDEO_ID
  //   https://youtu.be/VIDEO_ID
  //   https://www.youtube.com/embed/VIDEO_ID
  //   https://www.youtube.com/shorts/VIDEO_ID
  //   https://m.youtube.com/watch?v=VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
};

// ====== TYPE ICON ======
function TypeIcon({ type }: { type: string }) {
  const base = "w-[18px] h-[18px] text-white";
  const strokeProps = {
    fill: "none", stroke: "currentColor", strokeWidth: 2.2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };
  if (type === 'Workout') {
    return (
      <svg className={base} {...strokeProps}>
        <path d="M4.5 4.5 L19.5 19.5" />
        <path d="M3.5 7.5 L7.5 3.5" />
        <path d="M2 9 L9 2" />
        <path d="M16.5 16.5 L20.5 20.5" />
        <path d="M15 18 L22 11" />
      </svg>
    );
  }
  if (type === 'Rest Day') {
    return <svg className={base} {...strokeProps}><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
  }
  if (type === 'Assessment') {
    return <svg className={base} {...strokeProps}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
  }
  return <svg className={base} {...strokeProps}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}

// ====== TYPES ======
type ExerciseItem = {
  id: number;
  name: string;
  section?: string;
  sets?: number;
  reps?: number;
  weight?: string;
  notes?: string;
};

type SectionItem = {
  id: number;
  name: string;
};

type CanvasItem =
  | { kind: 'section'; data: SectionItem }
  | { kind: 'exercise'; data: ExerciseItem };

// ==================== CREATE EXERCISE MODAL ====================
function CreateExerciseModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (exercise: any) => void;
}) {
  const [name, setName] = useState('');
  const [access, setAccess] = useState('Myself');
  const [classification, setClassification] = useState({
    category: '',
    muscleGroup: '',
    equipment: '',
  });
  const [videoPlatform, setVideoPlatform] = useState<'None' | 'YouTube' | 'Vimeo'>('None');
  const [videoUrl, setVideoUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      setName('');
      setAccess('Myself');
      setClassification({ category: '', muscleGroup: '', equipment: '' });
      setVideoPlatform('None');
      setVideoUrl('');
      setInstructions('');
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Exercise name is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onSave({
      id: Date.now(),
      name: name.trim(),
      access,
      classification,
      videoPlatform,
      videoUrl,
      instructions,
    });
    onClose();
  };

  // ===== VIDEO ID + EMBED URL =====
  const youtubeId = videoPlatform === 'YouTube' ? getYouTubeId(videoUrl) : null;
  const vimeoId = videoPlatform === 'Vimeo' ? getVimeoId(videoUrl) : null;
  const embedUrl =
    youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`
      : vimeoId
        ? `https://player.vimeo.com/video/${vimeoId}`
        : '';
  const videoThumbnail =
    youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
      : vimeoId
        ? `https://vumbnail.com/${vimeoId}.jpg`
        : '';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[1060px] max-h-[92vh] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1">
          <div className="px-10 pt-9 pb-6">
            <h2 className="text-[26px] font-bold text-gray-900 leading-tight">Create Exercise</h2>
            <p className="text-[14px] text-gray-500 mt-1">Fill in the details to add a new exercise.</p>
          </div>

          <div className="px-10 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-2xl p-7">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-5">Basic Info</h3>

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
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full h-[52px] px-4 border rounded-lg text-[14px] outline-none transition ${
                        errors.name
                          ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                          : 'border-[#1a73e8] ring-4 ring-[#1a73e8]/10'
                      }`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Access</label>
                    <div className="relative">
                      <select
                        value={access}
                        onChange={(e) => setAccess(e.target.value)}
                        className="w-full h-[52px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                      >
                        {ACCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-7">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-5">Classification</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Category</label>
                      <div className="relative">
                        <select
                          value={classification.category}
                          onChange={(e) => setClassification({ ...classification, category: e.target.value })}
                          className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                        >
                          <option value="">Select category...</option>
                          {EXERCISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Muscle Group</label>
                      <div className="relative">
                        <select
                          value={classification.muscleGroup}
                          onChange={(e) => setClassification({ ...classification, muscleGroup: e.target.value })}
                          className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                        >
                          <option value="">Select muscle group...</option>
                          {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Equipment</label>
                      <div className="relative">
                        <select
                          value={classification.equipment}
                          onChange={(e) => setClassification({ ...classification, equipment: e.target.value })}
                          className="w-full h-[48px] px-4 border border-gray-300 rounded-lg text-[14px] bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                        >
                          <option value="">Select equipment...</option>
                          {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-2xl p-7">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-5">Video</h3>

                  {/* ===== VIDEO PREVIEW — plays inline when a valid URL is entered ===== */}
                  <div className="aspect-video bg-[#0f172a] rounded-xl flex flex-col items-center justify-center mb-6 relative overflow-hidden">
                    {embedUrl ? (
                      <iframe
                        key={embedUrl}
                        src={embedUrl}
                        title="Exercise video"
                        className="w-full h-full"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : videoThumbnail ? (
                      <img src={videoThumbnail} alt="Video preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                          <svg className="w-7 h-7 text-white/80 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-[13.5px] text-white/60">Select a platform and enter a URL</p>
                      </>
                    )}
                  </div>

                  {/* Platform selector */}
                  <div className="mb-5">
                    <label className="block text-[14px] font-bold text-gray-900 mb-3">Platform</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(['None', 'YouTube', 'Vimeo'] as const).map((p) => {
                        const isActive = videoPlatform === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setVideoPlatform(p)}
                            className={`px-6 h-[46px] rounded-full text-[15px] font-medium transition ${
                              isActive
                                ? 'bg-[#1e293b] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Video URL input — only when a platform is chosen */}
                  {videoPlatform !== 'None' && (
                    <div>
                      <label className="block text-[14px] font-bold text-gray-900 mb-3">Video URL</label>
                      <input
                        type="text"
                        placeholder={`Paste ${videoPlatform} URL...`}
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full h-[52px] px-4 border border-gray-300 rounded-lg text-[14px] outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                      />
                      {videoUrl && !embedUrl && (
                        <p className="text-xs text-red-500 mt-2">
                          {videoPlatform === 'YouTube'
                            ? 'Could not detect a valid YouTube video ID in that URL.'
                            : 'Could not detect a valid Vimeo video ID in that URL.'}
                        </p>
                      )}
                      {embedUrl && (
                        <p className="text-xs text-emerald-600 mt-2">
                          ✓ Video detected — it will play above.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-2xl p-7">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4">Instructions (optional)</h3>
                  <textarea
                    rows={5}
                    placeholder="Add coaching cues or step-by-step instructions..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] outline-none transition resize-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-10 py-5 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-7 h-[46px] text-[14.5px] font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className={`px-7 h-[46px] text-[14.5px] font-semibold rounded-full transition ${
              !name.trim()
                ? 'bg-[#a9c1e8] text-white cursor-not-allowed'
                : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
            }`}
          >
            Create Exercise
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PROGRAMS PAGE ====================
export default function ProgramsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // ====== EXTENDED VIEW STATE ======
  const [view, setView] = useState<'list' | 'create' | 'createWorkout' | 'account-info' | 'account-settings'>('list');

  // ====== ACCOUNT MENU STATE ======
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [openSections, setOpenSections] = useState({ home: true, organization: true, library: true, analytics: true });

  // LIST VIEW
  const [activeTab, setActiveTab] = useState('All Programs');
  const [createdByFilter, setCreatedByFilter] = useState('All');
  const [createdByOpen, setCreatedByOpen] = useState(false);
  const createdByRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [programs, setPrograms] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // CREATE PROGRAM FORM
  const [formData, setFormData] = useState({
    name: '', duration: '', access: 'Myself',
    visibility: 'Profiles can see all workouts',
    description: '', metrics: [] as string[],
    activities: {} as { [key: string]: any[] },
  });
  const [weeks, setWeeks] = useState(1);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metricSearch, setMetricSearch] = useState('');
  const metricsRef = useRef<HTMLDivElement>(null);
  const metricSearchRef = useRef<HTMLInputElement>(null);

  const [activityTypeFilter, setActivityTypeFilter] = useState('All');
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);
  const [activityView, setActivityView] = useState<'Grid' | 'List'>('Grid');

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // ADD ACTIVITY MODAL
  const [addActivityFor, setAddActivityFor] = useState<{ week: number; day: number } | null>(null);
  const [addActivityType, setAddActivityType] = useState('Workout');
  const [addActivityTab, setAddActivityTab] = useState<'All Workouts' | 'My Workouts'>('All Workouts');
  const [addActivityWorkout, setAddActivityWorkout] = useState('');
  const [addActivityWorkoutOpen, setAddActivityWorkoutOpen] = useState(false);
  const addActivityWorkoutRef = useRef<HTMLDivElement>(null);
  const addActivityTypeRef = useRef<HTMLDivElement>(null);
  const [addActivityTypeOpen, setAddActivityTypeOpen] = useState(false);

  // CREATE WORKOUT FORM STATE
  const [workoutData, setWorkoutData] = useState({
    name: '', duration: '', access: 'Myself', note: '',
  });
  const [workoutErrors, setWorkoutErrors] = useState<{ [key: string]: string }>({});
  const [workoutSaving, setWorkoutSaving] = useState(false);

  // CANVAS / DRAG-DROP STATE
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const sectionCounterRef = useRef(0);
  const exerciseCounterRef = useRef(0);

  // MODALS
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);

  // EXERCISES LIST
  const [customExercises, setCustomExercises] = useState<any[]>([]);

  const [actionsProgram, setActionsProgram] = useState<any | null>(null);
  const [deleteProgram, setDeleteProgram] = useState<any | null>(null);

  // ====== ACCOUNT INFO FORM ======
  const [activeInfoTab, setActiveInfoTab] = useState<'user' | 'business'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ====== WORKING ACCOUNT PHOTO ======
  const [accountPhoto, setAccountPhoto] = useState<string | null>(null);
  const accountPhotoInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [website, setWebsite] = useState('');

  const [infoErrors, setInfoErrors] = useState<{ [key: string]: string }>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // ====== ACCOUNT SETTINGS ======
  type SettingsTab = 'privileges' | 'metrics' | 'testing' | 'results' | 'branding' | 'integrations';
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('privileges');
  const [primaryColor, setPrimaryColor] = useState('#F59E0B');
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const accountLogoInputRef = useRef<HTMLInputElement>(null);

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
      setUser({ name: 'Naeem2004', email: 'naeem@example.com', role: 'Admin' });
      setFirstName('Naeem2004');
      setEmail('naeem@example.com');
    }

    const storedPrograms = localStorage.getItem(STORAGE_KEY);
    if (storedPrograms) {
      try {
        const parsed = JSON.parse(storedPrograms);
        if (Array.isArray(parsed)) setPrograms(parsed);
      } catch (err) { console.error(err); }
    }

    const storedExercises = localStorage.getItem(EXERCISES_STORAGE_KEY);
    if (storedExercises) {
      try {
        const parsed = JSON.parse(storedExercises);
        if (Array.isArray(parsed)) setCustomExercises(parsed);
      } catch (err) { console.error(err); }
    }

    const storedPhoto = localStorage.getItem('account_profile_photo');
    if (storedPhoto) setAccountPhoto(storedPhoto);

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
  }, []);

  useEffect(() => {
    if (dataLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }, [programs, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) localStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(customExercises));
  }, [customExercises, dataLoaded]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (createdByRef.current && !createdByRef.current.contains(t)) setCreatedByOpen(false);
      if (metricsRef.current && !metricsRef.current.contains(t)) { setMetricsOpen(false); setMetricSearch(''); }
      if (typeFilterRef.current && !typeFilterRef.current.contains(t)) setTypeFilterOpen(false);
      if (addMenuRef.current && !addMenuRef.current.contains(t)) setAddMenuOpen(false);
      if (addActivityWorkoutRef.current && !addActivityWorkoutRef.current.contains(t)) setAddActivityWorkoutOpen(false);
      if (addActivityTypeRef.current && !addActivityTypeRef.current.contains(t)) setAddActivityTypeOpen(false);
      if (accountMenuRef.current && !accountMenuRef.current.contains(t)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (deleteProgram || actionsProgram || addActivityFor || createExerciseOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [deleteProgram, actionsProgram, addActivityFor, createExerciseOpen]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (metricsOpen && metricSearchRef.current) setTimeout(() => metricSearchRef.current?.focus(), 50);
  }, [metricsOpen]);

  const getInitials = (name: string) => {
    const parts = name.split(/[.\s+_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/'); };
  const toggleSection = (key: keyof typeof openSections) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const openCreateForm = () => {
    setFormData({
      name: '', duration: '', access: 'Myself',
      visibility: 'Profiles can see all workouts',
      description: '', metrics: [], activities: {},
    });
    setWeeks(1);
    setValidationErrors({});
    setView('create');
  };

  const closeCreateForm = () => setView('list');

  const openCreateWorkout = () => {
    setWorkoutData({ name: '', duration: '', access: 'Myself', note: '' });
    setWorkoutErrors({});
    setCanvasItems([]);
    setSelectedExercise(null);
    setAddMenuOpen(false);
    setView('createWorkout');
  };

  const closeCreateWorkout = () => setView('create');

  // CANVAS ACTIONS
  const addSectionToCanvas = (name?: string) => {
    sectionCounterRef.current += 1;
    const newSection: CanvasItem = {
      kind: 'section',
      data: {
        id: Date.now() + sectionCounterRef.current,
        name: name || `Section ${sectionCounterRef.current}`,
      },
    };
    setCanvasItems((prev) => [...prev, newSection]);
  };

  const addExerciseToCanvas = (exerciseName?: string) => {
    exerciseCounterRef.current += 1;
    const newExercise: ExerciseItem = {
      id: Date.now() + exerciseCounterRef.current,
      name: exerciseName || `Exercise ${exerciseCounterRef.current}`,
      sets: 3,
      reps: 10,
      weight: '',
      notes: '',
    };
    const newItem: CanvasItem = { kind: 'exercise', data: newExercise };
    setCanvasItems((prev) => [...prev, newItem]);
    setSelectedExercise(newExercise);
  };

  const handleExercisePickerSelect = (name: string) => {
    addExerciseToCanvas(name);
    setExercisePickerOpen(false);
  };

  const handleSaveCustomExercise = (exercise: any) => {
    setCustomExercises((prev) => [exercise, ...prev]);
    setToast({ message: `Exercise "${exercise.name}" created`, type: 'success' });
    addExerciseToCanvas(exercise.name);
  };

  const removeCanvasItem = (index: number) => {
    setCanvasItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCanvasItem = (from: number, to: number) => {
    setCanvasItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index: number) => setDraggingIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null) return;
    if (draggingIndex !== index) setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null) return;
    if (draggingIndex !== index) moveCanvasItem(draggingIndex, index);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDraggingIndex(null); setDragOverIndex(null); };

  const handlePaletteDragStart = (e: React.DragEvent, kind: 'section' | 'exercise') => {
    e.dataTransfer.setData('palette-kind', kind);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const handleCanvasDropFromPalette = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('palette-kind');
    if (kind === 'section') addSectionToCanvas();
    else if (kind === 'exercise') addExerciseToCanvas();
    setDragOverIndex(null);
  };
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleSaveWorkout = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!workoutData.name.trim()) errors.name = 'Workout name is required';
    if (!workoutData.duration) errors.duration = 'Duration is required';

    if (Object.keys(errors).length > 0) { setWorkoutErrors(errors); return; }

    setWorkoutErrors({});
    setWorkoutSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const stored = localStorage.getItem(WORKOUTS_STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    const newWorkout = {
      id: Date.now(),
      name: workoutData.name,
      duration: workoutData.duration,
      access: workoutData.access,
      note: workoutData.note,
      items: canvasItems,
      creator: user?.name || 'Admin',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify([newWorkout, ...existing]));

    setWorkoutSaving(false);
    setToast({ message: 'Workout created successfully', type: 'success' });
    setView('create');
  };

  const toggleMetric = (m: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(m) ? prev.metrics.filter((x) => x !== m) : [...prev.metrics, m],
    }));
    if (validationErrors.metrics) setValidationErrors({ ...validationErrors, metrics: '' });
  };

  const removeMetric = (m: string) => setFormData((prev) => ({ ...prev, metrics: prev.metrics.filter((x) => x !== m) }));

  const filteredMetrics = METRIC_OPTIONS.filter((m) => m.toLowerCase().includes(metricSearch.toLowerCase()));

  const getActivityKey = (week: number, day: number) => `${week}-${day}`;

  const openAddActivityModal = (week: number, day: number) => {
    setAddActivityFor({ week, day });
    setAddActivityType('Workout');
    setAddActivityTab('All Workouts');
    setAddActivityWorkout('');
    setAddActivityWorkoutOpen(false);
    setAddActivityTypeOpen(false);
  };

  const closeAddActivityModal = () => {
    setAddActivityFor(null);
    setAddActivityWorkout('');
    setAddActivityTab('All Workouts');
    setAddActivityType('Workout');
    setAddActivityWorkoutOpen(false);
    setAddActivityTypeOpen(false);
  };

  const confirmAddActivity = () => {
    if (!addActivityFor || !addActivityWorkout) return;
    const { week, day } = addActivityFor;
    const key = getActivityKey(week, day);
    const current = formData.activities[key] || [];
    setFormData((prev) => ({
      ...prev,
      activities: { ...prev.activities, [key]: [...current, { id: Date.now(), name: addActivityWorkout, type: addActivityType }] },
    }));
    closeAddActivityModal();
    setToast({ message: `Added "${addActivityWorkout}" to Week ${week}, Day ${day}`, type: 'success' });
  };

  const handleAddActivityFromMenu = () => {
    setAddMenuOpen(false);
    openAddActivityModal(1, 1);
  };

  const handleCreateWorkoutFromMenu = () => {
    setAddMenuOpen(false);
    openCreateWorkout();
  };

  const removeActivity = (week: number, day: number, id: number) => {
    const key = getActivityKey(week, day);
    const current = formData.activities[key] || [];
    setFormData((prev) => ({ ...prev, activities: { ...prev.activities, [key]: current.filter((a) => a.id !== id) } }));
  };

  const copyWeek = (fromWeek: number) => {
    const newActivities = { ...formData.activities };
    for (let w = 1; w <= weeks; w++) {
      if (w === fromWeek) continue;
      for (let d = 1; d <= 7; d++) {
        const sourceKey = getActivityKey(fromWeek, d);
        const targetKey = getActivityKey(w, d);
        newActivities[targetKey] = (formData.activities[sourceKey] || []).map((a) => ({ ...a, id: Date.now() + Math.random() }));
      }
    }
    setFormData((prev) => ({ ...prev, activities: newActivities }));
    setToast({ message: `Week ${fromWeek} copied to all weeks`, type: 'success' });
  };

  const filteredWorkouts = WORKOUTS.filter((w) => addActivityTab === 'My Workouts' ? w.creator === user?.name : true);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Program name is required';
    if (!formData.duration) errors.duration = 'Duration is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.metrics.length === 0) errors.metrics = 'Select at least one metric';

    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }

    setValidationErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const newProgram = {
      id: Date.now(), name: formData.name, description: formData.description,
      weeks: formData.duration, access: formData.access, visibility: formData.visibility,
      metrics: formData.metrics, activities: formData.activities,
      createdBy: user?.name || 'Admin', createdAt: new Date().toISOString(),
    };
    setPrograms((prev) => [newProgram, ...prev]);
    setSaving(false);
    setToast({ message: 'Program created successfully', type: 'success' });
    setView('list');
  };

  const handleEditProgram = () => { if (actionsProgram) { setActionsProgram(null); router.push(`/programs/edit/${actionsProgram.id}`); } };
  const handleOpenDelete = () => { if (actionsProgram) { setDeleteProgram(actionsProgram); setActionsProgram(null); } };
  const confirmDeleteProgram = () => {
    if (deleteProgram) {
      setPrograms((prev) => prev.filter((p) => p.id !== deleteProgram.id));
      setDeleteProgram(null);
      setToast({ message: 'Program deleted successfully', type: 'success' });
    }
  };

  // ====== WORKING ACCOUNT PHOTO ======
  const handleAccountPhotoClick = () => {
    accountPhotoInputRef.current?.click();
  };

  const handleAccountPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setToast({ message: 'File too large. Max 6MB.', type: 'error' });
      return;
    }
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
    e.target.value = '';
  };

  const handleRemoveAccountPhoto = () => {
    setAccountPhoto(null);
    localStorage.removeItem('account_profile_photo');
    setToast({ message: 'Profile photo removed', type: 'success' });
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
        setInfoErrors(errs);
        setToast({ message: 'Please fix the highlighted fields', type: 'error' });
        return;
      }

      setInfoErrors({});
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
        setInfoErrors(errs);
        setToast({ message: 'Please fix the highlighted fields', type: 'error' });
        return;
      }

      setInfoErrors({});
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

  // ====== ACCOUNT LOGO UPLOAD ======
  const handleAccountLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const filteredPrograms = programs.filter((p) => {
    if (activeTab === 'My Programs' && p.createdBy !== user?.name) return false;
    if (createdByFilter !== 'All' && p.createdBy !== createdByFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalItems = filteredPrograms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const creators = Array.from(new Set(programs.map((p) => p.createdBy).filter(Boolean)));

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
          <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden bg-white">
            {!logoError ? (
              <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
            ) : (
              <span className="text-white text-sm font-bold bg-amber-600 w-full h-full flex items-center justify-center">{getInitials(user.name)}</span>
            )}
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 4v16M15 4v16" /></svg>
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
                <NavLink href="/programs" label="Programs" active icon={<IconBook />} />
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
                  <button onClick={() => { setAccountMenuOpen(false); setView('list'); }} className="w-full flex items-center gap-3.5 px-5 py-3 text-[14px] text-gray-800 hover:bg-gray-50 transition text-left">
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

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 p-8 overflow-y-auto bg-white">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Programs</h1>
                <p className="text-sm text-gray-500">Manage your program library and assign workouts to profiles.</p>
              </div>
              <button onClick={openCreateForm} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Create Program
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center gap-3 flex-nowrap overflow-x-auto border-b border-gray-100">
                <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 rounded-full p-1">
                  {['All Programs', 'My Programs'].map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }} className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative flex-shrink-0" ref={createdByRef}>
                  <button onClick={() => setCreatedByOpen(!createdByOpen)} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 bg-white font-medium whitespace-nowrap">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    {createdByFilter === 'All' ? 'Created By' : createdByFilter}
                    <svg className={`w-3 h-3 transition-transform ${createdByOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {createdByOpen && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                      {['All', ...creators].map((c) => (
                        <button key={c} onClick={() => { setCreatedByFilter(c); setCreatedByOpen(false); setCurrentPage(1); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${createdByFilter === c ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}>
                          {c === 'All' ? 'All' : c}
                          {createdByFilter === c && (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search programs..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-64 outline-none focus:border-[#1a73e8]" />
                  </div>
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
                      <th className="px-4 py-3 font-medium text-xs">Name <span className="text-[#1a73e8]">▲</span></th>
                      <th className="px-4 py-3 font-medium text-xs">Description</th>
                      <th className="px-4 py-3 font-medium text-xs">Weeks</th>
                      <th className="px-4 py-3 font-medium text-xs">Access</th>
                      <th className="px-4 py-3 font-medium text-xs">Created By</th>
                      <th className="px-6 py-3 font-medium text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrograms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                          No programs yet. Click <button onClick={openCreateForm} className="font-medium text-[#1a73e8] hover:underline">Create Program</button> to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredPrograms.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 w-4 h-4" /></td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">{getInitials(p.name)}</div>
                              <span className="font-medium text-gray-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600 max-w-[280px] truncate">{p.description || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{p.weeks || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{p.access || '—'}</td>
                          <td className="px-4 py-4 text-gray-600">{p.createdBy || '—'}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setActionsProgram(p)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 inline-flex">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Showing <span className="font-semibold text-gray-700">{startItem}–{endItem}</span> of <span className="font-semibold text-gray-700">{totalItems}</span></p>
                <div className="flex items-center gap-2">
                  <button onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                  </button>
                  <button onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages} className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg border transition ${currentPage >= totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}>
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE PROGRAM VIEW */}
        {view === 'create' && (
          <div className="flex-1 overflow-y-auto bg-[#f5f6f8]">
            <div className="bg-white px-8 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <button onClick={closeCreateForm} className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h1 className="text-[19px] font-bold text-gray-900 leading-tight">Create Program</h1>
                  <p className="text-[13px] text-gray-500 leading-tight mt-0.5">Fill in the details to create a new program.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-7 max-w-[1400px] mx-auto">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-7 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Program Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. 12-Week Strength Builder" value={formData.name} autoFocus
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' }); }}
                    className={`w-full h-12 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.name ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                  {validationErrors.name && <p className="text-xs text-red-500 mt-1.5">{validationErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Duration (weeks) <span className="text-red-500">*</span></label>
                    <input type="number" placeholder="e.g. 12" value={formData.duration}
                      onChange={(e) => { setFormData({ ...formData, duration: e.target.value }); const w = Math.max(1, Math.min(52, parseInt(e.target.value) || 1)); setWeeks(w); if (validationErrors.duration) setValidationErrors({ ...validationErrors, duration: '' }); }}
                      className={`w-full h-12 px-4 border rounded-lg text-sm outline-none transition ${validationErrors.duration ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                    {validationErrors.duration && <p className="text-xs text-red-500 mt-1.5">{validationErrors.duration}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Access <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={formData.access} onChange={(e) => setFormData({ ...formData, access: e.target.value })} className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                        {ACCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Visibility <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.visibility} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10">
                      {VISIBILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea rows={5} placeholder="Describe the program goals, structure, and target audience..." value={formData.description}
                    onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (validationErrors.description) setValidationErrors({ ...validationErrors, description: '' }); }}
                    className={`w-full px-4 py-3 border rounded-lg text-sm outline-none transition resize-none ${validationErrors.description ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                  {validationErrors.description && <p className="text-xs text-red-500 mt-1.5">{validationErrors.description}</p>}
                </div>

                <div className="relative" ref={metricsRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Assign Primary Metric(s) <span className="text-red-500">*</span></label>
                  <div onClick={() => setMetricsOpen(!metricsOpen)} className={`w-full min-h-12 px-3 py-2 border-2 rounded-lg bg-white cursor-pointer flex flex-wrap items-center gap-2 transition ${validationErrors.metrics ? 'border-red-400' : metricsOpen ? 'border-[#1a73e8] ring-4 ring-[#1a73e8]/10' : 'border-gray-300'}`}>
                    {formData.metrics.length === 0 ? (
                      <span className="text-gray-400 text-sm py-1">Select metrics...</span>
                    ) : (
                      formData.metrics.map((m) => (
                        <span key={m} className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1a73e8] text-[13px] font-medium pl-3 pr-2 py-1 rounded-md">
                          {m}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeMetric(m); }} className="hover:bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center text-[#1a73e8]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))
                    )}
                    <svg className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${metricsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                  </div>
                  {validationErrors.metrics && <p className="text-xs text-red-500 mt-1.5">{validationErrors.metrics}</p>}

                  {metricsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <input ref={metricSearchRef} type="text" placeholder="Search metrics..." value={metricSearch} onChange={(e) => setMetricSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/10" />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {filteredMetrics.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-400">No metrics found.</div>
                        ) : (
                          filteredMetrics.map((m) => {
                            const checked = formData.metrics.includes(m);
                            return (
                              <label key={m} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none transition ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <span className={`w-[18px] h-[18px] flex items-center justify-center rounded border-2 transition flex-shrink-0 ${checked ? 'bg-[#1a73e8] border-[#1a73e8]' : 'bg-white border-gray-300'}`}>
                                  {checked && (<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>)}
                                </span>
                                <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleMetric(m)} />
                                <span className="text-[13.5px] text-gray-800">{m}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIVITIES */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Activities <span className="text-red-500">*</span></label>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                    <div className="relative" ref={typeFilterRef}>
                      <button type="button" onClick={() => setTypeFilterOpen(!typeFilterOpen)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        {activityTypeFilter}
                        <svg className={`w-3.5 h-3.5 transition-transform ${typeFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {typeFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                          {['All', ...ACTIVITY_TYPES].map((t) => (
                            <button key={t} type="button" onClick={() => { setActivityTypeFilter(t); setTypeFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${activityTypeFilter === t ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}>{t}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <div className="relative" ref={addMenuRef}>
                        <button
                          type="button"
                          onClick={() => setAddMenuOpen(!addMenuOpen)}
                          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-full transition shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                          <svg className={`w-3.5 h-3.5 transition-transform ${addMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {addMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 w-[240px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <button type="button" onClick={handleAddActivityFromMenu} className="w-full flex items-center gap-3 px-5 py-3.5 text-[14.5px] text-gray-800 hover:bg-gray-50 transition text-left">
                              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Add Activity</span>
                            </button>
                            <div className="border-t border-gray-100"></div>
                            <button type="button" onClick={handleCreateWorkoutFromMenu} className="w-full flex items-center gap-3 px-5 py-3.5 text-[14.5px] text-gray-800 hover:bg-gray-50 transition text-left">
                              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="font-medium">Create Workout</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                        <button type="button" onClick={() => setActivityView('Grid')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${activityView === 'Grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          Grid
                        </button>
                        <button type="button" onClick={() => setActivityView('List')} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${activityView === 'List' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                          List
                        </button>
                      </div>
                    </div>
                  </div>

                  {activityView === 'Grid' ? (
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-[100px_repeat(7,minmax(110px,1fr))] border-b border-gray-100 min-w-[900px]">
                        <div className="px-3 py-3"></div>
                        {DAYS.map((d) => (<div key={d} className="px-3 py-3 text-center text-[11px] font-bold text-gray-500 tracking-wider">{d}</div>))}
                      </div>

                      {Array.from({ length: weeks }).map((_, wi) => {
                        const weekNum = wi + 1;
                        return (
                          <div key={weekNum} className="border-b border-gray-100 last:border-b-0 min-w-[900px]">
                            <div className="grid grid-cols-[100px_repeat(7,minmax(110px,1fr))]">
                              <div className="px-3 py-4 flex flex-col justify-start">
                                <p className="text-[11px] font-bold text-gray-500 tracking-wider mb-2">WEEK {weekNum}</p>
                                <button type="button" onClick={() => copyWeek(weekNum)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#1a73e8] transition">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                  Copy week
                                </button>
                              </div>

                              {Array.from({ length: 7 }).map((_, di) => {
                                const dayNum = di + 1;
                                const key = getActivityKey(weekNum, dayNum);
                                const activities = (formData.activities[key] || []).filter((a) => activityTypeFilter === 'All' ? true : a.type === activityTypeFilter);
                                return (
                                  <div key={key} className="px-2 py-3 border-l border-gray-100">
                                    <div className="flex flex-col gap-2">
                                      {activities.map((a: any) => (
                                        <div key={a.id} className="group relative bg-blue-50 border border-blue-200 rounded-md px-2.5 py-2 text-xs text-gray-800">
                                          <p className="font-medium truncate pr-4">{a.name}</p>
                                          <p className="text-[10px] text-gray-500">{a.type}</p>
                                          <button type="button" onClick={() => removeActivity(weekNum, dayNum, a.id)} className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                          </button>
                                        </div>
                                      ))}
                                      <button type="button" onClick={() => openAddActivityModal(weekNum, dayNum)} className="w-full h-16 border-2 border-dashed border-gray-200 rounded-md text-xs text-gray-400 hover:border-[#1a73e8] hover:text-[#1a73e8] transition flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6">
                      {Object.entries(formData.activities).length === 0 ? (
                        <div className="text-center py-16 text-sm text-gray-400">No activities yet. Switch to Grid view and click + Add.</div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(formData.activities).map(([key, items]: any) => {
                            const [w, d] = key.split('-');
                            if (items.length === 0) return null;
                            return (
                              <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <p className="text-xs font-bold text-gray-500 tracking-wider mb-3">WEEK {w} · DAY {d}</p>
                                <div className="space-y-2">
                                  {items.map((a: any) => (
                                    <div key={a.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{a.name}</p>
                                        <p className="text-[11px] text-gray-500">{a.type}</p>
                                      </div>
                                      <button type="button" onClick={() => removeActivity(Number(w), Number(d), a.id)} className="text-gray-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={closeCreateForm} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
                <button type="submit" disabled={saving} className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition ${saving ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a73e8] hover:bg-[#1557b0]'}`}>
                  {saving ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CREATE WORKOUT VIEW */}
        {view === 'createWorkout' && (
          <div className="flex-1 overflow-y-auto bg-[#f5f6f8]">
            <div className="bg-white px-10 pt-9 pb-7 border-b border-gray-100">
              <div className="flex items-start gap-5">
                <button
                  onClick={closeCreateWorkout}
                  className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 transition"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Create Workout</h1>
                  <p className="text-[13.5px] text-gray-500 leading-tight mt-1">Fill in the details to create a new workout.</p>
                </div>
              </div>
            </div>

            <div className="px-10 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-7">
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-2xl p-7 bg-white">
                    <div className="mb-6">
                      <label className="block text-[14px] font-semibold text-gray-800 mb-2">
                        Workout Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Upper Body Strength"
                        value={workoutData.name}
                        autoFocus
                        onChange={(e) => {
                          setWorkoutData({ ...workoutData, name: e.target.value });
                          if (workoutErrors.name) setWorkoutErrors({ ...workoutErrors, name: '' });
                        }}
                        className={`w-full h-[46px] px-4 border rounded-lg text-sm outline-none transition ${
                          workoutErrors.name
                            ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                            : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'
                        }`}
                      />
                      {workoutErrors.name && <p className="text-xs text-red-500 mt-1.5">{workoutErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-[14px] font-semibold text-gray-800 mb-2">Duration (min)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={workoutData.duration}
                          onChange={(e) => {
                            setWorkoutData({ ...workoutData, duration: e.target.value });
                            if (workoutErrors.duration) setWorkoutErrors({ ...workoutErrors, duration: '' });
                          }}
                          className={`w-full h-[46px] px-4 border rounded-lg text-sm outline-none transition ${
                            workoutErrors.duration
                              ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                              : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'
                          }`}
                        />
                        {workoutErrors.duration && <p className="text-xs text-red-500 mt-1.5">{workoutErrors.duration}</p>}
                      </div>

                      <div>
                        <label className="block text-[14px] font-semibold text-gray-800 mb-2">Access</label>
                        <div className="relative">
                          <select
                            value={workoutData.access}
                            onChange={(e) => setWorkoutData({ ...workoutData, access: e.target.value })}
                            className="w-full h-[46px] px-4 border border-gray-300 rounded-lg text-sm bg-white outline-none transition focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10 appearance-none pr-10"
                          >
                            {ACCESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <svg className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="mb-1">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[14px] font-semibold text-gray-800">Note</label>
                        <span className="text-[12.5px] text-gray-400">{workoutData.note.length}/1000</span>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={1000}
                        placeholder="Optional workout note..."
                        value={workoutData.note}
                        onChange={(e) => setWorkoutData({ ...workoutData, note: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none transition resize-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[15px] font-bold text-gray-900">Exercises</h2>
                      <span className="text-[12.5px] text-gray-400">{canvasItems.filter(i => i.kind === 'exercise').length} exercise(s)</span>
                    </div>

                    <div
                      ref={dropZoneRef}
                      onDragOver={handleCanvasDragOver}
                      onDrop={handleCanvasDropFromPalette}
                      className="border-2 border-dashed border-gray-300 rounded-2xl bg-white min-h-[220px] p-5 transition"
                    >
                      {canvasItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 pointer-events-none">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <rect x="3" y="5" width="6" height="6" rx="1" />
                              <rect x="3" y="13" width="6" height="6" rx="1" />
                              <path d="M13 6h8M13 10h5M13 14h8M13 18h5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <p className="text-[13.5px] text-gray-500">
                            No exercises added yet. Drag elements or click <span className="font-semibold">+</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {canvasItems.map((item, index) => (
                            <div
                              key={item.data.id}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDrop={(e) => handleDrop(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-grab transition ${
                                dragOverIndex === index && draggingIndex !== index
                                  ? 'border-[#1a73e8] bg-blue-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <svg className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="6" r="1.5" />
                                <circle cx="15" cy="6" r="1.5" />
                                <circle cx="9" cy="12" r="1.5" />
                                <circle cx="15" cy="12" r="1.5" />
                                <circle cx="9" cy="18" r="1.5" />
                                <circle cx="15" cy="18" r="1.5" />
                              </svg>

                              {item.kind === 'section' ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-gray-900 truncate">{item.data.name}</p>
                                    <p className="text-[11.5px] text-gray-500">Section</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-gray-900 truncate">{item.data.name}</p>
                                    <p className="text-[11.5px] text-gray-500">
                                      {item.data.sets} sets × {item.data.reps} reps
                                    </p>
                                  </div>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (item.kind === 'exercise') setSelectedExercise(item.data);
                                }}
                                className="text-[12.5px] text-[#1a73e8] font-medium opacity-0 group-hover:opacity-100 transition px-2"
                              >
                                {item.kind === 'exercise' ? 'Details' : ''}
                              </button>

                              <button
                                type="button"
                                onClick={() => removeCanvasItem(index)}
                                className="w-7 h-7 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-[12px] font-semibold text-gray-500 mb-2">Elements</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          draggable
                          onDragStart={(e) => handlePaletteDragStart(e, 'section')}
                          className="flex items-center gap-2 px-4 py-2.5 border-2 border-amber-200 bg-amber-50/60 rounded-xl cursor-grab active:cursor-grabbing select-none"
                        >
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                          </svg>
                          <span className="text-[14px] font-medium text-amber-700">Section</span>
                          <button
                            type="button"
                            onClick={() => addSectionToCanvas()}
                            className="ml-1 w-6 h-6 rounded-md bg-white text-amber-600 border border-amber-200 hover:bg-amber-100 flex items-center justify-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <div
                          draggable
                          onDragStart={(e) => handlePaletteDragStart(e, 'exercise')}
                          className="flex items-center gap-2 px-4 py-2.5 border-2 border-blue-200 bg-blue-50/60 rounded-xl cursor-grab active:cursor-grabbing select-none"
                        >
                          <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                          </svg>
                          <span className="text-[14px] font-medium text-[#1a73e8]">Exercise</span>
                          <button
                            type="button"
                            onClick={() => setExercisePickerOpen(true)}
                            className="ml-1 w-6 h-6 rounded-md bg-white text-[#1a73e8] border border-blue-200 hover:bg-blue-100 flex items-center justify-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-gray-400 mt-3">Drag onto canvas or click +</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl bg-white min-h-[500px] p-7">
                  {selectedExercise ? (
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[16px] font-bold text-gray-900">Exercise details</h3>
                        <button onClick={() => setSelectedExercise(null)} className="text-gray-400 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Name</label>
                          <input
                            type="text"
                            value={selectedExercise.name}
                            onChange={(e) => {
                              const updated = { ...selectedExercise, name: e.target.value };
                              setSelectedExercise(updated);
                              setCanvasItems((prev) => prev.map((it) => it.kind === 'exercise' && it.data.id === updated.id ? { kind: 'exercise', data: updated } : it));
                            }}
                            className="w-full h-[42px] px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Sets</label>
                            <input
                              type="number"
                              value={selectedExercise.sets ?? 3}
                              onChange={(e) => {
                                const updated = { ...selectedExercise, sets: parseInt(e.target.value) || 0 };
                                setSelectedExercise(updated);
                                setCanvasItems((prev) => prev.map((it) => it.kind === 'exercise' && it.data.id === updated.id ? { kind: 'exercise', data: updated } : it));
                              }}
                              className="w-full h-[42px] px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Reps</label>
                            <input
                              type="number"
                              value={selectedExercise.reps ?? 10}
                              onChange={(e) => {
                                const updated = { ...selectedExercise, reps: parseInt(e.target.value) || 0 };
                                setSelectedExercise(updated);
                                setCanvasItems((prev) => prev.map((it) => it.kind === 'exercise' && it.data.id === updated.id ? { kind: 'exercise', data: updated } : it));
                              }}
                              className="w-full h-[42px] px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Weight</label>
                          <input
                            type="text"
                            placeholder="e.g. 20 kg"
                            value={selectedExercise.weight ?? ''}
                            onChange={(e) => {
                              const updated = { ...selectedExercise, weight: e.target.value };
                              setSelectedExercise(updated);
                              setCanvasItems((prev) => prev.map((it) => it.kind === 'exercise' && it.data.id === updated.id ? { kind: 'exercise', data: updated } : it));
                            }}
                            className="w-full h-[42px] px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                          />
                        </div>

                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Notes</label>
                          <textarea
                            rows={3}
                            placeholder="Optional notes..."
                            value={selectedExercise.notes ?? ''}
                            onChange={(e) => {
                              const updated = { ...selectedExercise, notes: e.target.value };
                              setSelectedExercise(updated);
                              setCanvasItems((prev) => prev.map((it) => it.kind === 'exercise' && it.data.id === updated.id ? { kind: 'exercise', data: updated } : it));
                            }}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                        </svg>
                      </div>
                      <p className="text-[13.5px] text-gray-400">Select an exercise to see details</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => setCreateExerciseOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full bg-white hover:bg-gray-50 transition text-[14px] font-medium text-gray-700"
                >
                  <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                  </svg>
                  Create Exercise
                </button>
              </div>

              <div className="flex items-center gap-3 pt-7 mt-7 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeCreateWorkout}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWorkout}
                  disabled={workoutSaving}
                  className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition ${
                    workoutSaving ? 'bg-[#7a9bcc] cursor-not-allowed' : 'bg-[#1a73e8] hover:bg-[#1557b0]'
                  }`}
                >
                  {workoutSaving ? 'Creating...' : 'Create Workout'}
                </button>
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
                    <button onClick={() => { setActiveInfoTab('user'); setInfoErrors({}); }} className={`px-5 py-2 text-[14px] font-medium rounded-full transition ${activeInfoTab === 'user' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>User Info</button>
                    <button onClick={() => { setActiveInfoTab('business'); setInfoErrors({}); }} className={`px-5 py-2 text-[14px] font-medium rounded-full transition ${activeInfoTab === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Business Info</button>
                  </div>
                </div>

                {activeInfoTab === 'user' && (
                  <div className="p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">First name <span className="text-red-500">*</span></label>
                            <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); if (infoErrors.firstName) setInfoErrors({ ...infoErrors, firstName: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${infoErrors.firstName ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                            {infoErrors.firstName && <p className="text-xs text-red-500 mt-1.5">{infoErrors.firstName}</p>}
                          </div>
                          <div>
                            <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Last name <span className="text-red-500">*</span></label>
                            <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); if (infoErrors.lastName) setInfoErrors({ ...infoErrors, lastName: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${infoErrors.lastName ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                            {infoErrors.lastName && <p className="text-xs text-red-500 mt-1.5">{infoErrors.lastName}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Email <span className="text-red-500">*</span></label>
                          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (infoErrors.email) setInfoErrors({ ...infoErrors, email: '' }); }} className={`w-full h-[48px] px-4 border rounded-lg text-[14px] outline-none transition ${infoErrors.email ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                          {infoErrors.email && <p className="text-xs text-red-500 mt-1.5">{infoErrors.email}</p>}
                        </div>
                        <div className="border border-gray-200 rounded-2xl p-6">
                          <p className="text-[11px] font-bold text-gray-500 tracking-[0.12em] uppercase mb-5">Change password — leave blank to keep current</p>
                          <div className="space-y-5">
                            <div>
                              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">New password</label>
                              <div className="relative">
                                <input type={showNewPassword ? 'text' : 'password'} placeholder="Min 8 chars, upper, lower, number, special" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full h-[48px] px-4 pr-12 border rounded-lg text-[14px] placeholder-gray-400 outline-none transition ${infoErrors.newPassword ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                              </div>
                              {infoErrors.newPassword && <p className="text-xs text-red-500 mt-1.5">{infoErrors.newPassword}</p>}
                            </div>
                            <div>
                              <label className="block text-[13.5px] font-semibold text-gray-800 mb-2">Confirm new password</label>
                              <div className="relative">
                                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full h-[48px] px-4 pr-12 border rounded-lg text-[14px] placeholder-gray-400 outline-none transition ${infoErrors.confirmPassword ? 'border-red-400' : 'border-gray-300 focus:border-[#1a73e8] focus:ring-4 focus:ring-[#1a73e8]/10'}`} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                              </div>
                              {infoErrors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{infoErrors.confirmPassword}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-start pt-2">
                        <p className="text-[14px] font-semibold text-gray-800 mb-5">Profile Photo</p>

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
                      <button type="button" onClick={() => setView('list')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
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
                      <button type="button" onClick={() => setView('list')} className="px-6 h-[44px] text-[14px] font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white">Cancel</button>
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
                    <input ref={accountLogoInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml" onChange={handleAccountLogoUpload} className="hidden" />
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => accountLogoInputRef.current?.click()}
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

      {/* ==================== CREATE EXERCISE MODAL ==================== */}
      <CreateExerciseModal
        open={createExerciseOpen}
        onClose={() => setCreateExerciseOpen(false)}
        onSave={handleSaveCustomExercise}
      />

      {/* EXERCISE PICKER MODAL */}
      {exercisePickerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative p-7 max-h-[80vh] flex flex-col">
            <button onClick={() => setExercisePickerOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-[20px] font-bold text-gray-900 mb-1">Add exercise</h2>
            <p className="text-[13px] text-gray-500 mb-5">Pick an exercise or create a new one</p>

            <button
              onClick={() => { setExercisePickerOpen(false); setCreateExerciseOpen(true); }}
              className="w-full mb-3 flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-blue-200 hover:bg-blue-50 transition text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="text-[14px] font-semibold text-[#1a73e8]">Create new exercise</span>
            </button>

            <div className="space-y-1.5 overflow-y-auto flex-1">
              {customExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleExercisePickerSelect(ex.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 text-left transition"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-800 truncate">{ex.name}</p>
                    {ex.classification?.muscleGroup && (
                      <p className="text-[11.5px] text-gray-500">{ex.classification.muscleGroup}</p>
                    )}
                  </div>
                </button>
              ))}

              {[
                'Bench Press', 'Squat', 'Deadlift', 'Pull Up', 'Push Up',
                'Shoulder Press', 'Bicep Curl', 'Tricep Extension',
                'Lat Pulldown', 'Leg Press', 'Plank', 'Lunges',
              ].map((name) => (
                <button
                  key={name}
                  onClick={() => handleExercisePickerSelect(name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 text-left transition"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />
                    </svg>
                  </span>
                  <span className="text-[14px] font-medium text-gray-800">{name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setExercisePickerOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      {addActivityFor && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[520px] rounded-2xl shadow-2xl relative p-7">
            <button onClick={closeAddActivityModal} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6">
              <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Add activity</h2>
              <p className="text-[13px] text-gray-500 mt-1">Week {addActivityFor.week} · Day {addActivityFor.day}</p>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-gray-800 mb-2">Type</label>
              <div className="relative" ref={addActivityTypeRef}>
                <button type="button" onClick={() => setAddActivityTypeOpen(!addActivityTypeOpen)} className="w-full h-[52px] px-3.5 border-2 border-[#1a73e8] rounded-xl bg-white flex items-center justify-between outline-none transition ring-4 ring-[#1a73e8]/10">
                  <span className="flex items-center gap-3 text-gray-800">
                    <span className="w-9 h-9 rounded-[10px] bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
                      <TypeIcon type={addActivityType} />
                    </span>
                    <span className="text-[15px] font-medium">{addActivityType}</span>
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${addActivityTypeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {addActivityTypeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                    {ACTIVITY_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => { setAddActivityType(t); setAddActivityTypeOpen(false); }} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 ${addActivityType === t ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${addActivityType === t ? 'bg-[#1a73e8]' : 'bg-gray-200'}`}>
                          <TypeIcon type={t} />
                        </span>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                {(['All Workouts', 'My Workouts'] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => { setAddActivityTab(tab); setAddActivityWorkout(''); }} className={`flex-1 px-4 py-2.5 text-[14px] font-medium rounded-full transition ${addActivityTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="relative" ref={addActivityWorkoutRef}>
                <button type="button" onClick={() => setAddActivityWorkoutOpen(!addActivityWorkoutOpen)} className="w-full h-[52px] px-4 border border-gray-200 rounded-xl bg-white flex items-center justify-between outline-none transition hover:border-gray-300">
                  <span className={`text-[15px] ${addActivityWorkout ? 'text-gray-800' : 'text-gray-400'}`}>{addActivityWorkout || 'Select a workout...'}</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${addActivityWorkoutOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {addActivityWorkoutOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto py-2">
                    {filteredWorkouts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">No workouts found.</div>
                    ) : (
                      filteredWorkouts.map((w) => (
                        <button key={w.id} type="button" onClick={() => { setAddActivityWorkout(w.name); setAddActivityWorkoutOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${addActivityWorkout === w.name ? 'text-[#1a73e8] font-medium' : 'text-gray-700'}`}>
                          {w.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <button type="button" onClick={handleCreateWorkoutFromMenu} className="inline-flex items-center justify-center gap-2 h-11 px-5 border-2 border-dashed border-gray-300 rounded-full text-[14px] font-medium text-gray-600 hover:border-[#1a73e8] hover:text-[#1a73e8] transition mb-7">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Create new workout
            </button>

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={closeAddActivityModal} className="px-6 py-3 text-[14px] font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition">Cancel</button>
              <button type="button" onClick={confirmAddActivity} disabled={!addActivityWorkout} className={`px-6 py-3 text-[14px] font-semibold rounded-full transition ${!addActivityWorkout ? 'bg-[#e8eaed] text-gray-400 cursor-not-allowed' : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'}`}>
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRAM ACTIONS MODAL */}
      {actionsProgram && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setActionsProgram(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-semibold text-gray-900">Program actions</h3>
              <button onClick={() => setActionsProgram(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={handleEditProgram} className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium text-left transition">
                <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="font-semibold text-gray-900">Edit program</span>
              </button>
              <button onClick={handleOpenDelete} className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border border-red-100 bg-red-50/60 text-[#b83232] hover:bg-red-50 text-sm font-medium text-left transition">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                <span className="font-semibold">Delete program</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteProgram && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative p-7">
            <button onClick={() => setDeleteProgram(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3 pr-8">Delete &quot;{deleteProgram.name}&quot;?</h2>
            <p className="text-[15px] text-gray-500 mb-7">Are you sure you want to delete this program? This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteProgram(null)} className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition">Cancel</button>
              <button onClick={confirmDeleteProgram} className="px-6 py-3 text-sm font-semibold text-white bg-[#e51b48] hover:bg-[#c9173d] rounded-full transition">Delete</button>
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