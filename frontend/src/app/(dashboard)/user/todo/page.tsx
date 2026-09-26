"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Layout,
  History,
  Filter,
  Eye,
  Edit3,
  Settings,
  MoreHorizontal,
  Grab,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Button,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { Badge } from "@/components/dna";
import { DashboardCard } from "@/components/dna/DashboardCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";
import { QueryLoading, QueryError } from "@/components/query-states";

// Shape dari backend: GET /todo/boards (TaskBoard) + GET /todo/boards/:id ({...board, tasks}).
type ApiTask = {
  id: string;
  boardId: string;
  title: string;
  description?: string | null;
  status: string;
  assigneeId?: string | null;
  labels: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
};

type ApiBoard = {
  id: string;
  name: string;
  color: string;
  createdById?: string | null;
  createdAt: string;
  tasks: ApiTask[];
};

// Status kanonik TaskItem (backend: ALLOWED_TASK_STATUSES).
const COLUMNS = [
  { id: "TODO", label: "To-Do", color: "#F59E0B", text: "text-amber-600", light: "bg-amber-50" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#3B82F6", text: "text-blue-600", light: "bg-blue-50" },
  { id: "IN_REVIEW", label: "Review", color: "#6366F1", text: "text-indigo-600", light: "bg-indigo-50" },
  { id: "DONE", label: "Done", color: "#10B981", text: "text-emerald-600", light: "bg-emerald-50" },
  { id: "BLOCKED", label: "Blocked", color: "#EF4444", text: "text-rose-600", light: "bg-rose-50" },
];

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TodoListPrototype() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Satu query: daftar board + task-nya. `/todo/boards` tidak mengembalikan
  // hitungan task, jadi task diambil per board supaya angka yang tampil nyata.
  const { data: boards, isLoading, isError, error, refetch } = useQuery<ApiBoard[]>({
    queryKey: ["todo-boards-with-tasks"],
    queryFn: async () => {
      const res = await api.get("/todo/boards");
      const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return Promise.all(
        list.map(async (b: any) => {
          const detail = await api.get(`/todo/boards/${b.id}`);
          const board = detail.data?.data ?? detail.data;
          return {
            ...b,
            tasks: Array.isArray(board?.tasks) ? (board.tasks as ApiTask[]) : [],
          } as ApiBoard;
        })
      );
    },
    staleTime: 30_000,
  });

  const boardList = boards ?? [];
  const activeBoard = boardList.find((b) => b.id === activeBoardId) ?? null;
  const activeTasks: ApiTask[] = activeBoard?.tasks ?? [];

  const deleteBoard = useMutation({
    mutationFn: (id: string) => api.delete(`/todo/boards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todo-boards-with-tasks"] });
      setView("list");
      setActiveBoardId(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/todo/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todo-boards-with-tasks"] }),
  });

  const handleOpenBoard = (board: ApiBoard) => {
    setActiveBoardId(board.id);
    setView("kanban");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <TableShell
      title="Task"
      titleAccent="Board"
      subtitle="To-Do List & Kanban Protocol for Cross-Department Operational Efficiency"
      actions={
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="h-14 px-6 border-2 border-slate-200 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm hover:bg-slate-50 transition-all"
          >
            <History className="mr-2 h-4 w-4 text-amber-500" /> Recent Activity
          </Button>
          <Button
            className="h-14 px-8 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl shadow-xl shadow-slate-200 font-black uppercase tracking-tighter text-sm border border-slate-200 transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-5 w-5" /> Create Board
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <QueryLoading message="Memuat task board..." />
      ) : isError ? (
        <QueryError error={error} onRetry={() => refetch()} message="Gagal memuat task board" />
      ) : (
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
             {/* Board Grid */}
             {boardList.length === 0 ? (
               <DashboardCard className="!p-12 text-center space-y-3">
                 <Layout className="h-8 w-8 mx-auto text-slate-300" />
                 <p className="text-sm font-black uppercase tracking-widest text-slate-400">Belum ada board di server</p>
                 <p className="text-[11px] font-semibold text-slate-400">Buat board lewat tombol Create Board atau endpoint POST /todo/boards.</p>
               </DashboardCard>
             ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {boardList.map((board) => {
                 const total = board.tasks.length;
                 const done = board.tasks.filter((t) => t.status === "DONE").length;
                 const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                 return (
                 <motion.div
                   key={board.id}
                   variants={containerVariants}
                   onClick={() => handleOpenBoard(board)}
                   className="group cursor-pointer"
                 >
                      <DashboardCard className="!p-8 space-y-6" style={{ borderBottomColor: board.color, borderBottomWidth: 8, borderBottomStyle: "solid" }}>
                       <div className="flex justify-between items-start">
                          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: board.color }}>
                             <Layout className="h-6 w-6" />
                          </div>
                          <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase px-3 py-1">
                             {total} Tasks
                          </Badge>
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{board.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {done}/{total} Selesai
                          </p>
                       </div>
                       <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className={cn("h-4 w-4", pct === 100 && total > 0 ? "text-emerald-500" : "text-slate-300")} />
                             <span className="text-[10px] font-black text-slate-400 uppercase">{pct}% DONE</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{formatDate(board.createdAt)}</span>
                       </div>
                    </DashboardCard>
                 </motion.div>
                 );
               })}
                <DashboardCard className="!border-4 !border-dashed !border-slate-200 !bg-white/50 flex flex-col items-center justify-center !p-8 space-y-4">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                     <Plus className="h-8 w-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-all">Provision New Board</span>
               </DashboardCard>
             </div>
             )}

             {/* Table View */}
              <DashboardCard className="!p-0 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900">Protocol <span className="text-blue-600">Directory</span></h3>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-500">
                      {boardList.length} Boards
                    </Button>
                  </div>
                </div>
                <DnaTable>
                  <DnaTableHead className="bg-slate-50/50">
                    <DnaTableRow className="hover:bg-transparent border-slate-100">
                      <DnaTh className="py-6 pl-10 text-table-header text-slate-400">Board Identity</DnaTh>
                      <DnaTh className="text-table-header text-slate-400">Task Density</DnaTh>
                      <DnaTh className="text-table-header text-slate-400">Status</DnaTh>
                      <DnaTh className="text-table-header text-slate-400">Creation Date</DnaTh>
                      <DnaTh className="pr-10 text-table-header text-slate-400 text-right">Action</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {boardList.map((board) => {
                      const total = board.tasks.length;
                      const done = board.tasks.filter((t) => t.status === "DONE").length;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                      <DnaTableRow key={board.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                        <DnaTd className="py-8 pl-10">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-10 rounded-full" style={{ backgroundColor: board.color }} />
                            <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{board.name}</span>
                          </div>
                        </DnaTd>
                        <DnaTd>
                          <div className="flex items-center gap-4 w-48">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full" style={{ backgroundColor: board.color }} />
                             </div>
                             <span className="text-[10px] font-black text-slate-900 tabular-nums">{total}</span>
                          </div>
                        </DnaTd>
                        <DnaTd>
                           <span className="text-[10px] font-black text-slate-900 uppercase italic underline decoration-slate-200 underline-offset-4">{done} / {total} DONE</span>
                        </DnaTd>
                        <DnaTd>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(board.createdAt)}</span>
                        </DnaTd>
                        <DnaTd className="pr-10 text-right">
                          <div className="flex justify-end gap-2">
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleOpenBoard(board)}
                               className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                             >
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => deleteBoard.mutate(board.id)}
                               disabled={deleteBoard.isPending}
                               className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                      );
                    })}
                  </DnaTableBody>
                </DnaTable>
              </DashboardCard>
          </motion.div>
        ) : activeBoard ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10 h-full"
          >
             {/* Kanban Nav */}
             <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border-b-4 border-slate-900" style={{ borderBottomColor: activeBoard.color }}>
               <Button
                 variant="ghost"
                 onClick={() => setView("list")}
                 className="group rounded-2xl p-2 pr-6 transition-all hover:bg-slate-50"
               >
                 <div className="h-11 w-11 rounded-xl bg-white text-gray-900 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all border border-slate-200">
                    <ChevronLeft className="h-5 w-5" />
                 </div>
                 <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-slate-900">Back to Hub</span>
               </Button>
               <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Active Board</span>
                     <span className="text-xl font-black uppercase italic tracking-tighter text-slate-900">{activeBoard.name}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400"><Filter className="h-5 w-5" /></Button>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400"><Settings className="h-5 w-5" /></Button>
                  </div>
               </div>
            </div>

            {/* Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start overflow-x-auto pb-10 min-h-[70vh]">
               {COLUMNS.map((col) => (
                 <div key={col.id} className="space-y-6 min-w-[280px]">
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: col.color }}>
                       <div className="flex items-center gap-3">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", col.text)}>{col.label}</span>
                          <Badge className={cn("bg-white border-none shadow-sm text-[10px] font-black", col.text)}>
                             {activeTasks.filter(t => t.status === col.id).length}
                          </Badge>
                       </div>
                       <MoreHorizontal className="h-4 w-4 text-slate-300" />
                    </div>

                    <div className="space-y-4 min-h-[500px]">
                       {activeTasks.filter(t => t.status === col.id).map((task) => (
                         <motion.div
                           key={task.id}
                           layoutId={String(task.id)}
                           className="group cursor-grab active:cursor-grabbing"
                         >
                             <DashboardCard className="!rounded-[1.5rem] !p-6 space-y-4 !border-l-2 !border-l-transparent">
                               <div className="flex justify-between items-start">
                                  <div className="flex flex-wrap gap-1">
                                     {(task.labels ?? []).map(l => (
                                       <Badge key={l} className="bg-slate-50 text-slate-400 border-none font-black text-[7px] uppercase px-1.5 py-0.5">#{l}</Badge>
                                     ))}
                                  </div>
                                  <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-200 group-hover:text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent className="rounded-xl border-none shadow-2xl p-2 bg-white">
                                        <DropdownMenuItem className="rounded-lg h-10 px-4 font-black uppercase text-[9px] hover:bg-slate-50 cursor-pointer"><Edit3 className="mr-2 h-3 w-3" /> Edit Protocol</DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => deleteTask.mutate(task.id)}
                                          className="rounded-lg h-10 px-4 font-black uppercase text-[9px] hover:bg-rose-50 text-rose-600 cursor-pointer"
                                        >
                                          <Trash2 className="mr-2 h-3 w-3" /> Terminate
                                        </DropdownMenuItem>
                                     </DropdownMenuContent>
                                  </DropdownMenu>
                               </div>

                               <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                                  {task.title}
                               </h4>
                               <p className="text-[10px] font-bold text-slate-400 line-clamp-2 uppercase leading-relaxed italic">
                                  {task.description || "—"}
                               </p>

                               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                     <Clock className="h-3 w-3 text-slate-300" />
                                     <span className="text-[8px] font-black text-slate-300 uppercase">Update {formatDate(task.updatedAt)}</span>
                                  </div>
                                  <div className="h-7 min-w-7 px-2 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-black text-gray-600 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                     {task.assigneeId ? task.assigneeId.slice(0, 2).toUpperCase() : "—"}
                                  </div>
                               </div>
                            </DashboardCard>
                         </motion.div>
                       ))}

                       <Button
                         variant="ghost"
                         className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-400 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-600 transition-all font-black uppercase text-[9px] tracking-widest gap-2"
                       >
                          <Plus className="h-4 w-4" /> Provision New Task
                       </Button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Button variant="ghost" onClick={() => { setView("list"); setActiveBoardId(null); }} className="font-black uppercase text-[10px] tracking-widest text-slate-400">
              <ChevronLeft className="mr-2 h-4 w-4" /> Board tidak ditemukan — kembali ke directory
            </Button>
          </div>
        )}
      </AnimatePresence>
      )}

      {/* Footer Info */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex justify-between items-center px-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className={cn("w-3 h-3 rounded-full", isError ? "bg-rose-500" : "bg-blue-500 animate-pulse")} />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                 {isError ? "Sumber Data: Gagal Terhubung" : `Board Tersinkron: ${boardList.length}`}
               </span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
               <Grab className="h-4 w-4 text-slate-400" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">D&D Protocols Active</span>
            </div>
         </div>
         <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">Nex Matrix Operational Intelligence © 2026</p>
      </motion.div>
    </TableShell>
  );
}