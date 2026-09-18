import type { ReactNode } from "react";
import { ModuleHeader, type ModuleHeaderProps } from "./ModuleHeader";

export interface BaseShellProps extends ModuleHeaderProps {
  children: ReactNode;
  className?: string;
}

export function BaseShell({
  title,
  titleAccent,
  subtitle,
  actions,
  children,
  className,
}: BaseShellProps) {
  return (
    <div className={`min-h-[calc(100vh-var(--page-py)-var(--page-pb))] ${className ?? ""}`.trim()}>
      <ModuleHeader
        title={title}
        titleAccent={titleAccent}
        subtitle={subtitle}
        actions={actions}
      />
      {children}
    </div>
  );
}

export type { ModuleHeaderProps, ReactNode };
