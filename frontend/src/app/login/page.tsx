"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── PROTOTYPE MODE ─────────────────────────────────────────────
// Aktif dengan NEXT_PUBLIC_PROTOTYPE_MODE=true (lihat .env.local).
// Akun khusus demo: superadmin@nexerp.id / password123
// Login ini TIDAK hit backend — langsung masuk sebagai SUPER_ADMIN
// dengan akses ke SEMUA modul, memakai data contoh (mock-data.ts).
const IS_PROTOTYPE_MODE =
  process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true" ||
  (typeof window !== "undefined" &&
    window.location.hostname === "demo.nexerp.id");
const PROTOTYPE_EMAIL = "superadmin@nexerp.id";
const PROTOTYPE_PASSWORD = "password123";

const PROTOTYPE_ROLES = [
  "SUPER_ADMIN",
  "HEAD_OPS",
  "EXECUTIVE",
  "MARKETING",
  "BUSSDEV",
  "FINANCE",
  "RND",
  "SCM",
  "WAREHOUSE",
  "PRODUCTION",
  "QC",
  "HR",
  "LEGALITY",
  "LOGISTICS",
  "CREATIVE",
  "MASTER",
  "SYSTEM",
];

type LoginResponseUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      let response: { data: { access_token: string; user: LoginResponseUser } };

      if (
        IS_PROTOTYPE_MODE &&
        data.email.toLowerCase() === PROTOTYPE_EMAIL &&
        data.password === PROTOTYPE_PASSWORD
      ) {
        // Prototype login — tanpa backend.
        response = {
          data: {
            access_token: `prototype.${Date.now()}.${Math.random().toString(36).slice(2)}`,
            user: {
              id: "prototype-superadmin",
              email: PROTOTYPE_EMAIL,
              fullName: "Super Admin (Prototype)",
              roles: PROTOTYPE_ROLES,
            },
          },
        };
      } else {
        response = await api.post("/auth/login", data);
      }

      const { access_token, user } = response.data;

      // Store token securely for client-side usage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));

        // Sync with Middleware (cookie-based auth)
        document.cookie = `token=${access_token}; path=/; max-age=86400; SameSite=Lax;`;

        // Force cookie to be set before navigation
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      toast.success(`Welcome back, ${user.fullName || user.email}!`);

      // Unified redirect — all users go to executive dashboard
      window.location.href = "/executive/dashboard";
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white mb-2">
            <img src="/nexerp-logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
               NEX <span className="text-primary font-bold">ERP</span>
             </h1>
             <p className="text-slate-400 font-bold tracking-[0.3em] text-[10px] uppercase">Institutional Control Hub</p>
          </div>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border border-slate-200 text-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_24px_56px_-12px_rgba(0,0,0,0.08)]">
          <CardHeader className="space-y-1 pt-12 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-xs">
              Secure authentication for authorized personnel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-4 px-10">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-slate-500 font-bold text-[10px] uppercase tracking-wider ml-1">Corporate Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@Nex.com"
                  className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary/50 rounded-2xl h-14 font-medium transition-all"
                  {...register("email")}
                />
                {errors.email?.message && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 ml-1">{String(errors.email.message)}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                   <Label htmlFor="password" title="Password" className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Secret Key</Label>
                   <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Forgot?</button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-primary/20 focus:border-primary/50 rounded-2xl h-14 transition-all"
                  {...register("password")}
                />
                {errors.password?.message && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-1 ml-1">{String(errors.password.message)}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pb-12 pt-10 px-10">
              <Button
                type="submit"
                className="w-full bg-primary text-white hover:bg-primary/90 h-14 rounded-2xl font-bold tracking-tight text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-none"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Initialize Session"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {IS_PROTOTYPE_MODE && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-center shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">
              ⚡ Prototype Mode — Data Contoh
            </p>
            <p className="mt-1 text-[11px] font-bold text-amber-800">
              Demo: <span className="font-mono">{PROTOTYPE_EMAIL}</span> ·{" "}
              <span className="font-mono">{PROTOTYPE_PASSWORD}</span>
            </p>
            <p className="mt-0.5 text-[9px] font-medium text-amber-600">
              Bukan data operasional — hanya untuk presentasi / demo
            </p>
          </div>
        )}

        <p className="text-center text-[11px] font-medium text-slate-400 tracking-tight uppercase">
          Powered by Nex Systems • V9.0
        </p>
      </div>
    </div>
  );
}

