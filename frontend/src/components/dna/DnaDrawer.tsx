"use client";

import React from "react";
import { DnaModal, type DnaModalSize } from "./DnaModal";

export interface DnaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string | React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  size?: DnaModalSize;
  footer?: React.ReactNode;
}

/**
 * Visual DNA Window Input & Detail Inspector.
 * Standardized to Centered Floating Window (Float Window di Tengah)
 * to maintain visual comfort, eliminate cramped side-sheet clipping, and provide consistent ERP experience.
 */
export function DnaDrawer({
  isOpen,
  onClose,
  title,
  badge,
  subtitle,
  children,
  className,
  size = "xl",
  footer,
}: DnaDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={badge}
      size={size}
      className={className}
      footer={footer}
    >
      {children}
    </DnaModal>
  );
}
