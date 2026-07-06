"use client";

import { useEffect } from "react";
import { initErrorListeners } from "@/lib/error-listener";

export function ErrorListenerInit() {
  useEffect(() => {
    initErrorListeners();
  }, []);
  return null;
}
