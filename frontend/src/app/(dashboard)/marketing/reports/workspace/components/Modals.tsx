import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, CheckCircle, ExternalLink, Calendar, User, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, Sparkles, Copy, Smartphone, Video, Eye, 
  Heart, Share2, MessageCircle, Bookmark, BarChart3, TrendingUp, Users, UserPlus, UserMinus,
  Upload, Image
} from 'lucide-react';
import { Task, SocialPost, Brand, Member, TaskPriority, TaskType, PostFormat, PostStatus, BrandReport, DailyStoryRecap } from '../types';
import { calculateDaysLeft, formatNumber, calcComparison, getPreviousMonth } from '../utils/helpers';

// TASK MODAL (Create/Edit)
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  members: Member[];
  initialTask?: Task | null;
  defaultAssignee?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  initialTask,
  defaultAssignee
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TaskType>('Daily');
  const [project, setProject] = useState('');
  const [assignee, setAssignee] = useState(defaultAssignee || members[0]?.name || 'Gusti');
  const [brand, setBrand] = useState(initialTask?.brand || 'Dreamlab');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [link, setLink] = useState('');
  const [reference, setReference] = useState('');
  const [caption, setCaption] = useState('');
  const [brief, setBrief] = useState('');

  useEffect(() => {
    if (initialTask) {
      setName(initialTask.name);
      setType(initialTask.type);
      setProject(initialTask.project || '');
      setAssignee(initialTask.assignee);
      setBrand(initialTask.brand || 'Dreamlab');
      setStartDate(initialTask.startDate);
      setDueDate(initialTask.dueDate);
      setPriority(initialTask.priority);
      setLink(initialTask.link || '');
      setReference(initialTask.reference || '');
      setCaption(initialTask.caption || '');
      setBrief(initialTask.brief || '');
    } else {
      setName('');
      setType('Daily');
      setProject('');
      setAssignee(defaultAssignee || members[0]?.name || 'Gusti');
      setBrand('Dreamlab');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setDueDate(today);
      setPriority('Medium');
      setLink('');
      setReference('');
      setCaption('');
      setBrief('');
    }
  }, [initialTask, isOpen, members, defaultAssignee]);

  if (!isOpen) return null;

  const daysInfo = calculateDaysLeft(dueDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      type,
      project: type === 'Project' ? (project || 'Project General') : undefined,
      assignee,
      brand,
      startDate,
      dueDate,
      priority,
      status: initialTask ? initialTask.status : 'In Progress',
      link: link.trim() || undefined,
      reference: reference.trim() || undefined,
      caption: caption.trim() || undefined,
      brief: brief.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">TASK MANAGEMENT</div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {initialTask ? 'Edit Task' : 'Tambahkan Task Baru'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Task *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Analisis Leads Formulasi Skincare"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipe Task</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Daily">Daily Task (Rutin)</option>
                <option value="Project">Project Task (Milestone)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assignee PIC</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand</label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Dreamlab">Dreamlab (B2B)</option>
                <option value="Toribio">Toribio (B2C)</option>
              </select>
            </div>
          </div>

          {type === 'Project' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Project</label>
              <input
                type="text"
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="Contoh: CRM Pipeline / Web Development"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Days Left (Auto)</label>
              <div className={`px-2.5 py-2 rounded-lg border border-slate-100 font-bold text-xs bg-slate-50 ${
                daysInfo.isLate ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {daysInfo.text}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as TaskPriority[]).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs transition ${
                    priority === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Link Terkait / URL</label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Brief & Instruksi Pengerjaan</label>
            <textarea
              rows={3}
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Tuliskan objektif spesifik, deliverable yang diharapkan, dan catatan teknis..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            >
              Simpan Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// SOCIAL POST MODAL (Create/Edit)
interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: Omit<SocialPost, 'id'>) => void;
  brands: Brand[];
  members: Member[];
  initialBrand?: string;
  initialDate?: string;
}

export const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brands,
  members,
  initialBrand,
  initialDate
}) => {
  const [title, setTitle] = useState('');
  const [brandId, setBrandId] = useState(initialBrand || brands[0]?.name || 'Dreamlab');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState<PostFormat>('Carousel');
  const [status, setStatus] = useState<PostStatus>('Planning');
  const [pic, setPic] = useState(members[0]?.name || 'Revita');
  const [progress, setProgress] = useState(25);
  const [hook, setHook] = useState('');
  const [caption, setCaption] = useState('');
  const [brief, setBrief] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (initialBrand) setBrandId(initialBrand);
    if (initialDate) setDate(initialDate);
  }, [initialBrand, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      brandId,
      date,
      format,
      status,
      pic,
      progress: status === 'Published' ? 100 : progress,
      hook: hook.trim() || undefined,
      caption: caption.trim() || undefined,
      brief: brief.trim() || undefined,
      reference: reference.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">CONTENT PLANNER</div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Tambah Konten & Creative Brief</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand *</label>
              <select
                value={brandId}
                onChange={e => setBrandId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Publish Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul Konten *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Formula Knowledge: Stabilitas Emulsi"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Format Konten</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as PostFormat)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Carousel">Carousel (Slide)</option>
                <option value="Reels">Reels / Video Pendek</option>
                <option value="Single">Single Image Infographic</option>
                <option value="Story">Instagram Story</option>
                <option value="TikTok">TikTok Video</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Post</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PostStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Planning">Planning</option>
                <option value="Brief">Brief</option>
                <option value="Draft">Draft</option>
                <option value="Production">Production</option>
                <option value="Review">Review</option>
                <option value="Published">Published</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PIC Assignee</label>
              <select
                value={pic}
                onChange={e => setPic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Progress Pengerjaan</label>
              <span className="font-bold text-blue-600">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hook / Headline Utama</label>
            <input
              type="text"
              value={hook}
              onChange={e => setHook(e.target.value)}
              placeholder="Contoh: Stop eksfoliasi tiap hari sebelum kulitmu menjerit!"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none italic"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Creative Brief & Visual Direction</label>
            <textarea
              rows={3}
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Objective, key message, storyboard alur per slide/detik, visual tone & style, CTA..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Draft Caption</label>
            <textarea
              rows={3}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Tuliskan copy caption lengkap dengan hashtag dan call-to-action..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Referensi / Link Folder</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Google Drive link, Pinterest moodboard, atau referensi kompetitor..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            >
              Simpan Konten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// BRAND MODAL
interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandData: Omit<Brand, 'id' | 'initial'>) => void;
  members: Member[];
}

export const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members
}) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [color, setColor] = useState('#1264d3');
  const [primaryPlatform, setPrimaryPlatform] = useState('Instagram & TikTok');
  const [pic, setPic] = useState(members[0]?.name || 'Revita');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      color,
      primaryPlatform,
      pic,
      note
    });

    setName('');
    setHandle('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">BRAND WORKSPACE</div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Tambah Brand Baru</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Brand *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: GlowLab Indonesia"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Social Handle</label>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="@glowlab.official"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Platform Utama</label>
              <input
                type="text"
                value={primaryPlatform}
                onChange={e => setPrimaryPlatform(e.target.value)}
                placeholder="Instagram, TikTok, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PIC Brand</label>
              <select
                value={pic}
                onChange={e => setPic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Warna Aksen Brand</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-600">{color}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Brand Brief / Tone & Target</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Deskripsi positioning brand, target pasar, brand tone of voice..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            >
              Tambah Brand
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// COMPARISON BADGE HELPER COMPONENT
const ComparisonBadge: React.FC<{ 
  current: number; 
  previous?: number; 
  unit?: string; 
  reverseColor?: boolean 
}> = ({
  current,
  previous,
  unit = '',
  reverseColor = false
}) => {
  if (previous === undefined || previous === null) {
    return <span className="text-[10px] text-slate-400 font-medium">Bulan lalu: Belum ada data</span>;
  }
  const cmp = calcComparison(current, previous);
  const isGood = reverseColor ? cmp.isNegative : cmp.isPositive;
  const isBad = reverseColor ? cmp.isPositive : cmp.isNegative;

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-1">
      <span className="text-slate-500 font-medium">
        Bulan Lalu: <strong className="text-slate-700 font-semibold">{formatNumber(previous)}{unit ? ` ${unit}` : ''}</strong>
      </span>
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-[10px] ${
          isGood
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isBad
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        {cmp.isPositive && <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />}
        {cmp.isNegative && <ArrowDownRight className="w-2.5 h-2.5 shrink-0" />}
        {cmp.isNeutral && <Minus className="w-2.5 h-2.5 shrink-0" />}
        <span>{cmp.formattedDiff}</span>
      </span>
    </div>
  );
};

// REPORT METRIC UPDATE MODAL
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  currentReport?: BrandReport;
  previousReport?: BrandReport;
  currentPeriod?: string;
  previousPeriod?: string;
  onSave: (updatedReport: BrandReport) => void;
}

export const ReportMetricModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  brandName,
  currentReport,
  previousReport,
  currentPeriod = 'September 2026',
  previousPeriod,
  onSave
}) => {
  const prevMonthLabel = previousPeriod || getPreviousMonth(currentPeriod) || 'Bulan Sebelumnya';

  // Dynamic States initialized safely
  const [followers, setFollowers] = useState<number>(() => Number(currentReport?.totalFollowers) || 28000);
  const [followersGained, setFollowersGained] = useState<number>(() => Number(currentReport?.followersGained) || 2000);
  const [followersUnfollowed, setFollowersUnfollowed] = useState<number>(() => Number(currentReport?.followersUnfollowed) || 400);
  const [followersGrowthPercent, setFollowersGrowthPercent] = useState<number>(() => Number(currentReport?.followersGrowthPercent) || 5.0);

  const [totalViews, setTotalViews] = useState<number>(() => Number(currentReport?.totalViews) || 300000);
  const [averageViewsPerPost, setAverageViewsPerPost] = useState<number>(() => Number(currentReport?.averageViewsPerPost) || 35000);
  const [reach, setReach] = useState<number>(() => Number(currentReport?.totalReach) || 180000);
  const [impressions, setImpressions] = useState<number>(() => Number(currentReport?.totalImpressions) || 450000);

  // Stories Metrics (Kuantitas Stories & Views)
  const [totalStoriesCreated, setTotalStoriesCreated] = useState<number>(() => 
    Number(currentReport?.storiesRecap?.totalStoriesCreated) || 24
  );
  const [totalStoryViews, setTotalStoryViews] = useState<number>(() => 
    Number(currentReport?.storiesRecap?.totalStoryViews) || 65000
  );

  const [likes, setLikes] = useState<number>(() => Number(currentReport?.totalLikes) || 4500);
  const [comments, setComments] = useState<number>(() => Number(currentReport?.totalComments) || 400);
  const [shares, setShares] = useState<number>(() => Number(currentReport?.totalShares) || 1200);
  const [saves, setSaves] = useState<number>(() => Number(currentReport?.totalSaves) || 2500);
  const [er, setEr] = useState<number>(() => Number(currentReport?.engagementRate) || 5.2);
  const [summary, setSummary] = useState<string>(() => currentReport?.executiveSummary || '');

  useEffect(() => {
    if (currentReport) {
      setFollowers(Number(currentReport.totalFollowers) || 0);
      setFollowersGained(Number(currentReport.followersGained) || 0);
      setFollowersUnfollowed(Number(currentReport.followersUnfollowed) || 0);
      setFollowersGrowthPercent(Number(currentReport.followersGrowthPercent) || 0);

      setTotalViews(Number(currentReport.totalViews) || 0);
      setAverageViewsPerPost(Number(currentReport.averageViewsPerPost) || 0);
      setReach(Number(currentReport.totalReach) || 0);
      setImpressions(Number(currentReport.totalImpressions) || 0);

      const storiesCreated = currentReport.storiesRecap?.totalStoriesCreated !== undefined
        ? Number(currentReport.storiesRecap.totalStoriesCreated)
        : (currentReport.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0) || 0);
      const storyViews = currentReport.storiesRecap?.totalStoryViews !== undefined
        ? Number(currentReport.storiesRecap.totalStoryViews)
        : (currentReport.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0) || 0);

      setTotalStoriesCreated(storiesCreated);
      setTotalStoryViews(storyViews);

      setLikes(Number(currentReport.totalLikes) || 0);
      setComments(Number(currentReport.totalComments) || 0);
      setShares(Number(currentReport.totalShares) || 0);
      setSaves(Number(currentReport.totalSaves) || 0);
      setEr(Number(currentReport.engagementRate) || 0);
      setSummary(currentReport.executiveSummary || '');
    }
  }, [currentReport, isOpen]);

  if (!isOpen) return null;

  const netGrowth = Number(followersGained) - Number(followersUnfollowed);
  const calculatedTotalEngagements = Number(likes) + Number(comments) + Number(shares) + Number(saves);
  const avgViewsPerStory = totalStoriesCreated > 0 ? Math.round(Number(totalStoryViews) / Number(totalStoriesCreated)) : 0;
  const prevStoriesCount = previousReport?.storiesRecap?.totalStoriesCreated;
  const prevStoryViews = previousReport?.storiesRecap?.totalStoryViews;
  const prevAvgStoryViews = (prevStoriesCount && prevStoriesCount > 0 && prevStoryViews) 
    ? Math.round(prevStoryViews / prevStoriesCount) 
    : undefined;

  const handleCopyFromPrevious = () => {
    if (!previousReport) return;
    setFollowers(Number(previousReport.totalFollowers) || 0);
    setFollowersGained(Number(previousReport.followersGained) || 0);
    setFollowersUnfollowed(Number(previousReport.followersUnfollowed) || 0);
    setFollowersGrowthPercent(Number(previousReport.followersGrowthPercent) || 0);
    setTotalViews(Number(previousReport.totalViews) || 0);
    setAverageViewsPerPost(Number(previousReport.averageViewsPerPost) || 0);
    setReach(Number(previousReport.totalReach) || 0);
    setImpressions(Number(previousReport.totalImpressions) || 0);
    setTotalStoriesCreated(Number(previousReport.storiesRecap?.totalStoriesCreated) || 0);
    setTotalStoryViews(Number(previousReport.storiesRecap?.totalStoryViews) || 0);
    setLikes(Number(previousReport.totalLikes) || 0);
    setComments(Number(previousReport.totalComments) || 0);
    setShares(Number(previousReport.totalShares) || 0);
    setSaves(Number(previousReport.totalSaves) || 0);
    setEr(Number(previousReport.engagementRate) || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const repMonth = currentPeriod || currentReport?.monthYear || 'September 2026';

    const updated: BrandReport = {
      ...(currentReport || {
        id: `rep-${brandName.toLowerCase()}-${repMonth.replace(/\s+/g, '-').toLowerCase()}`,
        brandId: brandName,
        monthYear: repMonth,
        totalPostsPublished: 0,
        platformBreakdown: [],
        weeklyTrends: [],
        formatPerformance: [],
        strategicRecommendations: []
      }),
      brandId: brandName,
      monthYear: repMonth,
      totalFollowers: Number(followers) || 0,
      followersGained: Number(followersGained) || 0,
      followersUnfollowed: Number(followersUnfollowed) || 0,
      followersNetGrowth: netGrowth,
      followersGrowthPercent: Number(followersGrowthPercent) || 0,
      totalViews: Number(totalViews) || 0,
      averageViewsPerPost: Number(averageViewsPerPost) || 0,
      totalReach: Number(reach) || 0,
      reachGrowthPercent: previousReport?.totalReach 
        ? Number((((Number(reach) - previousReport.totalReach) / previousReport.totalReach) * 100).toFixed(1))
        : (currentReport?.reachGrowthPercent || 0),
      totalImpressions: Number(impressions) || 0,
      impressionsGrowthPercent: previousReport?.totalImpressions 
        ? Number((((Number(impressions) - previousReport.totalImpressions) / previousReport.totalImpressions) * 100).toFixed(1))
        : (currentReport?.impressionsGrowthPercent || 0),
      totalLikes: Number(likes) || 0,
      totalComments: Number(comments) || 0,
      totalShares: Number(shares) || 0,
      totalSaves: Number(saves) || 0,
      totalEngagements: calculatedTotalEngagements,
      engagementRate: Number(er) || 0,
      engagementRateChange: previousReport?.engagementRate 
        ? Number((Number(er) - previousReport.engagementRate).toFixed(2))
        : (currentReport?.engagementRateChange || 0),
      storiesRecap: {
        ...(currentReport?.storiesRecap || { dailyStories: [], completionRate: 80 }),
        totalStoriesCreated: Number(totalStoriesCreated) || 0,
        totalStoryViews: Number(totalStoryViews) || 0,
        avgViewsPerStory,
        avgStoriesPerDay: currentReport?.storiesRecap?.avgStoriesPerDay || (totalStoriesCreated > 0 ? Number((totalStoriesCreated / 30).toFixed(1)) : 0),
        dailyStories: currentReport?.storiesRecap?.dailyStories || []
      },
      executiveSummary: summary
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                INPUT / EDIT MANUAL BULANAN
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Pembanding: {prevMonthLabel}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Update Metrik Bulanan · {brandName}
            </h2>
            <p className="text-xs text-slate-500">
              Periode Aktif: <strong className="text-slate-800 font-semibold">{currentPeriod}</strong>. Setiap input dapat langsung dibandingkan dengan data bulan sebelumnya.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK COPY BANNER */}
        {previousReport && (
          <div className="bg-amber-50/70 border-b border-amber-200/80 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Tersedia data pembanding <strong className="font-bold">{prevMonthLabel}</strong>. Ingin isi cepat dari bulan lalu?
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyFromPrevious}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] transition shadow-2xs shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Angka dari {prevMonthLabel}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* SECTION 1: DINAMIKA FOLLOWERS BULANAN */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                <Users className="w-4 h-4 text-blue-600" />
                <span>1. Dinamika Followers Bulanan</span>
              </div>
              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Net Growth: {netGrowth >= 0 ? `+${formatNumber(netGrowth)}` : formatNumber(netGrowth)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Total Followers */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Total Followers</label>
                <input
                  type="number"
                  required
                  value={followers}
                  onChange={e => setFollowers(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-bold text-slate-900 text-sm"
                />
                <ComparisonBadge current={followers} previous={previousReport?.totalFollowers} />
              </div>

              {/* + Followers Baru */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                <label className="block font-bold text-emerald-800 mb-1">+ Followers Baru (Gained)</label>
                <input
                  type="number"
                  required
                  value={followersGained}
                  onChange={e => setFollowersGained(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-md focus:outline-none font-bold text-emerald-700 text-sm"
                />
                <ComparisonBadge current={followersGained} previous={previousReport?.followersGained} />
              </div>

              {/* - Unfollow */}
              <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                <label className="block font-bold text-rose-800 mb-1">- Unfollow (Lost / Churn)</label>
                <input
                  type="number"
                  required
                  value={followersUnfollowed}
                  onChange={e => setFollowersUnfollowed(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-rose-300 rounded-md focus:outline-none font-bold text-rose-700 text-sm"
                />
                <ComparisonBadge current={followersUnfollowed} previous={previousReport?.followersUnfollowed} reverseColor />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
              <span className="font-semibold">Pertumbuhan Bersih (%) Terhitung:</span>
              <span className="font-bold text-emerald-700">
                {followers > 0 ? `+${((netGrowth / followers) * 100).toFixed(2)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* SECTION 2: KUANTITAS VIEWS KONTEN & JANGKAUAN */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                <Video className="w-4 h-4 text-blue-600" />
                <span>2. Kuantitas Views Konten & Jangkauan</span>
              </div>
              <span className="text-[10px] text-blue-700 font-medium">Video, Reels & Feed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Total Kuantitas Views */}
              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <label className="block font-bold text-blue-950 mb-1">Total Kuantitas Views Konten</label>
                <input
                  type="number"
                  required
                  value={totalViews}
                  onChange={e => setTotalViews(Number(e.target.value))}
                  placeholder="e.g. 620000"
                  className="w-full px-2.5 py-1.5 border border-blue-300 rounded-md focus:outline-none font-black text-blue-950 text-sm"
                />
                <ComparisonBadge current={totalViews} previous={previousReport?.totalViews} unit="views" />
              </div>

              {/* Rata-rata Views per Konten */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Average Views / Post</label>
                <input
                  type="number"
                  value={averageViewsPerPost}
                  onChange={e => setAverageViewsPerPost(Number(e.target.value))}
                  placeholder="e.g. 68800"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-bold text-slate-800 text-sm"
                />
                <ComparisonBadge current={averageViewsPerPost} previous={previousReport?.averageViewsPerPost} unit="views" />
              </div>

              {/* Total Reach */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Total Reach Akun (Unique)</label>
                <input
                  type="number"
                  value={reach}
                  onChange={e => setReach(Number(e.target.value))}
                  placeholder="e.g. 342000"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-bold text-slate-800 text-sm"
                />
                <ComparisonBadge current={reach} previous={previousReport?.totalReach} />
              </div>

              {/* Total Impressions */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">Total Impressions</label>
                <input
                  type="number"
                  value={impressions}
                  onChange={e => setImpressions(Number(e.target.value))}
                  placeholder="e.g. 885000"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none font-bold text-slate-800 text-sm"
                />
                <ComparisonBadge current={impressions} previous={previousReport?.totalImpressions} />
              </div>
            </div>
          </div>

          {/* SECTION 3: REKAP STORIES (TOTAL STORIES & TOTAL VIEWS STORIES) */}
          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>3. Rekap Kuantitas Stories & Views (Stories Recap)</span>
              </div>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Stories Tracker
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Total Stories Dibuat */}
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <label className="block font-bold text-purple-900 mb-1">
                  Total Stories Dibuat Bulan Ini
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={totalStoriesCreated}
                  onChange={e => setTotalStoriesCreated(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 32"
                  className="w-full px-2.5 py-1.5 border border-purple-300 rounded-md focus:outline-none font-black text-purple-950 text-sm"
                />
                <ComparisonBadge 
                  current={totalStoriesCreated} 
                  previous={prevStoriesCount} 
                  unit="stories" 
                />
              </div>

              {/* Total Kuantitas Views Stories */}
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <label className="block font-bold text-blue-900 mb-1">
                  Total Kuantitas Views Stories Bulan Ini
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={totalStoryViews}
                  onChange={e => setTotalStoryViews(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 105000"
                  className="w-full px-2.5 py-1.5 border border-blue-300 rounded-md focus:outline-none font-black text-blue-950 text-sm"
                />
                <ComparisonBadge 
                  current={totalStoryViews} 
                  previous={prevStoryViews} 
                  unit="views" 
                />
              </div>
            </div>

            {/* Stories Computed Summary Card */}
            <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Rata-rata Tayangan per Story:</span>
                <span className="font-extrabold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  ~{formatNumber(avgViewsPerStory)} views / 1 story
                </span>
              </div>
              <ComparisonBadge 
                current={avgViewsPerStory} 
                previous={prevAvgStoryViews} 
                unit="views/story" 
              />
            </div>
          </div>

          {/* SECTION 4: ENGAGEMENT METRICS */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>4. Metrik Engagement (Like, Share, Comment, Save & ER%)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                Total Interaksi: {formatNumber(calculatedTotalEngagements)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Likes */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Total Likes</label>
                <input
                  type="number"
                  value={likes}
                  onChange={e => setLikes(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none font-bold text-slate-800"
                />
                <ComparisonBadge current={likes} previous={previousReport?.totalLikes} />
              </div>

              {/* Shares */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-emerald-800 mb-1">Total Shares (Viralitas)</label>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-emerald-200 rounded focus:outline-none font-bold text-emerald-700"
                />
                <ComparisonBadge current={shares} previous={previousReport?.totalShares} />
              </div>

              {/* Comments */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-blue-800 mb-1">Comments (Diskusi)</label>
                <input
                  type="number"
                  value={comments}
                  onChange={e => setComments(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-blue-200 rounded focus:outline-none font-bold text-blue-700"
                />
                <ComparisonBadge current={comments} previous={previousReport?.totalComments} />
              </div>

              {/* Saves */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-purple-800 mb-1">Saves (Nilai Konten)</label>
                <input
                  type="number"
                  value={saves}
                  onChange={e => setSaves(Number(e.target.value))}
                  className="w-full px-2 py-1 border border-purple-200 rounded focus:outline-none font-bold text-purple-700"
                />
                <ComparisonBadge current={saves} previous={previousReport?.totalSaves} />
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <label className="block font-bold text-slate-800">Engagement Rate (ER %)</label>
                <span className="text-[10px] text-slate-500">Rasio interaksi terhadap total audiens / jangkauan</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={er}
                  onChange={e => setEr(Number(e.target.value))}
                  className="w-28 px-2.5 py-1 border border-blue-300 rounded focus:outline-none font-black text-blue-700 text-sm"
                />
                <ComparisonBadge current={er} previous={previousReport?.engagementRate} unit="%" />
              </div>
            </div>
          </div>

          {/* SECTION 5: EXECUTIVE SUMMARY */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">Executive Summary & Evaluasi Bulanan</label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Tuliskan catatan analisis penting, evaluasi performa, atau insight strategis untuk brand ini..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-normal text-slate-700 leading-relaxed"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-xs flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Simpan Perubahan Laporan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// INDIVIDUAL POST METRICS EDIT MODAL
interface PostMetricsModalProps {
  isOpen: boolean;
  post: SocialPost | null;
  onClose: () => void;
  onSave: (postId: string, metrics: NonNullable<SocialPost['metrics']>, imageUrl?: string) => void;
}

export const PostMetricsModal: React.FC<PostMetricsModalProps> = ({
  isOpen,
  post,
  onClose,
  onSave
}) => {
  const [views, setViews] = useState(0);
  const [reach, setReach] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [saves, setSaves] = useState(0);
  const [avgWatchPercentage, setAvgWatchPercentage] = useState(70);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('file');

  useEffect(() => {
    if (post && post.metrics) {
      setViews(post.metrics.views || 0);
      setReach(post.metrics.reach || 0);
      setLikes(post.metrics.likes || 0);
      setComments(post.metrics.comments || 0);
      setShares(post.metrics.shares || 0);
      setSaves(post.metrics.saves || 0);
      setAvgWatchPercentage(post.metrics.avgWatchPercentage || 70);
      setImageUrl(post.imageUrl || '');
    } else if (post) {
      // Defaults based on format
      setViews(post.format === 'Reels' ? 35000 : 18000);
      setReach(post.format === 'Reels' ? 22000 : 12000);
      setLikes(450);
      setComments(35);
      setShares(120);
      setSaves(280);
      setAvgWatchPercentage(post.format === 'Reels' ? 75 : 60);
      setImageUrl(post.imageUrl || '');
    }
  }, [post, isOpen]);

  if (!isOpen || !post) return null;

  const totalEngagements = Number(likes) + Number(comments) + Number(shares) + Number(saves);
  const calculatedEr = views > 0 ? Number(((totalEngagements / views) * 100).toFixed(2)) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      post.id,
      {
        views: Number(views),
        reach: Number(reach),
        likes: Number(likes),
        comments: Number(comments),
        shares: Number(shares),
        saves: Number(saves),
        avgWatchPercentage: Number(avgWatchPercentage),
        engagementRate: calculatedEr
      },
      imageUrl || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">LOG METRIK &amp; VISUAL KONTEN</div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">{post.title}</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Format: <span className="font-semibold text-slate-700">{post.format}</span> · Tanggal: {post.date} · PIC: {post.pic}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Visual Konten / Image Upload (Up Konten) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-blue-600" />
                Gambar / Visual Konten (Up Hasil)
              </span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('file')}
                  className={`px-2 py-0.5 rounded font-semibold ${imageUploadMode === 'file' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2 py-0.5 rounded font-semibold ${imageUploadMode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Link URL
                </button>
              </div>
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-semibold truncate">Gambar Konten Terpasang</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hasil karya ini akan tampil di kolom report.</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <label className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Ganti Foto
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {imageUploadMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-white transition group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-1" />
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700">Pilih / Drag File Gambar Konten</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP (Screenshot postingan, flyer, visual karya)</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... atau link gambar"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Views & Reach */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kuantitas View / Plays *</label>
              <input
                type="number"
                required
                value={views}
                onChange={e => setViews(Number(e.target.value))}
                placeholder="Total views"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Accounts Reached (Reach)</label>
              <input
                type="number"
                value={reach}
                onChange={e => setReach(Number(e.target.value))}
                placeholder="Unique accounts"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
              />
            </div>
          </div>

          {/* Interactions Breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
              <span>INTERAKSI KONTEN</span>
              <span className="text-slate-500">Total: {totalEngagements.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Likes</label>
                <input
                  type="number"
                  value={likes}
                  onChange={e => setLikes(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Comments</label>
                <input
                  type="number"
                  value={comments}
                  onChange={e => setComments(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Saves</label>
                <input
                  type="number"
                  value={saves}
                  onChange={e => setSaves(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-indigo-700"
                />
              </div>
            </div>
          </div>

          {/* Watch Time & Calculated ER */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Watch Retention (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={avgWatchPercentage}
                onChange={e => setAvgWatchPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
              />
              <span className="text-[10px] text-slate-400">Khusus Reels/Video</span>
            </div>
            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl">
              <div className="text-[10px] font-bold text-blue-800 uppercase">CALCULATED ENGAGEMENT RATE</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">{calculatedEr}%</div>
              <div className="text-[10px] text-blue-600 font-medium">({totalEngagements.toLocaleString()} interaksi / {views.toLocaleString()} views)</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              Simpan Metrik &amp; Visual Konten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// DETAIL MODAL (Task or Post)
interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: any) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onDelete,
  onUpdateStatus
}) => {
  if (!task) return null;
  const daysInfo = calculateDaysLeft(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              {task.type} {task.project ? `· ${task.project}` : ''}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{task.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
            <div>
              <span className="text-slate-400 text-[10px] block">Assignee</span>
              <span className="font-bold text-slate-800">{task.assignee}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Deadline / Sisa Waktu</span>
              <span className={`font-bold ${daysInfo.isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                {task.dueDate} ({daysInfo.text})
              </span>
            </div>
          </div>

          {task.brief && (
            <div>
              <h4 className="font-bold text-slate-700 mb-1">Brief Pengerjaan:</h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed">{task.brief}</p>
            </div>
          )}

          {task.link && (
            <div>
              <h4 className="font-bold text-slate-700 mb-1">Link Terkait:</h4>
              <a 
                href={task.link} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{task.link}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Status:</span>
              <select
                value={task.status}
                onChange={e => onUpdateStatus(task.id, e.target.value)}
                className="font-bold text-xs px-2.5 py-1 rounded border border-slate-200"
              >
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <button
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// POST DETAIL DRAWER / MODAL
interface PostDetailModalProps {
  post: SocialPost | null;
  onClose: () => void;
  onDelete: (postId: string) => void;
  onUpdateStatus: (postId: string, status: any) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onDelete,
  onUpdateStatus
}) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {post.brandId} · {post.format}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {post.date}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{post.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          {post.hook && (
            <div className="bg-amber-50/70 border border-amber-200/70 p-3 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-amber-800 block mb-0.5">Hook Headline:</span>
              <p className="font-semibold text-slate-900 italic">"{post.hook}"</p>
            </div>
          )}

          {post.brief && (
            <div>
              <span className="font-bold text-slate-700 block mb-1">Creative Brief & Visual Flow:</span>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-700 leading-relaxed">
                {post.brief}
              </div>
            </div>
          )}

          {post.caption && (
            <div>
              <span className="font-bold text-slate-700 block mb-1">Caption:</span>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-700 leading-relaxed whitespace-pre-line">
                {post.caption}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Assignee PIC</span>
              <span className="font-bold text-slate-800">{post.pic}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Progress</span>
              <span className="font-bold text-blue-600">{post.progress}%</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Status:</span>
              <select
                value={post.status}
                onChange={e => onUpdateStatus(post.id, e.target.value)}
                className="font-bold text-xs px-2.5 py-1 rounded border border-slate-200"
              >
                <option value="Planning">Planning</option>
                <option value="Brief">Brief</option>
                <option value="Draft">Draft</option>
                <option value="Production">Production</option>
                <option value="Review">Review</option>
                <option value="Published">Published</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <button
              onClick={() => {
                onDelete(post.id);
                onClose();
              }}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// MEMBER PROFILE EDIT MODAL
interface MemberEditModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (updatedMember: Member) => void;
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setEmail(member.email);
      setPhone(member.phone);
      setDepartment(member.department);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...member,
      name,
      role,
      email,
      phone,
      department
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">MEMBER PROFILE</div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Edit Profil Anggota Tim</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Member</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Jabatan / Role</label>
            <input
              type="text"
              required
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Departemen / Divisi</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// DAILY STORY RECAP MODAL (Add / Edit Daily Stories & View Updates)
interface DailyStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  monthYear: string;
  story?: DailyStoryRecap | null;
  currentReport?: BrandReport;
  previousReport?: BrandReport;
  onSave: (story: DailyStoryRecap) => void;
  onDelete?: (storyId: string) => void;
}

export const DailyStoryModal: React.FC<DailyStoryModalProps> = ({
  isOpen,
  onClose,
  brandName,
  monthYear,
  story,
  currentReport,
  previousReport,
  onSave,
  onDelete
}) => {
  const [date, setDate] = useState('2026-09-09');
  const [storiesCount, setStoriesCount] = useState(2);
  const [totalViews, setTotalViews] = useState(5000);
  const [replies, setReplies] = useState(20);
  const [linkClicks, setLinkClicks] = useState(35);
  const [shares, setShares] = useState(10);
  const [topicOrTheme, setTopicOrTheme] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (story) {
      setDate(story.date);
      setStoriesCount(story.storiesCount);
      setTotalViews(story.totalViews);
      setReplies(story.replies || 0);
      setLinkClicks(story.linkClicks || 0);
      setShares(story.shares || 0);
      setTopicOrTheme(story.topicOrTheme || '');
      setNote(story.note || '');
    } else {
      // sensible default for new entry
      setDate(new Date().toISOString().split('T')[0]);
      setStoriesCount(3);
      setTotalViews(7500);
      setReplies(25);
      setLinkClicks(40);
      setShares(12);
      setTopicOrTheme('');
      setNote('');
    }
  }, [story, isOpen]);

  if (!isOpen) return null;

  const previousMonthLabel = getPreviousMonth(monthYear) || 'Bulan Sebelumnya';

  const avgViews = storiesCount > 0 ? Math.round(Number(totalViews) / Number(storiesCount)) : 0;

  // Monthly totals calculation for current and previous month
  const currTotalStories = currentReport?.storiesRecap?.totalStoriesCreated 
    || currentReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0) || 0;
  const currTotalViews = currentReport?.storiesRecap?.totalStoryViews 
    || currentReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0) || 0;

  const prevTotalStories = previousReport?.storiesRecap?.totalStoriesCreated 
    || previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.storiesCount || 0), 0) || 0;
  const prevTotalViews = previousReport?.storiesRecap?.totalStoryViews 
    || previousReport?.storiesRecap?.dailyStories?.reduce((a, c) => a + (c.totalViews || 0), 0) || 0;

  const storiesCmp = calcComparison(currTotalStories, prevTotalStories);
  const viewsCmp = calcComparison(currTotalViews, prevTotalViews);

  // Day Name extraction in Indonesian
  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return dayNames[d.getDay()] || 'Hari';
    } catch {
      return 'Hari';
    }
  };

  const getDayNum = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      return parts.length >= 3 ? parseInt(parts[2], 10) : 1;
    } catch {
      return 1;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dayName = getDayName(date);
    const dayNumber = getDayNum(date);

    const savedStory: DailyStoryRecap = {
      id: story?.id || `ds-${Date.now()}`,
      date,
      dayNumber,
      dayName,
      storiesCount: Number(storiesCount),
      totalViews: Number(totalViews),
      avgViewsPerStory: avgViews,
      replies: Number(replies),
      linkClicks: Number(linkClicks),
      shares: Number(shares),
      topicOrTheme: topicOrTheme.trim() || undefined,
      note: note.trim() || undefined
    };

    onSave(savedStory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">STORIES RECAP LOG</div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {story ? 'Edit Data Story Harian' : 'Log Update Story Harian'}
            </h2>
            <p className="text-xs text-slate-500">{brandName} · Periode {monthYear}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMPARISON CARD: CURRENT MONTH VS PREVIOUS MONTH */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50/60 p-4 border-b border-purple-100 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-600" />
              <span>Total Stories & Views ({monthYear} vs {previousMonthLabel})</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-purple-100">
              Komparasi Bulanan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Total Stories Recap */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-purple-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-medium">Total Stories Bulan Ini:</div>
              <div className="text-base font-black text-purple-950 mt-0.5">
                {formatNumber(currTotalStories)} <span className="text-xs font-bold text-purple-700">Stories</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 flex-wrap">
                <span>{previousMonthLabel}: <strong className="text-slate-700">{formatNumber(prevTotalStories)}</strong></span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  storiesCmp.isPositive ? 'bg-emerald-50 text-emerald-700' : storiesCmp.isNegative ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {storiesCmp.formattedDiff}
                </span>
              </div>
            </div>

            {/* Total Story Views Recap */}
            <div className="bg-white/90 p-2.5 rounded-xl border border-blue-200/80 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-medium">Total Views Stories Bulan Ini:</div>
              <div className="text-base font-black text-blue-950 mt-0.5">
                {formatNumber(currTotalViews)} <span className="text-xs font-bold text-blue-700">Views</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 flex-wrap">
                <span>{previousMonthLabel}: <strong className="text-slate-700">{formatNumber(prevTotalViews)}</strong></span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  viewsCmp.isPositive ? 'bg-emerald-50 text-emerald-700' : viewsCmp.isNegative ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {viewsCmp.formattedDiff}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Story</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-purple-700 mb-1">Berapa Story Dibuat Hari Ini?</label>
              <input
                type="number"
                min={0}
                required
                value={storiesCount}
                onChange={e => setStoriesCount(Math.max(0, Number(e.target.value)))}
                placeholder="misal: 3"
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 text-purple-900 rounded-lg focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Views & Calculation Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Update Views Harian</span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                ~{avgViews.toLocaleString('id-ID')} views / story
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Total Kuantitas View Stories Hari Ini</label>
              <input
                type="number"
                min={0}
                required
                value={totalViews}
                onChange={e => setTotalViews(Math.max(0, Number(e.target.value)))}
                placeholder="misal: 8500"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-900 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Akumulasi seluruh tayangan/penonton dari stories yang aktif pada tanggal ini.</p>
            </div>
          </div>

          {/* Theme & Content */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Topik / Tema Utama Update Story</label>
            <input
              type="text"
              value={topicOrTheme}
              onChange={e => setTopicOrTheme(e.target.value)}
              placeholder="Contoh: Behind The Scenes Formulasi Serum, Q&A Customer, Promo 9.9"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-medium"
            />
          </div>

          {/* Secondary Interactions */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2.5">
            <span className="font-bold text-slate-700 text-[11px] block">INTERAKSI AUDIENS PADA STORY</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-slate-600 mb-1">DM / Replies</label>
                <input
                  type="number"
                  min={0}
                  value={replies}
                  onChange={e => setReplies(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-center"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Link Clicks</label>
                <input
                  type="number"
                  min={0}
                  value={linkClicks}
                  onChange={e => setLinkClicks(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-center"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Shares</label>
                <input
                  type="number"
                  min={0}
                  value={shares}
                  onChange={e => setShares(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-center"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Stiker polling menghasilkan 400 voting, link langsung ke checkout"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-slate-600"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {story && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus log story tanggal ini?')) {
                    onDelete(story.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Log
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm"
              >
                Simpan Log Story
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { MonthlyStoriesModal } from './MonthlyStoriesModal';

