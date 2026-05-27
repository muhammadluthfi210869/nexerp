import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-black text-sm uppercase text-slate-900 mb-1">{title}</h3>
      <p className="text-xs font-medium text-slate-400 text-center max-w-xs mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
