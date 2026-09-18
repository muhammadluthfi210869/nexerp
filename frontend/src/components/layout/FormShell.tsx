import type { ReactNode } from "react";
import { BaseShell, ShellContent, type ModuleHeaderProps } from "./BaseShell";

export interface FormShellProps extends ModuleHeaderProps {
  sidebar?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Shell template for ALL input/form pages.
 * Enforces a 2/3 + 1/3 split layout with consistent spacing.
 * Right sidebar is sticky for action panels.
 */
export function FormShell({
  sidebar,
  fullWidth = false,
  children,
  ...formProps
}: FormShellProps) {
  return (
    <BaseShell {...formProps}>
      {sidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ShellContent className="lg:col-span-2">
            {children}
          </ShellContent>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 flex flex-col gap-4">
              {sidebar}
            </div>
          </div>
        </div>
      ) : (
        <ShellContent className={fullWidth ? "w-full" : "max-w-4xl"}>
          {children}
        </ShellContent>
      )}
    </BaseShell>
  );
}
