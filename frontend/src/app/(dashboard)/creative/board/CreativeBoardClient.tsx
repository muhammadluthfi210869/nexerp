"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Plus, 
  Search
} from "lucide-react";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaButton, DnaInput } from "@/components/dna";

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
  const [searchQuery, setSearchQuery] = useState("");

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
    queryFn: () =>
      api.get("/creative/board").then((res) => {
        const body = res.data;
        return Array.isArray(body) ? body : (body.data ?? []);
      }),
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

  const { mutate: uploadVersionMutation } = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.patch(`/creative/task/${id}/version`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("New version uploaded!");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Upload failed"),
  });

  const { mutate: unlockMutation } = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) =>
      api.patch(`/creative/task/${id}/unlock`, dto),
    onSuccess: () => {
      toast.success("Task unlocked!");
      queryClient.invalidateQueries({ queryKey: ["creative-board"] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Unlock failed"),
  });

  const handleAction = (action: string, data?: any) => {
    if (action === 'APJ_REVIEW') {
      const pin = prompt("Enter 6-Digit Approval PIN:");
      if (!pin) return;
      const status = data?.status || 'APPROVED';
      const notes = data?.notes || '';
      apjReview({
        id: selectedTask.id,
        dto: { status, notes, pin },
      });
    }

    if (action === 'SUBMIT_APJ') submitToApj(selectedTask.id);
    if (action === 'CLIENT_REVIEW') {
      clientReview({
        id: selectedTask.id,
        dto: { status: data?.status || 'APPROVED', notes: data?.notes || '' },
      });
    }
    if (action === 'UPLOAD') {
      const formData = new FormData();
      if (data?.artwork) formData.append("artwork", data.artwork);
      if (data?.mockup) formData.append("mockup", data.mockup);
      if (data?.printSpecs) formData.append("printSpecs", JSON.stringify(data.printSpecs));
      uploadVersionMutation({ id: selectedTask.id, formData });
    }
    if (action === 'UNLOCK') {
      unlockMutation({
        id: selectedTask.id,
        dto: { action: data?.action || 'WAIVE', managerPin: data?.managerPin },
      });
    }
  };

  const filteredTasks = tasks.filter((task: any) => {
    const brandName = task.lead?.brandName?.toLowerCase() || "";
    const clientName = task.lead?.clientName?.toLowerCase() || "";
    const brief = task.brief?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return brandName.includes(query) || clientName.includes(query) || brief.includes(query);
  });

  return (
    <DashboardShell
      title="Creative"
      titleAccent="Hub"
      subtitle="Packaging Design & Artwork Lifecycle Management"
      actions={
        <div className="flex gap-4">
           <DnaInput
             placeholder="Search Project / Brand..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             icon={<Search />}
             className="w-64"
           />
           <DnaButton 
             variant="secondary"
             size="md"
             icon={<Plus />}
             onClick={() => setIsModalOpen(true)}
           >
              New Project
           </DnaButton>
        </div>
      }
    >
      <CreativeBoardHeader tasks={filteredTasks} />
      <KanbanBoard tasks={filteredTasks} onTaskClick={handleTaskClick} />

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
    </DashboardShell>
  );
}
