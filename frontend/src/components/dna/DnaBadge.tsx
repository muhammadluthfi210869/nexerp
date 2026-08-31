"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge as CanonicalStatusBadge, StatusVariant } from "@/components/canonical";

type BadgeStatus = "success" | "info" | "warning" | "critical" | "purple" | "default";

interface DnaBadgeProps {
  status?: BadgeStatus;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const STATUS_MAP: Record<BadgeStatus, StatusVariant> = {
  success: "success",
  info: "info",
  warning: "warning",
  critical: "destructive",
  purple: "info",
  default: "default",
};

/**
 * Canonical-aligned DnaBadge. Wraps canonical StatusBadge.
 * Maps legacy `status` prop to canonical variant.
 */
export function DnaBadge({ status = "default", children, className, onClick }: DnaBadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center rounded-md transition-opacity hover:opacity-80",
          className,
        )}
      >
        <CanonicalStatusBadge variant={STATUS_MAP[status]}>
          {children}
        </CanonicalStatusBadge>
      </button>
    );
  }
  return (
    <CanonicalStatusBadge variant={STATUS_MAP[status]} className={className}>
      {children}
    </CanonicalStatusBadge>
  );
}
