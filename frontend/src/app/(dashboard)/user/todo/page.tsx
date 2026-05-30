"use client";

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Save, 
  MoreVertical, 
  User, 
  Clock, 
  CheckCircle2, 
  Layout, 
  History, 
  Filter, 
  Eye, 
  Edit3, 
  ArrowRightLeft,
  Settings,
  MoreHorizontal,
  Grab
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableShell } from "@/components/layout/TableShell";

// Static Data from Plan
const STATIC_BOARDS = [
  { "nama": "Production Tasks", "warna": "#3B82F6", "task_count": 6, "dibuat_oleh": "Admin", "tanggal": "01/04/2026" },
  { "nama": "QC Checklist", "warna": "#10B981", "task_count": 4, "dibuat_oleh": "Admin", "tanggal": "02/04/2026" },
  { "nama": "Procurement", "warna": "#F59E0B", "task_count": 8, "dibuat_oleh": "Admin", "tanggal": "03/04/2026" },
  { "nama": "R&D Formulasi", "warna": "#8B5CF6", "task_count": 5, "dibuat_oleh": "Fadilah", "tanggal": "05/04/2026" },
  { "nama": "Finance Closing", "warna": "#EF4444", "task_count": 3, "dibuat_oleh": "Irma", "tanggal": "10/04/2026" },
];

const STATIC_TASKS = [
  { "id": 1, "board": "Production Tasks", "title": "Review batch formula BR-001", "description": "Check formula for batch BR-001 before mixing", "status": "Todo", "assignee": "AD", "labels": ["urgent"] },
  { "id": 2, "board": "Production Tasks", "title": "Prepare raw materials mixing", "description": "Prepare materials for mixing batch 002", "status": "In Progress", "assignee": "WH", "labels": [] },
  { "id": 3, "board": "Production Tasks", "title": "QC sampling batch finished", "description": "Take samples from finished batch for QC", "status": "Review", "assignee": "LB", "labels": ["QC"] },
  { "id": 4, "board": "Production Tasks", "title": "Print batch record docs", "description": "Print completed batch records for archive", "status": "Done", "assignee": "AD", "labels": [] },
  { "id": 5, "board": "QC Checklist", "title": "Test sample stability 40C", "description": "40C stability test for body lotion batch 003", "status": "Todo", "assignee": "LB", "labels": ["QC", "stability"] },
  { "id": 6, "board": "QC Checklist", "title": "Verify viscosity result", "description": "Check viscosity meets spec 5000-7000 cP", "status": "In Progress", "assignee": "LB", "labels": ["QC"] },
  { "id": 7, "board": "QC Checklist", "title": "pH meter calibration", "description": "Calibrate pH meter before testing", "status": "Todo", "assignee": "LB", "labels": ["maintenance"] },
  { "id": 8, "board": "Procurement", "title": "Order packaging bottles", "description": "Order 5000 pcs bottle PET 100ml", "status": "Todo", "assignee": "PS", "labels": ["urgent", "procurement"] },
  { "id": 9, "board": "Procurement", "title": "Negotiate raw material price", "description": "Negotiate glycerin price with supplier", "status": "In Progress", "assignee": "PS", "labels": ["procurement"] },
  { "id": 10, "board": "Procurement", "title": "Confirm PO delivery date", "description": "Confirm delivery date for PO-005 with PT Indo Kimia", "status": "Done", "assignee": "PS", "labels": [] },
  { "id": 11, "board": "R&D Formulasi", "title": "Formulasi serum vitamin C", "description": "Develop new vitamin C serum formulation", "status": "Todo", "assignee": "FS", "labels": ["rnd", "new"] },
  { "id": 12, "board": "R&D Formulasi", "title": "Stability test week 4", "description": "Check week 4 stability for lotion formula", "status": "In Progress", "assignee": "FS", "labels": ["rnd", "stability"] },
  { "id": 13, "board": "Finance Closing", "title": "Monthly closing April", "description": "Prepare monthly financial closing report", "status": "Todo", "assignee": "IF", "labels": ["finance", "urgent"] },
  { "id": 14, "board": "Finance Closing", "title": "Reconcile bank statement", "description": "Match bank transactions with ledger", "status": "In Progress", "assignee": "IF", "labels": ["finance"] },
  { "id": 15, "board": "Finance Closing", "title": "Review AR aging report", "description": "Review accounts receivable aging", "status": "Review", "assignee": "IF", "labels": ["finance"] },
];

