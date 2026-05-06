"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";

// Modular Components
import { CreativeBoardHeader } from "./components/CreativeBoardHeader";
import { KanbanBoard } from "./components/KanbanBoard";
import { DesignHubDrawer } from "./components/DesignHubDrawer";
import { CreateDesignTaskModal } from "./components/CreateDesignTaskModal";

export default function CreativeBoardClient({ initialTasks }: any) {
  usePerformanceAudit("Creative Board");
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SSE Listener for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/events/creative`);
    
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'creative_update') {
        toast.info(`Project Update: Task ${payload.data.taskId} moved to ${payload.data.state}`);
        queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      }
    };

    return () => eventSource.close();
  }, [queryClient]);

  // Queries
  const { data: tasks = [] } = useQuery({
    queryKey: ["creative-board"],
    queryFn: () => api.get("/creative/board").then((res) => res.data),
    initialData: initialTasks,
    refetchInterval: 10000, 
  });

  // Mutations
  const { mutate: apjReview } = useMutation({
    mutationFn: (data: any) => api.patch(`/creative/task/${data.id}/apj-review`, data.dto),
    onSuccess: () => {
      toast.success("Design reviewed and signed!");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Review failed"),
  });

  const { mutate: submitToApj } = useMutation({
    mutationFn: (id: string) => api.patch(`/creative/task/${id}/submit`),
    onSuccess: () => {
      toast.success("Task submitted to Legal/APJ.");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Submission failed"),
  });

  const { mutate: clientReview } = useMutation({
    mutationFn: (data: any) => api.patch(`/creative/task/${data.id}/client-review`, data.dto),
    onSuccess: () => {
      toast.success("Client feedback recorded.");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Action failed"),
  });

  const { mutate: createTaskMutation } = useMutation({
    mutationFn: (dto: any) => api.post(`/creative/task`, dto),
    onSuccess: () => {
      toast.success("New Project Initialized!");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error("Failed to create project"),
  });

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleAction = (action: string, data?: any) => {
    if (action === 'APJ_REVIEW') {
      const pin = prompt("Enter 6-Digit Approval PIN:");
      if (!pin) return;
      apjReview({
        id: selectedTask.id,
        dto: {
          status: 'APPROVED',
          notes: "Artwork follows branding guidelines & BPOM specs.",
          authorId: "temp-user-id",
          pin,
        }
      });
    }

    if (action === 'SUBMIT_APJ') submitToApj(selectedTask.id);
    if (action === 'CLIENT_REVIEW') {
      clientReview({
        id: selectedTask.id,
        dto: { status: 'APPROVED' }
      });
    }
  };

  return (
    <div className="p-10 bg-slate-50/50 min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
           <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-brand-black rounded-2xl shadow-xl shadow-slate-200">
                 <Palette className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                CREATIVE <span className="text-primary">HUB</span>
              </h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.4em] px-1">
             Packaging Design & Artwork Lifecycle Management
           </p>
        </div>
        
        <div className="flex gap-4">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search Project / Brand..." 
                className="h-14 w-80 pl-14 pr-6 rounded-2xl bg-white border-none shadow-sm font-bold text-slate-900 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20"
              />
           </div>
           <Button 
             className="h-14 px-8 rounded-2xl bg-brand-black hover:bg-indigo-600 text-white font-bold gap-3 shadow-xl shadow-indigo-100 transition-all uppercase text-xs tracking-widest"
             onClick={() => setIsModalOpen(true)}
           >
              <Plus className="w-5 h-5 text-primary" /> New Project
           </Button>
        </div>
      </header>

      <CreativeBoardHeader tasks={tasks} />
      <KanbanBoard tasks={tasks} onTaskClick={handleTaskClick} />

      <CreateDesignTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={(data) => createTaskMutation(data)}
      />

      <DesignHubDrawer 
        task={selectedTask} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onAction={handleAction}
      />
    </div>
  );
}

