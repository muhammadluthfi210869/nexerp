"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Edit3,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
type NormalBalance = "DEBIT" | "CREDIT";

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId: string | null;
  isActive: boolean;
  children?: Account[];
}

const ACCOUNT_TYPES: { value: AccountType; label: string; color: string }[] = [
  { value: "ASSET", label: "Asset", color: "text-blue-600" },
  { value: "LIABILITY", label: "Liability", color: "text-rose-600" },
  { value: "EQUITY", label: "Equity", color: "text-purple-600" },
  { value: "REVENUE", label: "Revenue", color: "text-emerald-600" },
  { value: "EXPENSE", label: "Expense", color: "text-amber-600" },
];

function buildTree(items: Account[]): Account[] {
  const map: Record<string, Account> = {};
  const tree: Account[] = [];

  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  items.forEach((item) => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children!.push(map[item.id]);
    } else {
      tree.push(map[item.id]);
    }
  });

  return tree;
}

function getTypeBadge(type: AccountType) {
  switch (type) {
    case "ASSET": return "info";
    case "LIABILITY": return "critical";
    case "EQUITY": return "purple";
    case "REVENUE": return "success";
    case "EXPENSE": return "warning";
    default: return "default";
  }
}

function AccountRow({
  account,
  level = 0,
  onEdit,
}: {
  account: Account;
  level?: number;
  onEdit: (acc: Account) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <>
      <TableRow
        className={cn(
          "group transition-all duration-300 border-b border-slate-50",
          level === 0 ? "bg-slate-50/50" : "hover:bg-slate-50/30"
        )}
      >
        <TableCell className="py-3 pl-6">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-5 w-5 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center text-[8px] font-black",
              level === 0
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-400"
            )}>
              {account.code.substring(0, 3)}
            </div>
            <span className={cn(
              "font-black tracking-tight text-xs uppercase",
              level === 0 ? "text-slate-900" : "text-slate-700"
            )}>
              {account.code}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <span className={cn(
            "font-medium text-xs uppercase",
            level === 0 ? "font-black text-slate-900" : "text-slate-700"
          )}>
            {account.name}
          </span>
        </TableCell>
        <TableCell className="py-3 text-center">
          <DnaBadge status={getTypeBadge(account.type) as any}>
            {account.type}
          </DnaBadge>
        </TableCell>
        <TableCell className="py-3 text-center">
          <span className={cn(
            "text-[10px] font-black uppercase",
            account.normalBalance === "DEBIT" ? "text-blue-600" : "text-rose-600"
          )}>
            {account.normalBalance}
          </span>
        </TableCell>
        <TableCell className="py-3 text-center">
          <DnaBadge status={account.isActive ? "success" : "default"}>
            {account.isActive ? "ACTIVE" : "INACTIVE"}
          </DnaBadge>
        </TableCell>
        <TableCell className="py-3 pr-6 text-right">
          <DnaButton
            variant="ghost"
            size="sm"
            icon={<Edit3 />}
            onClick={() => onEdit(account)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </TableCell>
      </TableRow>
      {isOpen &&
        hasChildren &&
        account.children?.map((child) => (
          <AccountRow
            key={child.id}
            account={child}
            level={level + 1}
            onEdit={onEdit}
          />
        ))}
    </>
  );
}

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("ASSET");
  const [formNormalBalance, setFormNormalBalance] = useState<NormalBalance>("DEBIT");
  const [formParentId, setFormParentId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: accounts, isLoading, isError } = useQuery<Account[]>({
    queryKey: ["finance-accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/finance/accounts", data);
    },
    onSuccess: () => {
      toast.success("Akun berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      resetForm();
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal menambahkan akun");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return api.patch(`/finance/accounts/${id}`, data);
    },
    onSuccess: () => {
      toast.success("Akun berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["finance-accounts"] });
      resetForm();
      setIsModalOpen(false);
      setEditingAccount(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal memperbarui akun");
    },
  });

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormType("ASSET");
    setFormNormalBalance("DEBIT");
    setFormParentId("");
    setFormIsActive(true);
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormCode(acc.code);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormNormalBalance(acc.normalBalance);
    setFormParentId(acc.parentId || "");
    setFormIsActive(acc.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      code: formCode,
      name: formName,
      type: formType,
      normalBalance: formNormalBalance,
      parentId: formParentId || null,
      isActive: formIsActive,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const treeData = accounts ? buildTree(accounts) : [];
  const flatList = accounts || [];

  const filteredTree = searchTerm
    ? flatList.filter(
        (a) =>
          a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : treeData;

  const totalAccounts = accounts?.length || 0;
  const activeAccounts = accounts?.filter((a) => a.isActive).length || 0;
  const assetCount = accounts?.filter((a) => a.type === "ASSET").length || 0;
  const revenueCount = accounts?.filter((a) => a.type === "REVENUE").length || 0;

  return (
    <DashboardShell
      title="Chart of"
      titleAccent="Accounts"
      subtitle="Manajemen struktur akun & kode rekening pusat"
      actions={
        <div className="flex gap-3">
          <DnaButton
            variant="primary"
            onClick={() => {
              resetForm();
              setEditingAccount(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Tambah Akun
          </DnaButton>
        </div>
      }
    >
      {isLoading ? (
        <QueryLoading message="Memuat data akun..." />
      ) : isError ? (
        <QueryError error="Gagal memuat data akun" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<Layers className="text-blue-600" />} label="Total Akun" value={totalAccounts} />
            <StatCard icon={<Hash className="text-emerald-600" />} label="Akun Aktif" value={activeAccounts} />
            <StatCard icon={<Wallet className="text-blue-500" />} label="Total Asset" value={assetCount} />
            <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Total Revenue" value={revenueCount} />
          </div>

          <TableWrapper
            filters={
              <div className="flex items-center gap-3 w-full justify-between">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    Struktur Akun
                  </h3>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                    Hierarki kode rekening • {totalAccounts} Akun
                  </p>
                </div>
                <div className="relative w-64">
                  <DnaInput
                    icon={<Search className="h-4 w-4" />}
                    placeholder="Cari kode / nama akun..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Kode
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Nama Akun
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">
                    Tipe
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">
                    Normal Balance
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">
                    Status
                  </TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(searchTerm ? filteredTree : filteredTree).map((acc) => (
                  <AccountRow key={acc.id} account={acc} onEdit={handleEdit} />
                ))}
                {filteredTree.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Layers className="h-12 w-12 text-slate-200 mb-3" />
                        <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">
                          Tidak Ada Akun Ditemukan
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                          Mulai tambahkan akun baru
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}

      {/* ADD / EDIT MODAL */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(o) => {
          setIsModalOpen(o);
          if (!o) {
            resetForm();
            setEditingAccount(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-none shadow-sm p-0 overflow-hidden">
          <div className="p-8 bg-blue-600 text-white relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">
              {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
            </DialogTitle>
            <DialogDescription className="text-white/70 font-medium uppercase text-[9px] tracking-tight mt-2">
              {editingAccount ? "Perbarui data akun" : "Definisikan akun baru dalam Chart of Accounts"}
            </DialogDescription>
            <Layers className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 opacity-30 text-white" />
          </div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Kode Akun
                </Label>
                <DnaInput
                  placeholder="11100"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Nama Akun
                </Label>
                <DnaInput
                  placeholder="Kas Besar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border-2 border-slate-50 bg-slate-50 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Tipe Akun
                </Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as AccountType)}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="font-medium text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Normal Balance
                </Label>
                <Select
                  value={formNormalBalance}
                  onValueChange={(v) => setFormNormalBalance(v as NormalBalance)}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                    <SelectValue placeholder="Pilih normal balance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT" className="font-medium text-xs">
                      Debit
                    </SelectItem>
                    <SelectItem value="CREDIT" className="font-medium text-xs">
                      Kredit
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Akun Induk
                </Label>
                <Select value={formParentId} onValueChange={(v) => setFormParentId(v ?? "")}>
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                    <SelectValue placeholder="Tanpa induk (Root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-medium text-xs">
                      — Root Account —
                    </SelectItem>
                    {flatList.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="font-medium text-xs">
                        {a.code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-tight text-slate-400 pl-1">
                  Status
                </Label>
                <Select
                  value={formIsActive ? "active" : "inactive"}
                  onValueChange={(v) => setFormIsActive(v === "active")}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="font-medium text-xs">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="font-medium text-xs">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <DnaButton
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                  setEditingAccount(null);
                }}
              >
                Batal
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={handleSubmit}
                disabled={!formCode || !formName}
                className="flex-1"
              >
                {editingAccount ? "Simpan Perubahan" : "Tambah Akun"}
              </DnaButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
