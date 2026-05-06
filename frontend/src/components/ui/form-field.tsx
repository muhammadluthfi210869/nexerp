"use client";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1"
      >
        {label}
        {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] font-bold text-rose-500 ml-1" role="alert">{error}</p>
      )}
    </div>
  );
}

