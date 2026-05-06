import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
      <div className="flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          <div
            className="w-24 h-24 border-2 border-slate-100 rounded-[2rem]"
            style={{ animation: "spin 4s linear infinite" }}
          />
          <div
            className="absolute w-24 h-24 border-t-2 border-brand-black rounded-[2rem]"
            style={{ animation: "spin 1.5s ease-in-out infinite" }}
          />
          <div className="absolute w-14 h-14 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white bg-white">
            <img src="/N letter logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <p
            className="text-[11px] font-black text-brand-black tracking-[0.5em] uppercase italic"
            style={{ animation: "pulse-opacity 1s ease-in-out infinite alternate" }}
          >
            Synchronizing
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
            Accessing Tactical Matrix
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse-opacity { 0% { opacity: 0.3; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}
