"use client";

import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md space-y-10 relative z-10 text-center">
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white mb-2">
            <Image src="/nexerp-logo.jpeg" alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              NEX <span className="text-primary font-bold">ERP</span>
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-[120px] font-black text-slate-100 leading-none">404</div>
          <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
          <p className="text-slate-500 text-sm">
            The requested resource could not be located within the system.
          </p>
          <Link
            href="/executive/dashboard"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90"
          >
            Return to Command Center
          </Link>
        </div>

        <p className="text-center text-[11px] font-medium text-slate-400 tracking-tight uppercase">
          Powered by Nex Systems &bull; V9.0
        </p>
      </div>
    </div>
  );
}
