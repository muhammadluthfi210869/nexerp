"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.includes("@") || password.length < 6) {
      toast.error("Email atau password belum valid.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));
        document.cookie = `token=${access_token}; path=/; max-age=86400; SameSite=Lax;`;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      toast.success(`Welcome back, ${user.fullName || user.email}!`);

      const roleRedirect = (roles: string[]): string => {
        if (roles.some((r) => ["RND", "SUPER_ADMIN", "HEAD_OPS"].includes(r)))
          return "/rnd/analytics";
        if (roles.some((r) => ["DIGIMAR", "MARKETING"].includes(r)))
          return "/marketing/management-task";
        return "/rnd/analytics";
      };
      router.push(roleRedirect(user.roles || []));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Login failed. Check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-xl border border-slate-200 text-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_24px_56px_-12px_rgba(0,0,0,0.08)]">
      <CardHeader className="space-y-1 pt-12 pb-6 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In
        </CardTitle>
        <CardDescription className="text-slate-500 font-medium text-xs">
          Secure authentication for authorized personnel
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6 pt-4 px-10">
          <div className="space-y-2.5">
            <Label
              htmlFor="email"
              className="text-slate-500 font-bold text-[10px] uppercase tracking-wider ml-1"
            >
              Corporate Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@nexerp.com"
              className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary/50 rounded-2xl h-14 font-medium transition-all"
            />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <Label
                htmlFor="password"
                title="Password"
                className="text-slate-500 font-bold text-[10px] uppercase tracking-wider"
              >
                Secret Key
              </Label>
              <button
                type="button"
                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
              >
                Forgot?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="border-slate-200 bg-slate-50/50 text-slate-900 focus:ring-primary/20 focus:border-primary/50 rounded-2xl h-14 transition-all"
            />
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
  );
}
