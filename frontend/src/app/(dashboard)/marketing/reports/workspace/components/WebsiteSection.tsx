import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  TrendingUp, 
  Target, 
  FlaskConical, 
  CheckSquare, 
  Plus, 
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Brand, WebsiteReportData, WebsiteTask, WebsiteQueryMetric } from '../types';
import { formatNumber } from '../utils/helpers';

interface WebsiteSectionProps {
  brand?: Brand;
  brandName?: string;
  report?: WebsiteReportData;
  data?: WebsiteReportData;
  period?: string;
  onSaveReport?: (updatedWebsiteReport: WebsiteReportData) => void;
}

export const WebsiteSection: React.FC<WebsiteSectionProps> = ({
  brand,
  brandName,
  report,
  data: propData,
  period,
  onSaveReport
}) => {
  const currentBrandName = brand?.name || brandName || 'Brand';

  const [activeTab, setActiveTab] = useState<'queries' | 'tasks'>('queries');
  const [querySearch, setQuerySearch] = useState('');
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('All');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<WebsiteTask['category']>('SEO Optimization');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Gusti');
  const [newTaskTargetQuery, setNewTaskTargetQuery] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-09-20');
  const [newTaskImpact, setNewTaskImpact] = useState('+400 Impressions / +5 Leads');

  const defaultData: WebsiteReportData = {
    totalSessions: 0,
    totalUsers: 0,
    organicImpressions: 0,
    organicClicks: 0,
    avgCtr: 0,
    avgPosition: 0,
    leadsTraffic: 0,
    sampleRequests: 0,
    conversionRate: 0,
    queries: [],
    tasks: []
  };

  const data = report || propData || defaultData;

  const filteredQueries = data.queries.filter(q => 
    q.queryName.toLowerCase().includes(querySearch.toLowerCase()) ||
    q.landingPage.toLowerCase().includes(querySearch.toLowerCase())
  );

  const filteredTasks = taskCategoryFilter === 'All'
    ? data.tasks
    : data.tasks.filter(t => t.category === taskCategoryFilter);

  const handleToggleTaskStatus = (taskId: string) => {
    const updatedTasks: WebsiteTask[] = data.tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });

    const updatedData = { ...data, tasks: updatedTasks };
    onSaveReport?.(updatedData);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: WebsiteTask = {
      id: `wt-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      assignee: newTaskAssignee,
      targetQuery: newTaskTargetQuery.trim() || undefined,
      dueDate: newTaskDueDate,
      status: 'In Progress',
      impact: newTaskImpact.trim() || '+10 Leads'
    };

    const updatedData = {
      ...data,
      tasks: [newTask, ...data.tasks]
    };

    onSaveReport?.(updatedData);
    setNewTaskTitle('');
    setNewTaskTargetQuery('');
    setIsAddTaskOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* WEBSITE SUB-BAR */}
      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-700">
          Website &amp; SEO Center
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('queries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'queries'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Query Name &amp; Traffic</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task Website ({data.tasks.length})</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Organic Impressions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Organic Impressions</span>
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatNumber(data.organicImpressions)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Clicks:</span>
            <strong className="text-slate-800">{formatNumber(data.organicClicks)}</strong>
            <span>({data.avgCtr}% CTR)</span>
          </div>
        </div>

        {/* Avg Position & Sessions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Avg Ranking & Sessions</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            #{data.avgPosition} <span className="text-xs font-normal text-slate-400">di Google</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Total Web Sessions:</span>
            <strong className="text-slate-800">{formatNumber(data.totalSessions)}</strong>
          </div>
        </div>

        {/* Leads Traffic (The Requested Metric) */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-800">
            <span>Leads Traffic</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {formatNumber(data.leadsTraffic)} <span className="text-xs font-semibold text-blue-600">Leads</span>
          </div>
          <div className="text-[11px] text-blue-800 mt-1 font-semibold">
            Inquiries dari formulir & chat web
          </div>
        </div>

        {/* Sample Requests (The Requested Metric) */}
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span>Sample Requests</span>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatNumber(data.sampleRequests)} <span className="text-xs font-semibold text-emerald-600">Samples</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-semibold">
            Form permintaan trial sample produk
          </div>
        </div>
      </div>

      {activeTab === 'queries' ? (
        /* TAB 1: QUERY NAME & ORGANIC PERFORMANCE TABLE */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Query Name & Metrik Penelusuran Organik (Search Console)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar kata kunci penelusuran Google yang menyumbang Impressions, Leads Traffic, dan Sample Requests.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kata kunci query..."
                value={querySearch}
                onChange={e => setQuerySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Query Name (Kata Kunci)</th>
                  <th className="py-3 px-3 text-right">Impressions</th>
                  <th className="py-3 px-3 text-right">Clicks</th>
                  <th className="py-3 px-3 text-center">CTR</th>
                  <th className="py-3 px-3 text-center">Ranking</th>
                  <th className="py-3 px-3 text-right text-blue-700">Leads Traffic</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Sample Inquiries</th>
                  <th className="py-3 px-3">Landing Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueries.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {q.queryName}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatNumber(q.impressions)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {formatNumber(q.clicks)}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">
                      {q.ctr}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        #{q.avgPosition}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        +{q.leadsTraffic} Leads
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        +{q.sampleRequests} Samples
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">
                      {q.landingPage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: WEBSITE TASKS */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Task Website & Eksekusi SEO / CRO
              </h3>
              <p className="text-xs text-slate-500">
                Daftar pengerjaan teknis, optimasi konten artikel, dan uji coba formulir sample website.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={taskCategoryFilter}
                onChange={e => setTaskCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="All">Semua Kategori</option>
                <option value="SEO Optimization">SEO Optimization</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Blog Article">Blog Article</option>
                <option value="CRO & Sample Form">CRO & Sample Form</option>
                <option value="Technical & Speed">Technical & Speed</option>
              </select>

              <button
                onClick={() => setIsAddTaskOpen(!isAddTaskOpen)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Task</span>
              </button>
            </div>
          </div>

          {/* ADD TASK FORM INLINE */}
          {isAddTaskOpen && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="font-bold text-xs text-blue-900 uppercase tracking-wider">
                Formulir Tambah Task Website Baru
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Judul Task Website</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Redesign Tombol CTA Request Sample di Mobile"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="SEO Optimization">SEO Optimization</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Blog Article">Blog Article</option>
                    <option value="CRO & Sample Form">CRO & Sample Form</option>
                    <option value="Technical & Speed">Technical & Speed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={e => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Gusti">Gusti</option>
                    <option value="Revita">Revita</option>
                    <option value="Zarkasi">Zarkasi</option>
                    <option value="Rahmat">Rahmat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Query (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Kata kunci target"
                    value={newTaskTargetQuery}
                    onChange={e => setNewTaskTargetQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Estimasi Dampak</label>
                  <input
                    type="text"
                    value={newTaskImpact}
                    onChange={e => setNewTaskImpact(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  Simpan Task Website
                </button>
              </div>
            </form>
          )}

          {/* TASK LIST */}
          <div className="space-y-2.5">
            {filteredTasks.map(task => (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.status === 'Completed'
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition cursor-pointer shrink-0 ${
                      task.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    {task.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {task.category}
                      </span>
                      <h4 className={`text-xs font-bold ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                    </div>

                    {task.targetQuery && (
                      <div className="text-[11px] text-blue-700 flex items-center gap-1 font-medium">
                        <Search className="w-3 h-3" />
                        <span>Query target: &ldquo;{task.targetQuery}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs pl-8 sm:pl-0 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Assignee / Deadline</div>
                    <div className="font-semibold text-slate-700">{task.assignee} &middot; {task.dueDate}</div>
                  </div>

                  <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    {task.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
