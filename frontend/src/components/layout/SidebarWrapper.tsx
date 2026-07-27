"use client";

import { Sidebar } from "@/components/layout/Sidebar";

type SidebarWrapperProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function SidebarWrapper({ isOpen, onClose }: SidebarWrapperProps) {
  return <Sidebar isOpen={isOpen} onClose={onClose} />;
}
