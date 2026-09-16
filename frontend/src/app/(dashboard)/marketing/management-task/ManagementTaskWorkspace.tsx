"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Task, Member, TaskStatus, TaskPriority, TaskType } from '../reports/workspace/types';
import { TaskOverview } from '../reports/workspace/components/TaskOverview';
import { MemberProfileView } from '../reports/workspace/components/MemberProfileView';
import { TaskModal, TaskDetailModal, MemberEditModal } from '../reports/workspace/components/Modals';
import { api } from '@/lib/api';

interface ManagementTaskWorkspaceProps {
  initialMemberSlug?: string;
}

export default function ManagementTaskWorkspace({ initialMemberSlug }: ManagementTaskWorkspaceProps) {
  const router = useRouter();

  // Pure database states (no mock fallbacks)
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Map API task to local Task interface
  const mapApiTask = useCallback((at: any): Task => {
    const rawPriority = String(at.priority || 'MEDIUM').toUpperCase();
    const priority: TaskPriority =
      rawPriority === 'HIGH' || rawPriority === 'URGENT'
        ? 'High'
        : rawPriority === 'LOW'
        ? 'Low'
        : 'Medium';

    const rawStatus = String(at.canonicalStatus || at.status || 'OPEN').toUpperCase();
    const status: TaskStatus =
      rawStatus === 'DONE' || rawStatus === 'COMPLETED'
        ? 'Completed'
        : rawStatus === 'IN_REVIEW' || rawStatus === 'REVIEW'
        ? 'Review'
        : rawStatus === 'IN_PROGRESS'
        ? 'In Progress'
        : rawStatus === 'LATE'
        ? 'Late'
        : 'Pending';

    const rawType = String(at.taskType || at.type || 'DAILY').toUpperCase();
    const type: TaskType = rawType === 'PROJECT' ? 'Project' : 'Daily';
    const rawAssigneeName = at.assignee?.fullName || at.assignee?.name || at.assigneeName || 'Gusti';
    const assigneeId = at.assigneeId || at.picId || at.assignee?.id;
    const brand = at.brand || at.brandRef?.name || 'Dreamlab';

    return {
      id: at.id,
      name: at.title || at.name || 'Untitled Task',
      type,
      project: at.project?.name || at.project || undefined,
      assignee: rawAssigneeName,
      assigneeId,
      brand,
      startDate: at.startDate ? at.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: at.dueDate ? at.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      priority,
      status,
      brief: at.brief || at.description || undefined,
      link: at.outputUrl || at.link || undefined,
      reference: at.referenceUrl || at.reference || undefined,
      checklist: Array.isArray(at.checklist)
        ? at.checklist.map((c: any) => ({
            id: c.id,
            text: c.text,
            done: Boolean(c.done),
          }))
        : [],
      createdAt: at.createdAt ? at.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  }, []);

  // Fetch real database records from canonical API
  const refreshData = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dl_tasks');
        localStorage.removeItem('dl_members');
      }

      const [membersRes, tasksRes] = await Promise.allSettled([
        api.get('/marketing/members'),
        api.get('/marketing/tasks?limit=100'),
      ]);

      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        const loadedMembers: Member[] = membersRes.value.data.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          name: m.name || m.fullName,
          role: m.role || 'Marketing Specialist',
          email: m.email || '',
          phone: m.phone || '',
          avatarBg: m.avatarBg || '#2563eb',
          initial: (m.initial || m.name?.[0] || 'M').toUpperCase(),
          department: m.department || 'Digital Marketing',
        }));
        setMembers(loadedMembers);

        if (initialMemberSlug && initialMemberSlug !== 'overview') {
          const matched = loadedMembers.find(
            m => m.name.toLowerCase() === initialMemberSlug.toLowerCase()
          );
          if (matched) {
            setSelectedMemberName(matched.name);
          }
        }
      }

      if (tasksRes.status === 'fulfilled') {
        const taskList = tasksRes.value?.data?.data || tasksRes.value?.data;
        if (Array.isArray(taskList)) {
          setTasks(taskList.map(mapApiTask));
        }
      }
    } catch (err) {
      console.error('Failed to load marketing data from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [initialMemberSlug, mapApiTask]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Active Member Object
  const currentMember = useMemo(() => {
    if (!selectedMemberName) return null;
    return members.find(m => m.name.toLowerCase() === selectedMemberName.toLowerCase()) || members[0] || null;
  }, [members, selectedMemberName]);

  // Task Actions directly connected to PostgreSQL API
  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const targetMember =
      members.find(m => 
        m.name.toLowerCase() === taskData.assignee.toLowerCase() ||
        taskData.assignee.toLowerCase().includes(m.name.toLowerCase()) ||
        (m.userId && m.userId === taskData.assigneeId)
      ) ||
      currentMember ||
      members[0];

    const payload = {
      type: taskData.type === 'Project' ? 'PROJECT' : 'DAILY',
      title: taskData.name,
      channel: 'General',
      category: taskData.type === 'Project' ? 'project_campaign' : 'general_operations',
      assigneeId: targetMember?.userId || targetMember?.id || taskData.assignee,
      brandId: taskData.brand && taskData.brand.toLowerCase().includes('toribio') ? 'toribio' : 'dreamlab',
      priority: taskData.priority.toUpperCase(),
      startDate: taskData.startDate || new Date().toISOString().split('T')[0],
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      brief: taskData.brief || undefined,
      outputUrl: taskData.link && taskData.link.startsWith('http') ? taskData.link : undefined,
      referenceUrl: taskData.reference && taskData.reference.startsWith('http') ? taskData.reference : undefined,
      checklist: taskData.checklist?.map((c, i) => ({
        text: c.text,
        isRequired: false,
        sortOrder: i,
      })) || [],
    };

    try {
      const res = await api.post('/marketing/tasks', payload);
      const createdTask = res.data?.data || res.data;
      if (createdTask?.id) {
        const mapped = mapApiTask(createdTask);
        setTasks(prev => [mapped, ...prev]);
      } else {
        await refreshData();
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('Failed to save task to database:', err);
      await refreshData();
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const canonicalStatus =
      newStatus === 'Completed'
        ? 'DONE'
        : newStatus === 'In Progress'
        ? 'IN_PROGRESS'
        : newStatus === 'Review'
        ? 'IN_REVIEW'
        : 'NOT_STARTED';

    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
    if (detailTask && detailTask.id === taskId) {
      setDetailTask(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await api.patch(`/marketing/tasks/${taskId}/status`, {
        status: canonicalStatus,
      });
    } catch (err) {
      console.error('Failed to update task status in database:', err);
      await refreshData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (detailTask && detailTask.id === taskId) {
      setDetailTask(null);
    }

    try {
      await api.delete(`/marketing/tasks/${taskId}`);
    } catch (err) {
      console.error('Failed to delete task in database:', err);
      await refreshData();
    }
  };

  const handleSaveMember = async (updatedMember: Member) => {
    setMembers(prev => prev.map(m => (m.id === updatedMember.id ? updatedMember : m)));
    setEditingMember(null);

    try {
      await api.patch(`/marketing/members/${updatedMember.id}`, {
        name: updatedMember.name,
        role: updatedMember.role,
        phone: updatedMember.phone,
        department: updatedMember.department,
      });
    } catch (err) {
      console.error('Failed to update member in database:', err);
      await refreshData();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Memuat Data Management Task...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      {/* 🚀 Top Navigation Context Bar (when a member is selected) */}
      {selectedMemberName && currentMember && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 mb-6 sticky top-0 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberName(null);
                  router.push('/marketing/management-task/overview');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
                <span>Kembali ke Overview</span>
              </button>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Anggota:</span>
                <span className="text-blue-600 font-bold">{currentMember.name}</span>
              </div>
            </div>

            {/* Member Quick Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Pilih Member:
              </span>
              {members.map(m => {
                const isActive = m.name.toLowerCase() === selectedMemberName.toLowerCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMemberName(m.name);
                      router.push(`/marketing/management-task/${m.name.toLowerCase()}`);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isActive ? '#ffffff' : m.avatarBg }}
                    />
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area (Without inner sidebar) */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {selectedMemberName === null || !currentMember ? (
          /* VIEW 1: OVERVIEW */
          <TaskOverview
            tasks={tasks}
            members={members}
            onSelectMember={(name) => {
              setSelectedMemberName(name);
              router.push(`/marketing/management-task/${name.toLowerCase()}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAddTaskModal={() => setIsTaskModalOpen(true)}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onViewTaskDetail={(t) => setDetailTask(t)}
          />
        ) : (
          /* VIEW 2: MEMBER PROFILE */
          <MemberProfileView
            member={currentMember}
            tasks={tasks}
            onBack={() => {
              setSelectedMemberName(null);
              router.push('/marketing/management-task/overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAddTaskModal={() => setIsTaskModalOpen(true)}
            onOpenEditProfileModal={(m) => setEditingMember(m)}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onViewTaskDetail={(t) => setDetailTask(t)}
          />
        )}
      </div>

      {/* MODALS */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        members={members}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={handleDeleteTask}
        onUpdateStatus={handleUpdateTaskStatus}
      />

      <MemberEditModal
        member={editingMember}
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
