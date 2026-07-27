import { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "NexERP | Institutional Control Hub",
  description:
    "Next-Generation Enterprise Resource Planning — Secure login for NexERP by Nex Systems. Akses manajemen produksi, marketing, dan operasional dalam satu platform.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white mb-2">
            <img src="/nexerp-logo.jpeg" alt="NexERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
              NEX <span className="text-primary font-bold">ERP</span>
            </h1>
            <p className="text-slate-400 font-bold tracking-[0.3em] text-[10px] uppercase">
              Institutional Control Hub
            </p>
          </div>
        </div>

        {/* Server-rendered heading for SEO */}
        <div className="sr-only">
          <h2>NexERP Login — Enterprise Resource Planning System</h2>
          <p>
            NexERP adalah platform ERP modern untuk mengelola operasi bisnis,
            produksi R&amp;D, marketing, dan人力资源 secara terintegrasi.
            Dikembangkan oleh Nex Systems.
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-[11px] font-medium text-slate-400 tracking-tight uppercase">
          Powered by Nex Systems &bull; V9.0
        </p>
      </div>
    </div>
  );
}

