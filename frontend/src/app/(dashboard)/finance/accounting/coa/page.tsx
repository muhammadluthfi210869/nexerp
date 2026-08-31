"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
 DialogHeader,
 DialogFooter,
} from "@/components/ui/dialog";
import {
 Plus,
 ChevronRight,
 ChevronDown,
 Layers,
 Wallet,
 TrendingUp,
 Hash,
 Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
 OperationalPageShell,
 OperationalDataTable,
 OperationalPanel,
 OperationalMetricGrid,
 OperationalMetricCard,
 OperationalField,
 OperationalButton,
 OperationalInput,
} from "@/components/operational";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { formatOperationalNumber } from "@/lib/operational-formatters";

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

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
 { value: "ASSET", label: "Asset" },
 { value: "LIABILITY", label: "Liability" },
 { value: "EQUITY", label: "Equity" },
 { value: "REVENUE", label: "Revenue" },
 { value: "EXPENSE", label: "Expense" },
];

const TYPE_TONE: Record<AccountType, "info" | "danger" | "purple" | "success" | "warning"> = {
 ASSET: "info",
 LIABILITY: "danger",
 EQUITY: "purple",
 REVENUE: "success",
 EXPENSE: "warning",
};

interface FlatAccount extends Account {
 level: number;
 hasChildren: boolean;
 childCount: number;
}

function flattenTree(items: Account[], level = 0, parentMap: Map<string, Account[]>): FlatAccount[] {
 const result: FlatAccount[] = [];
 items.forEach((item) => {
 const kids = parentMap.get(item.id) || [];
 result.push({
 ...item,
 level,
 hasChildren: kids.length > 0,
 childCount: kids.length,
 });
 if (kids.length > 0) {
 result.push(...flattenTree(kids, level + 1, parentMap));
 }
 });
 return result;
}

function buildChildMap(items: Account[]): Map<string, Account[]> {
 const map = new Map<string, Account[]>();
 items.forEach((item) => {
 if (item.parentId) {
 const list = map.get(item.parentId) || [];
 list.push(item);
 map.set(item.parentId, list);
 }
 });
 return map;
}

