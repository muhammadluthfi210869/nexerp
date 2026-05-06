"use client";

import { useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  return { user, loading, hasRole };
}

