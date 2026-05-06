"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback(async (opts?: ConfirmOptions): Promise<boolean> => {
    setOptions(opts || {});
    setIsOpen(true);
    return new Promise((res) => setResolve(() => res));
  }, []);

  const handleConfirm = useCallback(() => {
    resolve?.(true);
    setIsOpen(false);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    resolve?.(false);
    setIsOpen(false);
  }, [resolve]);

  return { confirm, handleConfirm, handleCancel, isOpen, options };
}