const COLUMNS = [
  { id: "Todo", label: "To-Do", color: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50" },
  { id: "In Progress", label: "In Progress", color: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
  { id: "Review", label: "Review", color: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50" },
  { id: "Done", label: "Done", color: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" }
];

export default function TodoListPrototype() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [activeBoard, setActiveBoard] = useState<any>(null);
  const [tasks, setTasks] = useState(STATIC_TASKS);

  const handleOpenBoard = (board: any) => {
    setActiveBoard(board);
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
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {STATIC_BOARDS.map((board, i) => (
                 <motion.div
                   key={board.nama}
                   variants={containerVariants}
                   onClick={() => handleOpenBoard(board)}
                   className="group cursor-pointer"
                 >
                    <Card className="rounded-[24px] border-none shadow-xl bg-white p-8 space-y-6 hover:shadow-2xl transition-all border-b-8 group-hover:-translate-y-2 duration-300" style={{ borderBottomColor: board.warna }}>
                       <div className="flex justify-between items-start">
                          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: board.warna }}>
                             <Layout className="h-6 w-6" />
                          </div>
                          <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase px-3 py-1">
                             {board.task_count} Tasks
                          </Badge>
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{board.nama}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Hub</p>
                       </div>
                       <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-black text-gray-600">AD</div>
                             <span className="text-[10px] font-black text-slate-400 uppercase">{board.dibuat_oleh}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{board.tanggal}</span>
                       </div>
                    </Card>
                 </motion.div>
               ))}
               <Card className="rounded-[24px] border-4 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center p-8 space-y-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                     <Plus className="h-8 w-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-all">Provision New Board</span>
               </Card>
             </div>

             {/* Table View */}
             <Card className="rounded-[24px] border-none shadow-2xl shadow-slate-200/30 overflow-hidden bg-white">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-900">Protocol <span className="text-blue-600">Directory</span></h3>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-500">
                      View: All Protocols
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="py-6 pl-10 text-table-header text-slate-400">Board Identity</TableHead>
                      <TableHead className="text-table-header text-slate-400">Task Density</TableHead>
                      <TableHead className="text-table-header text-slate-400">Authority</TableHead>
                      <TableHead className="text-table-header text-slate-400">Creation Date</TableHead>
                      <TableHead className="pr-10 text-table-header text-slate-400 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STATIC_BOARDS.map((board) => (
                      <TableRow key={board.nama} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-8 pl-10">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-10 rounded-full" style={{ backgroundColor: board.warna }} />
                            <span className="font-black text-slate-900 tracking-tight text-sm uppercase italic">{board.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 w-48">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full" style={{ backgroundColor: board.warna }} />
                             </div>
                             <span className="text-[10px] font-black text-slate-900 tabular-nums">{board.task_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <span className="text-[10px] font-black text-slate-900 uppercase italic underline decoration-slate-200 underline-offset-4">{board.dibuat_oleh}</span>
                        </TableCell>
                        <TableCell>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{board.tanggal}</span>
                        </TableCell>
                        <TableCell className="pr-10 text-right">
                          <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm">
                                <Eye className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10 h-full"
          >
             {/* Kanban Nav */}
             <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border-b-4 border-slate-900" style={{ borderBottomColor: activeBoard.warna }}>
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
                     <span className="text-xl font-black uppercase italic tracking-tighter text-slate-900">{activeBoard.nama}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400"><Filter className="h-5 w-5" /></Button>
                     <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400"><Settings className="h-5 w-5" /></Button>
                  </div>
               </div>
            </div>

            {/* Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start overflow-x-auto pb-10 min-h-[70vh]">
               {COLUMNS.map((col) => (
                 <div key={col.id} className="space-y-6 min-w-[300px]">
                    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: col.color }}>
                       <div className="flex items-center gap-3">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", col.text)}>{col.label}</span>
                          <Badge className={cn("bg-white border-none shadow-sm text-[10px] font-black", col.text)}>
                             {tasks.filter(t => t.status === col.id && (t.board === activeBoard.nama || t.board === "QC Checklist")).length}
                          </Badge>
                       </div>
                       <MoreHorizontal className="h-4 w-4 text-slate-300" />
                    </div>

                    <div className="space-y-4 min-h-[500px]">
                       {tasks.filter(t => t.status === col.id && (t.board === activeBoard.nama || t.board === "QC Checklist")).map((task) => (
                         <motion.div
                           key={task.id}
                           layoutId={String(task.id)}
                           className="group cursor-grab active:cursor-grabbing"
                         >
                            <Card className="rounded-[1.5rem] border-none shadow-md p-6 bg-white space-y-4 hover:shadow-xl transition-all border-l-2 border-transparent hover:border-blue-400">
                               <div className="flex justify-between items-start">
                                  <div className="flex flex-wrap gap-1">
                                     {task.labels.map(l => (
                                       <Badge key={l} className="bg-slate-50 text-slate-400 border-none font-black text-[7px] uppercase px-1.5 py-0.5">#{l}</Badge>
                                     ))}
                                  </div>
                                  <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-200 group-hover:text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent className="rounded-xl border-none shadow-2xl p-2 bg-white">
                                        <DropdownMenuItem className="rounded-lg h-10 px-4 font-black uppercase text-[9px] hover:bg-slate-50 cursor-pointer"><Edit3 className="mr-2 h-3 w-3" /> Edit Protocol</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-lg h-10 px-4 font-black uppercase text-[9px] hover:bg-rose-50 text-rose-600 cursor-pointer"><Trash2 className="mr-2 h-3 w-3" /> Terminate</DropdownMenuItem>
                                     </DropdownMenuContent>
                                  </DropdownMenu>
                               </div>

                               <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                                  {task.title}
                               </h4>
                               <p className="text-[10px] font-bold text-slate-400 line-clamp-2 uppercase leading-relaxed italic">
                                  {task.description}
                               </p>

                               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                     <Clock className="h-3 w-3 text-slate-300" />
                                     <span className="text-[8px] font-black text-slate-300 uppercase">24h left</span>
                                  </div>
                                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-black text-gray-600 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                     {task.assignee}
                                  </div>
                               </div>
                            </Card>
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
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex justify-between items-center px-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">System Engine: Live</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
               <Grab className="h-4 w-4 text-slate-400" />
               <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">D&D Protocols Active</span>
            </div>
         </div>
         <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">Nex Matrix Operational Intelligence Â© 2026</p>
      </motion.div>
    </TableShell>
  );
}