export default function ChartOfAccountsPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingAccount, setEditingAccount] = useState<Account | null>(null);
 const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

 const [formCode, setFormCode] = useState("");
 const [formName, setFormName] = useState("");
 const [formType, setFormType] = useState<AccountType>("ASSET");
 const [formNormalBalance, setFormNormalBalance] = useState<NormalBalance>("DEBIT");
 const [formParentId, setFormParentId] = useState("");
 const [formIsActive, setFormIsActive] = useState(true);
 const [showConfirm, setShowConfirm] = useState(false);

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
 setShowConfirm(true);
 };

 const confirmSubmit = () => {
 setShowConfirm(false);
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

 const flatList = useMemo<FlatAccount[]>(() => {
 if (!accounts || accounts.length === 0) return [];
 const childMap = buildChildMap(accounts);
 const roots = accounts.filter((a) => !a.parentId);
 return flattenTree(roots, 0, childMap);
 }, [accounts]);

 const filteredFlat = useMemo<FlatAccount[]>(() => {
 if (!searchTerm) {
 // Respect collapsed state: hide descendants of collapsed parents
 if (collapsed.size === 0) return flatList;
 return flatList.filter((row, idx) => {
 // Walk back to find if any ancestor is collapsed
 for (let i = idx - 1; i >= 0; i--) {
 const prev = flatList[i];
 if (prev.level < row.level) {
 if (collapsed.has(prev.id)) return false;
 if (prev.level === 0) return true;
 }
 if (prev.level === 0) break;
 }
 return true;
 });
 }
 const q = searchTerm.toLowerCase();
 return flatList.filter(
 (a) =>
 a.code.toLowerCase().includes(q) ||
 a.name.toLowerCase().includes(q),
 );
 }, [flatList, searchTerm, collapsed]);

 const toggleCollapse = (id: string) => {
 setCollapsed((prev) => {
 const next = new Set(prev);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 return next;
 });
 };

 const totalAccounts = accounts?.length || 0;
 const activeAccounts = accounts?.filter((a) => a.isActive).length || 0;
 const assetCount = accounts?.filter((a) => a.type === "ASSET").length || 0;
 const revenueCount = accounts?.filter((a) => a.type === "REVENUE").length || 0;

 const columns = useMemo(
 () => [
 {
 id: "code",
 accessorKey: "code",
 header: "Kode",
 cell: ({ row }: { row: { original: FlatAccount } }) => {
 const acc = row.original;
 const isCollapsed = collapsed.has(acc.id);
 return (
 <div
 className="flex items-center gap-2"
 style={{ paddingLeft: `${acc.level * 16}px` }}
 >
 {acc.hasChildren ? (
 <button
 type="button"
 onClick={() => toggleCollapse(acc.id)}
 className="h-5 w-5 rounded flex items-center justify-center hover:bg-slate-100 transition-colors"
 aria-label={isCollapsed ? "Expand" : "Collapse"}
 >
 {isCollapsed ? (
 <ChevronRight className="h-3 w-3 text-slate-500" />
 ) : (
 <ChevronDown className="h-3 w-3 text-slate-500" />
 )}
 </button>
 ) : (
 <div className="w-5" />
 )}
 <div
 className={cn(
 "h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold",
 acc.level === 0
 ? "bg-blue-600 text-white"
 : "bg-white border border-slate-200 text-slate-500"
 )}
 >
 {acc.code.substring(0, 3)}
 </div>
 <span
 className={cn(
 "text-[12px] uppercase",
 acc.level === 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700"
 )}
 >
 {acc.code}
 </span>
 </div>
 );
 },
 },
 {
 id: "name",
 accessorKey: "name",
 header: "Nama Akun",
 cell: ({ row }: { row: { original: FlatAccount } }) => (
 <span
 className={cn(
 "text-[13px]",
 row.original.level === 0 ? "font-semibold text-slate-900" : "text-slate-700"
 )}
 >
 {row.original.name}
 </span>
 ),
 },
 {
 accessorKey: "type",
 header: () => <div className="text-center">Tipe</div>,
 cell: ({ row }: { row: { original: FlatAccount } }) => (
 <div className="flex justify-center">
 <span className={`operational-status-badge is-${TYPE_TONE[row.original.type]}`}>
 {row.original.type}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "normalBalance",
 header: () => <div className="text-center">Normal Balance</div>,
 cell: ({ row }: { row: { original: FlatAccount } }) => (
 <div className="text-center">
 <span
 className={cn(
 "text-[11px] font-semibold uppercase",
 row.original.normalBalance === "DEBIT" ? "text-blue-600" : "text-rose-600"
 )}
 >
 {row.original.normalBalance}
 </span>
 </div>
 ),
 },
 {
 accessorKey: "isActive",
 header: () => <div className="text-center">Status</div>,
 cell: ({ row }: { row: { original: FlatAccount } }) => (
 <div className="flex justify-center">
 <span
 className={cn(
 "operational-status-badge",
 row.original.isActive ? "is-success" : "is-neutral"
 )}
 >
 {row.original.isActive ? "Aktif" : "Tidak Aktif"}
 </span>
 </div>
 ),
 },
 {
 id: "actions",
 header: () => <div className="text-right">Aksi</div>,
 cell: ({ row }: { row: { original: FlatAccount } }) => (
 <div className="flex justify-end">
 <button
 type="button"
 className="operational-button is-ghost h-8 w-8 p-0"
 onClick={() => handleEdit(row.original)}
 aria-label="Edit akun"
 >
 <Edit3 className="h-3.5 w-3.5" />
 </button>
 </div>
 ),
 },
 ],
 [collapsed],
 );

 return (
 <OperationalPageShell
 title="Chart of Accounts"
 subtitle="Manajemen struktur akun & kode rekening pusat"
 actions={
 <button
 type="button"
 className="operational-button is-primary"
 onClick={() => {
 resetForm();
 setEditingAccount(null);
 setIsModalOpen(true);
 }}
 >
 <Plus className="h-4 w-4" />
 <span>Tambah Akun</span>
 </button>
 }
 >
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Total Akun"
 value={formatOperationalNumber(totalAccounts)}
 icon={<Layers className="w-4 h-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Akun Aktif"
 value={formatOperationalNumber(activeAccounts)}
 icon={<Hash className="w-4 h-4" />}
 tone="green"
 />
 <OperationalMetricCard
 label="Total Asset"
 value={formatOperationalNumber(assetCount)}
 icon={<Wallet className="w-4 h-4" />}
 tone="purple"
 />
 <OperationalMetricCard
 label="Total Revenue"
 value={formatOperationalNumber(revenueCount)}
 icon={<TrendingUp className="w-4 h-4" />}
 tone="amber"
 />
 </OperationalMetricGrid>

 <OperationalDataTable
 data={filteredFlat as unknown as FlatAccount[]}
 columns={columns as any}
 getRowId={(row: FlatAccount) => row.id}
 loading={isLoading}
 toolbar={
 <div className="flex items-center gap-2 w-72">
 <OperationalInput
 icon={<span className="h-4 w-4" />}
 placeholder="Cari kode / nama akun..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 }
 searchPlaceholder="Cari kode atau nama akun..."
 emptyMessage="Tidak ada akun ditemukan"
 />

 {isError && (
 <OperationalPanel>
 <div className="text-center text-[13px] text-rose-600">
 Gagal memuat data akun. Silakan coba lagi.
 </div>
 </OperationalPanel>
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
 <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
 <div className="p-6 bg-blue-600 text-white relative">
 <DialogTitle className="text-xl font-semibold leading-none text-white">
 {editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
 </DialogTitle>
 <DialogDescription className="text-white/80 text-[12px] mt-1.5">
 {editingAccount ? "Perbarui data akun" : "Definisikan akun baru dalam Chart of Accounts"}
 </DialogDescription>
 <Layers className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 opacity-30 text-white" />
 </div>
 <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
 <div className="grid grid-cols-2 gap-4">
 <OperationalField label="Kode Akun *">
 <OperationalInput
 placeholder="11100"
 value={formCode}
 onChange={(e) => setFormCode(e.target.value)}
 />
 </OperationalField>
 <OperationalField label="Nama Akun *">
 <OperationalInput
 placeholder="Kas Besar"
 value={formName}
 onChange={(e) => setFormName(e.target.value)}
 />
 </OperationalField>
 <OperationalField label="Tipe Akun">
 <Select value={formType} onValueChange={(v) => setFormType(v as AccountType)}>
 <SelectTrigger>
 <SelectValue placeholder="Pilih tipe" />
 </SelectTrigger>
 <SelectContent>
 {ACCOUNT_TYPES.map((t) => (
 <SelectItem key={t.value} value={t.value}>
 {t.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Normal Balance">
 <Select
 value={formNormalBalance}
 onValueChange={(v) => setFormNormalBalance(v as NormalBalance)}
 >
 <SelectTrigger>
 <SelectValue placeholder="Pilih normal balance" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="DEBIT">Debit</SelectItem>
 <SelectItem value="CREDIT">Kredit</SelectItem>
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Akun Induk">
 <Select value={formParentId} onValueChange={(v) => setFormParentId(v ?? "")}>
 <SelectTrigger>
 <SelectValue placeholder="Tanpa induk (Root)" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="">— Root Account —</SelectItem>
 {accounts?.map((a) => (
 <SelectItem key={a.id} value={a.id}>
 {a.code} — {a.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </OperationalField>
 <OperationalField label="Status">
 <Select
 value={formIsActive ? "active" : "inactive"}
 onValueChange={(v) => setFormIsActive(v === "active")}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="active">Active</SelectItem>
 <SelectItem value="inactive">Inactive</SelectItem>
 </SelectContent>
 </Select>
 </OperationalField>
 </div>

 <div className="flex gap-3 pt-3 border-t border-slate-100">
 <OperationalButton
 variant="secondary"
 onClick={() => {
 setIsModalOpen(false);
 resetForm();
 setEditingAccount(null);
 }}
 >
 Batal
 </OperationalButton>
 <OperationalButton
 variant="primary"
 onClick={handleSubmit}
 disabled={!formCode || !formName}
 className="flex-1"
 >
 {editingAccount ? "Simpan Perubahan" : "Tambah Akun"}
 </OperationalButton>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Konfirmasi</DialogTitle>
 </DialogHeader>
 <p>Apakah Anda yakin ingin menyimpan data ini?</p>
 <DialogFooter>
 <button type="button" className="operational-button is-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
 <button type="button" className="operational-button is-primary" onClick={confirmSubmit}>Ya, Simpan</button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </OperationalPageShell>
 );
}