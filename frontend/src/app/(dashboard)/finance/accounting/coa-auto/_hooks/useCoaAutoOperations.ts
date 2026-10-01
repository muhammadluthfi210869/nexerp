import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import { useDnaToast } from "@/components/dna";
import {
  CoaAutoRule,
  CoaAutoKpis,
  STANDARD_TRANSACTION_TYPES,
} from "../_types/coa-auto.types";

export function useCoaAutoOperations() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useDnaToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocFilter, setSelectedDocFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CoaAutoRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<CoaAutoRule | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDocType, setFormDocType] = useState("FAKTUR_PENJUALAN_PIUTANG");
  const [formCustomDocType, setFormCustomDocType] = useState("");
  const [formDebit, setFormDebit] = useState("");
  const [formCredit, setFormCredit] = useState("");

  // 1. Fetch live COA accounts
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/accounts");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch live auto-journal configs
  const { data: rawConfigs = [] } = useQuery<any[]>({
    queryKey: ["finance-auto-journal-configs"],
    queryFn: async () => {
      try {
        const res = await api.get("/finance/auto-journal-configs");
        const body = unwrapResponse<any[]>(res);
        return Array.isArray(body) ? body : [];
      } catch {
        return [];
      }
    },
  });

  const rules: CoaAutoRule[] = useMemo(() => {
    return rawConfigs.map((cfg: any) => {
      const debitAcc = accounts.find((a: any) => a.id === cfg.coaDebetId || a.code === cfg.coaDebetId);
      const creditAcc = accounts.find((a: any) => a.id === cfg.coaCreditId || a.code === cfg.coaCreditId);
      return {
        id: cfg.transactionType,
        ruleName: cfg.description || `Auto Journal: ${cfg.transactionType}`,
        transactionType: cfg.transactionType,
        documentType: cfg.transactionType,
        condition: "Semua Transaksi",
        debitAccount: debitAcc ? `${debitAcc.code} â€” ${debitAcc.name}` : (cfg.coaDebetId || "-"),
        creditAccount: creditAcc ? `${creditAcc.code} â€” ${creditAcc.name}` : (cfg.coaCreditId || "-"),
        coaDebetId: cfg.coaDebetId || (debitAcc ? debitAcc.id : ""),
        coaCreditId: cfg.coaCreditId || (creditAcc ? creditAcc.id : ""),
        isActive: true,
        notes: `Aturan database untuk ${cfg.transactionType}`,
      };
    });
  }, [rawConfigs, accounts]);

  const kpis: CoaAutoKpis = useMemo(() => {
    return {
      totalActiveRules: rules.filter((r) => r.isActive).length,
      integratedDocumentsCount: new Set(rules.map((r) => r.documentType)).size,
      mappedAccountsCount: accounts.length,
      doubleEntryEngineRate: "100%",
    };
  }, [rules, accounts]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchSearch =
        r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.transactionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.debitAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.creditAccount.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDoc = selectedDocFilter === "ALL" || r.documentType === selectedDocFilter;
      return matchSearch && matchDoc;
    });
  }, [rules, searchQuery, selectedDocFilter]);

  const accountOptions = useMemo(() => {
    return accounts.map((a: any) => ({
      value: a.id,
      label: `${a.code} â€” ${a.name} (${a.type})`,
    }));
  }, [accounts]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormName("");
    setFormDocType(STANDARD_TRANSACTION_TYPES[0].value);
    setFormCustomDocType("");
    setFormDebit(accounts[0]?.id || "");
    setFormCredit(accounts[1]?.id || accounts[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: CoaAutoRule) => {
    setEditingRule(rule);
    setFormName(rule.ruleName);
    const isStandard = STANDARD_TRANSACTION_TYPES.some((s) => s.value === rule.transactionType);
    if (isStandard) {
      setFormDocType(rule.transactionType);
      setFormCustomDocType("");
    } else {
      setFormDocType("CUSTOM");
      setFormCustomDocType(rule.transactionType);
    }
    setFormDebit(rule.coaDebetId);
    setFormCredit(rule.coaCreditId);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreate();
    }
  }, [searchParams]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const targetType = formDocType === "CUSTOM" ? formCustomDocType.trim().toUpperCase() : formDocType;
      return api.post("/finance/auto-journal-configs", {
        transactionType: targetType,
        coaDebetId: formDebit,
        coaCreditId: formCredit,
        description: formName,
      });
    },
    onSuccess: () => {
      toast.success("Rule Disimpan", `Aturan auto-posting '${formName}' berhasil disimpan ke database.`);
      qc.invalidateQueries({ queryKey: ["finance-auto-journal-configs"] });
      setIsModalOpen(false);
      setEditingRule(null);
      if (searchParams.get("action") === "create") {
        router.replace("/finance/accounting/coa-auto");
      }
    },
    onError: (err: any) => {
      toast.error("Gagal", err?.response?.data?.message || "Gagal menyimpan aturan jurnal");
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return api.post("/finance/auto-journal-configs/seed");
    },
    onSuccess: () => {
      toast.success("Berhasil Inisialisasi", "12 Aturan Standar G-SERP berhasil di-seed ke database.");
      qc.invalidateQueries({ queryKey: ["finance-auto-journal-configs"] });
    },
    onError: (err: any) => {
      toast.error("Gagal Inisialisasi", err?.response?.data?.message || "Gagal inisialisasi aturan standar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionType: string) => {
      return api.delete(`/finance/auto-journal-configs/${transactionType}`);
    },
    onSuccess: () => {
      toast.success("Berhasil Dihapus", "Aturan auto-journal berhasil dihapus.");
      qc.invalidateQueries({ queryKey: ["finance-auto-journal-configs"] });
      setRuleToDelete(null);
    },
    onError: (err: any) => {
      toast.error("Gagal Hapus", err?.response?.data?.message || "Gagal menghapus aturan");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Validasi Gagal", "Nama Rule wajib diisi.");
      return;
    }
    const targetType = formDocType === "CUSTOM" ? formCustomDocType.trim() : formDocType;
    if (!targetType) {
      toast.error("Validasi Gagal", "Kode Transaksi wajib dipilih atau diisi.");
      return;
    }
    if (!formDebit || !formCredit) {
      toast.error("Validasi Gagal", "Akun Debit dan Akun Kredit wajib dipilih.");
      return;
    }
    saveMutation.mutate();
  };

  const handleDeleteConfirm = () => {
    if (ruleToDelete) {
      deleteMutation.mutate(ruleToDelete.transactionType);
    }
  };

  return {
    searchParams,
    router,
    toast,
    qc,
    searchQuery,
    setSearchQuery,
    selectedDocFilter,
    setSelectedDocFilter,
    isModalOpen,
    setIsModalOpen,
    editingRule,
    setEditingRule,
    ruleToDelete,
    setRuleToDelete,
    formName,
    setFormName,
    formDocType,
    setFormDocType,
    formCustomDocType,
    setFormCustomDocType,
    formDebit,
    setFormDebit,
    formCredit,
    setFormCredit,
    accounts,
    rules,
    kpis,
    filteredRules,
    accountOptions,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleDeleteConfirm,
    saveMutation,
    seedMutation,
    deleteMutation,
  };
}
