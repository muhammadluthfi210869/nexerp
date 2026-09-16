import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { Member, Task, TaskStatus } from '../types';
import { calculateDaysLeft, formatDateIndo, getStatusBadgeClass, getPriorityBadgeClass } from '../utils/helpers';

interface MemberProfileViewProps {
  member: Member;
  tasks: Task[];
  onBack: () => void;
  onOpenAddTaskModal: () => void;
  onOpenEditProfileModal: (member: Member) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onViewTaskDetail: (task: Task) => void;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  tasks,
  onBack,
  onOpenAddTaskModal,
  onOpenEditProfileModal,
  onUpdateTaskStatus,
  onViewTaskDetail
}) => {
  const [activeTab, setActiveTab] = useState<'mOverview' | 'daily' | 'projects'>('mOverview');

  // Filter member tasks
  const memberTasks = tasks.filter(t => {
    if (t.assigneeId && (t.assigneeId === member.id || t.assigneeId === member.userId)) return true;
    const tAss = (t.assignee || '').toLowerCase();
    const mName = (member.name || '').toLowerCase();
    return tAss === mName || tAss.includes(mName) || mName.includes(tAss);
  });
  const dailyTasks = memberTasks.filter(t => t.type === 'Daily');
  const projectTasks = memberTasks.filter(t => t.type === 'Project');

  // Calculations
  const totalCount = memberTasks.length;
  const totalCompleted = memberTasks.filter(t => t.status === 'Completed').length;
  const totalLate = memberTasks.filter(t => t.status === 'Late').length;
  const overallCompRate = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;
  const overallLateRate = totalCount > 0 ? Math.round((totalLate / totalCount) * 100) : 0;

  // Daily stats
  const dailyDone = dailyTasks.filter(t => t.status === 'Completed').length;
  const dailyLate = dailyTasks.filter(t => t.status === 'Late').length;
  const dailyOnTime = dailyDone;
  const dailyCompRate = dailyTasks.length > 0 ? Math.round((dailyDone / dailyTasks.length) * 100) : 0;
  const dailyLateRate = dailyTasks.length > 0 ? Math.round((dailyLate / dailyTasks.length) * 100) : 0;

  // Project stats
  const projectDone = projectTasks.filter(t => t.status === 'Completed').length;
  const projectLate = projectTasks.filter(t => t.status === 'Late').length;
  const projectOnTime = projectTasks.filter(t => t.status !== 'Late').length;
  const projectCompRate = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0;
  const projectLateRate = projectTasks.length > 0 ? Math.round((projectLate / projectTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Overview</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-slate-700 border border-slate-200 shadow-xs"
            style={{ backgroundColor: member.avatarBg }}
          >
            {member.initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{member.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {member.department}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {member.role} · <span className="text-slate-400">{member.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenEditProfileModal(member)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={onOpenAddTaskModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambahkan Task</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('mOverview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'mOverview'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview & Performa
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'daily'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Daily Tasks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {dailyTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'projects'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Project Tasks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {projectTasks.length}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'mOverview' && (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Task</span>
              <div className="text-2xl font-black text-slate-900 mt-1.5">{totalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Completed</span>
              <div className="text-2xl font-black text-emerald-600 mt-1.5">{totalCompleted}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Completion Rate</span>
              <div className="text-2xl font-black text-blue-600 mt-1.5">{overallCompRate}%</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Late Rate</span>
              <div className="text-2xl font-black text-rose-600 mt-1.5">{overallLateRate}%</div>
            </div>
          </div>

          {/* Two Evaluation Comparison Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Tasks Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Daily Task</h3>
                  <p className="text-[11px] text-slate-400">Penilaian kepatuhan daily task rutin</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  DAILY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Completion Rate</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{dailyCompRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dailyCompRate}%` }} />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Late Rate</span>
                  <div className="text-xl font-black text-rose-600 mt-1">{dailyLateRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${dailyLateRate}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-bold text-emerald-600">{dailyDone} / {dailyTasks.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Late</span>
                  <span className="font-bold text-rose-600">{dailyLate} / {dailyTasks.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">On Time</span>
                  <span className="font-bold text-emerald-600">{dailyOnTime}</span>
                </div>
              </div>
            </div>

            {/* Project Tasks Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Project Task</h3>
                  <p className="text-[11px] text-slate-400">Penilaian milestone & deadline proyek</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  PROJECT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Completion Rate</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{projectCompRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${projectCompRate}%` }} />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Late Rate</span>
                  <div className="text-xl font-black text-rose-600 mt-1">{projectLateRate}%</div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${projectLateRate}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-bold text-emerald-600">{projectDone} / {projectTasks.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Late</span>
                  <span className="font-bold text-rose-600">{projectLate} / {projectTasks.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">On Time</span>
                  <span className="font-bold text-emerald-600">{projectOnTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY TASKS */}
      {activeTab === 'daily' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Daily Tasks</h3>
              <p className="text-xs text-slate-400">Task rutin · deadline · days left</p>
            </div>
            <button
              onClick={onOpenAddTaskModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambahkan Task</span>
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Task</th>
                  <th className="py-3 px-2">Start Date</th>
                  <th className="py-3 px-2">Due Date</th>
                  <th className="py-3 px-2">Days Left</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada daily task untuk {member.name}.
                    </td>
                  </tr>
                ) : (
                  dailyTasks.map(task => {
                    const daysInfo = calculateDaysLeft(task.dueDate);
                    const isDone = task.status === 'Completed';

                    return (
                      <tr 
                        key={task.id}
                        className="hover:bg-slate-50/80 transition group cursor-pointer"
                        onClick={() => onViewTaskDetail(task)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTaskStatus(task.id, isDone ? 'In Progress' : 'Completed');
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                                isDone 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'border-slate-300 hover:border-slate-500'
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                {task.name}
                              </div>
                              {task.brief && (
                                <div className="text-[10px] text-slate-400 line-clamp-1">{task.brief}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{formatDateIndo(task.startDate)}</td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{formatDateIndo(task.dueDate)}</td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`font-semibold ${
                            daysInfo.isLate ? 'text-rose-600' : daysInfo.isToday ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {daysInfo.text}
                          </span>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(task.status)}`}
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Late">Late</option>
                          </select>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewTaskDetail(task);
                            }}
                            className="text-xs text-blue-600 hover:underline"
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
      )}

      {/* TAB 3: PROJECT TASKS */}
      {activeTab === 'projects' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Project Tasks</h3>
              <p className="text-xs text-slate-400">Timeline · milestone proyek · deadline</p>
            </div>
            <button
              onClick={onOpenAddTaskModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambahkan Task</span>
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Task</th>
                  <th className="py-3 px-2">Project</th>
                  <th className="py-3 px-2">Start Date</th>
                  <th className="py-3 px-2">Due Date</th>
                  <th className="py-3 px-2">Days Left</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada project task untuk {member.name}.
                    </td>
                  </tr>
                ) : (
                  projectTasks.map(task => {
                    const daysInfo = calculateDaysLeft(task.dueDate);
                    const isDone = task.status === 'Completed';

                    return (
                      <tr 
                        key={task.id}
                        className="hover:bg-slate-50/80 transition group cursor-pointer"
                        onClick={() => onViewTaskDetail(task)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTaskStatus(task.id, isDone ? 'In Progress' : 'Completed');
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                                isDone 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'border-slate-300 hover:border-slate-500'
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <div className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                {task.name}
                              </div>
                              {task.brief && (
                                <div className="text-[10px] text-slate-400 line-clamp-1">{task.brief}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {task.project || 'General'}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{formatDateIndo(task.startDate)}</td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{formatDateIndo(task.dueDate)}</td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`font-semibold ${
                            daysInfo.isLate ? 'text-rose-600' : daysInfo.isToday ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {daysInfo.text}
                          </span>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(task.status)}`}
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Completed">Completed</option>
                            <option value="Late">Late</option>
                          </select>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewTaskDetail(task);
                            }}
                            className="text-xs text-blue-600 hover:underline"
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
      )}
    </div>
  );
};
