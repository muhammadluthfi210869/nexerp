"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center shadow-xl shadow-red-100">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            System Interruption
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            A technical anomaly occurred while processing this module. Our engineers have been notified.
          </p>
          {error.digest && (
            <code className="block p-3 bg-slate-50 rounded-xl text-[10px] font-sans text-slate-400">
              Reference ID: {error.digest}
            </code>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={reset}
            className="w-full h-12 rounded-2xl bg-slate-900 font-bold tracking-tight shadow-lg shadow-slate-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            RETRY EXECUTION
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-2xl border-slate-200 font-bold text-slate-500"
            onClick={() => window.location.href = '/'}
          >
            <Home className="w-4 h-4 mr-2" />
            RETURN TO COMMAND CENTER
          </Button>
        </div>
      </div>
    </div>
  );
}

