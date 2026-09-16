import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Plus, 
  ListTodo, 
  CalendarDays, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Task, Member, TaskStatus, TaskPriority, TaskType } from '../types';
import { calculateDaysLeft, formatDateIndo, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/helpers';

interface TaskOverviewProps {
  tasks: Task[];
  members: Member[];
  onSelectMember: (memberName: string) => void;
  onOpenAddTaskModal: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onViewTaskDetail: (task: Task) => void;
}

export const TaskOverview: React.FC<TaskOverviewProps> = ({
  tasks,
  members,
  onSelectMember,
  onOpenAddTaskModal,
  onUpdateTaskStatus,
  onViewTaskDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | TaskType>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

  // Overview metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const lateTasks = tasks.filter(t => t.status === 'Late').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const lateRate = totalTasks > 0 ? Math.round((lateTasks / totalTasks) * 100) : 0;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (typeFilter !== 'All' && task.type !== typeFilter) return false;
      if (statusFilter !== 'All' && task.status !== statusFilter) return false;
      if (assigneeFilter !== 'All' && task.assignee !== assigneeFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(query);
        const matchesProject = task.project?.toLowerCase().includes(query) || false;
        const matchesAssignee = task.assignee.toLowerCase().includes(query);
        if (!matchesName && !matchesProject && !matchesAssignee) return false;
      }
      return true;
    });
  }, [tasks, typeFilter, statusFilter, assigneeFilter, searchTerm]);

  // Member stats calculations
  const memberStats = useMemo(() => {
    return members.map(m => {
      const mTasks = tasks.filter(t => {
        if (t.assigneeId && (t.assigneeId === m.id || t.assigneeId === m.userId)) return true;
        const tAss = (t.assignee || '').toLowerCase();
        const mName = (m.name || '').toLowerCase();
        return tAss === mName || tAss.includes(mName) || mName.includes(tAss);
      });
      const mDaily = mTasks.filter(t => t.type === 'Daily');
      const mDailyDone = mDaily.filter(t => t.status === 'Completed').length;
      const mProject = mTasks.filter(t => t.type === 'Project');
      const mProjectActive = mProject.filter(t => t.status !== 'Completed').length;
      const mLate = mTasks.filter(t => t.status === 'Late').length;
      const mCompleted = mTasks.filter(t => t.status === 'Completed').length;
      const mCompRate = mTasks.length > 0 ? Math.round((mCompleted / mTasks.length) * 100) : 0;

      return {
        member: m,
        total: mTasks.length,
        late: mLate,
        dailyDone: mDailyDone,
        dailyTotal: mDaily.length,
        projectActive: mProjectActive,
        completionRate: mCompRate
      };
    });
  }, [members, tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
            <span>DREAMLAB TASK MANAGEMENT</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-blue-600 font-semibold">ERP DASHBOARD</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Overview & Performa Tim
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih member untuk meninjau daily task, project task, dan performa ketepatan waktu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="overview-btn-add-task"
            onClick={onOpenAddTaskModal}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambahkan Task Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Task</span>
            <ListTodo className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{inProgressTasks} sedang berjalan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{completedTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Selesai tepat waktu
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Completion</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{completionRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target standar &ge; 75%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Late Rate</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{lateRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {lateTasks} task butuh follow-up
          </div>
        </div>
      </div>

      {/* Team Member Cards Grid (Matching User Prototype Design) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>Member Workspace</span>
            <span className="text-xs font-normal text-slate-400">({members.length} Anggota)</span>
          </h2>
          <span className="text-xs text-slate-400">Klik kartu untuk detail task & analitik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {memberStats.map(({ member, total, late, dailyDone, dailyTotal, projectActive, completionRate: cRate }) => (
            <div
              key={member.id}
              onClick={() => onSelectMember(member.name)}
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-slate-700 border border-slate-200 shrink-0 group-hover:scale-105 transition"
                      style={{ backgroundColor: member.avatarBg }}
                    >
                      {member.initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition flex items-center gap-1">
                        {member.name}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-blue-600" />
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {total} tasks · <span className={late > 0 ? 'text-rose-600 font-semibold' : ''}>{late} late</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>

                <div className="text-[11px] text-slate-500 mt-2 line-clamp-1">
                  {member.role}
                </div>
              </div>

              {/* Card Summary Metrics Row */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 mt-4 pt-3 text-center">
                <div className="text-left">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Daily Task</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{dailyDone} / {dailyTotal || 5}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Project</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{projectActive} active</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Rate</div>
                  <div className={`text-xs font-black mt-0.5 ${cRate >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {cRate}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Task Management Database Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-600" />
              <span>Daftar Seluruh Task Tim</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredTasks.length} Task
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter berdasarkan kategori, status pengerjaan, atau anggota tim penanggung jawab.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari task, project, PIC..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 lg:w-60"
              />
            </div>

            {/* Type Filter */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {(['All', 'Daily', 'Project'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    typeFilter === type ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {type === 'All' ? 'Semua' : type}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Review">Review</option>
              <option value="Late">Late</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="All">Semua Member</option>
              {members.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Nama Task</th>
                <th className="py-3 px-2">Tipe / Project</th>
                <th className="py-3 px-2">Assignee</th>
                <th className="py-3 px-2">Due Date</th>
                <th className="py-3 px-2">Days Left</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada task yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const daysLeftInfo = calculateDaysLeft(task.dueDate);
                  return (
                    <tr 
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewTaskDetail(task)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          {task.name}
                        </div>
                        {task.brief && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                            {task.brief}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        {task.type === 'Project' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            {task.project || 'Project'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                            Daily
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMember(task.assignee);
                          }}
                          className="font-medium text-slate-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-600">
                            {task.assignee[0]}
                          </span>
                          {task.assignee}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                        {formatDateIndo(task.dueDate)}
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className={`font-semibold text-[11px] ${
                          daysLeftInfo.isLate ? 'text-rose-600 font-bold' : daysLeftInfo.isToday ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {daysLeftInfo.text}
                        </span>
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none ${getStatusBadgeClass(task.status)}`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Completed">Completed</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>

                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTaskDetail(task);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
