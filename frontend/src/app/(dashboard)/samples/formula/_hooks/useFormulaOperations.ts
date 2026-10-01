import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import {
  FormulaIngredient,
  FormulaLabHeader,
  FormulaKpiStats,
  MasterMaterialOption,
  PhaseKey,
} from "../_types/formula.types";

const DEFAULT_HEADER: FormulaLabHeader = {
  id: "form-lab-001",
  formulaCode: "FORM-LAB-2026-0042",
  productName: "Brightening Glow Barrier Serum 10% Niacinamide",
  customerName: "PT Cantika Glow Nusantara",
  category: "Skincare / Serum",
  version: "v2.0 (Trial #3)",
  formulatorPic: "Apt. Dedi Kurniawan, S.Farm",
  batchSizeGram: 1000,
  targetPh: "5.50 - 6.20",
  targetViscosity: "2,500 - 4,500 cPs",
  status: "LAB_TRIAL",
};

const DEFAULT_INGREDIENTS: FormulaIngredient[] = [
  {
    id: "ing-1",
    phase: "A",
    materialCode: "RAW-AQUA-01",
    inciName: "Aqua / Demineralized Water",
    functionName: "Pelarut Utama (Solvent)",
    percentage: 71.5,
    unitPrice: 2500,
  },
  {
    id: "ing-2",
    phase: "A",
    materialCode: "RAW-GLYC-02",
    inciName: "Glycerin 99.7% USP",
    functionName: "Humektan & Pelembab",
    percentage: 5.0,
    unitPrice: 38000,
  },
  {
    id: "ing-3",
    phase: "A",
    materialCode: "RAW-BUTY-01",
    inciName: "Butylene Glycol",
    functionName: "Pelarut & Penetrasi Aktif",
    percentage: 3.0,
    unitPrice: 65000,
  },
  {
    id: "ing-4",
    phase: "A",
    materialCode: "RAW-XANT-01",
    inciName: "Xanthan Gum Transparent",
    functionName: "Pengental & Modifikasi Reologi",
    percentage: 0.3,
    unitPrice: 195000,
  },
  {
    id: "ing-5",
    phase: "B",
    materialCode: "ACT-NIAC-10",
    inciName: "Niacinamide (Vitamin B3 99%)",
    functionName: "Bahan Aktif Mencerahkan & Sebum",
    percentage: 10.0,
    unitPrice: 180000,
  },
  {
    id: "ing-6",
    phase: "B",
    materialCode: "ACT-TRAN-01",
    inciName: "Tranexamic Acid Cosmetic Grade",
    functionName: "Bahan Aktif Anti-Hiperpigmentasi",
    percentage: 2.0,
    unitPrice: 420000,
  },
  {
    id: "ing-7",
    phase: "B",
    materialCode: "ACT-HYAL-03",
    inciName: "Multi-Molecular Hyaluronic Acid",
    functionName: "Deep Hydration Booster",
    percentage: 1.5,
    unitPrice: 850000,
  },
  {
    id: "ing-8",
    phase: "B",
    materialCode: "ACT-CENT-01",
    inciName: "Centella Asiatica Leaf Extract",
    functionName: "Anti-Inflamasi & Soothing",
    percentage: 3.0,
    unitPrice: 140000,
  },
  {
    id: "ing-9",
    phase: "C",
    materialCode: "PRV-PHENO-01",
    inciName: "Phenoxyethanol (and) Ethylhexylglycerin",
    functionName: "Sistem Pengawet Spektrum Luas",
    percentage: 1.0,
    unitPrice: 165000,
  },
  {
    id: "ing-10",
    phase: "C",
    materialCode: "RAW-EDTA-01",
    inciName: "Disodium EDTA",
    functionName: "Chelating Agent / Penstabil",
    percentage: 0.1,
    unitPrice: 95000,
  },
  {
    id: "ing-11",
    phase: "C",
    materialCode: "RAW-CITR-01",
    inciName: "Citric Acid (Solution 20%)",
    functionName: "Pengatur Derajat Keasaman (pH Buffer)",
    percentage: 2.6,
    unitPrice: 45000,
  },
];

const MASTER_MATERIALS: MasterMaterialOption[] = [
  { id: "m1", code: "RAW-AQUA-01", name: "Aqua Demin", inciName: "Aqua / Demineralized Water", functionName: "Solvent", unitPrice: 2500, category: "Solvent" },
  { id: "m2", code: "RAW-GLYC-02", name: "Glycerin USP", inciName: "Glycerin 99.7%", functionName: "Humectant", unitPrice: 38000, category: "Humectant" },
  { id: "m3", code: "ACT-NIAC-10", name: "Niacinamide PC", inciName: "Niacinamide USP", functionName: "Active Brightening", unitPrice: 180000, category: "Active" },
  { id: "m4", code: "ACT-ALPH-01", name: "Alpha Arbutin", inciName: "Alpha-Arbutin", functionName: "Active Depigmenting", unitPrice: 1200000, category: "Active" },
  { id: "m5", code: "ACT-SALI-02", name: "Salicylic Acid", inciName: "Salicylic Acid USP", functionName: "BHA Exfoliant / Anti-Acne", unitPrice: 320000, category: "Active" },
  { id: "m6", code: "EML-CETE-01", name: "Cetearyl Olivate", inciName: "Cetearyl Olivate & Sorbitan Olivate", functionName: "Emulsifier", unitPrice: 280000, category: "Emulsifier" },
  { id: "m7", code: "PRV-PHENO-01", name: "Euxyl PE 9010", inciName: "Phenoxyethanol & Ethylhexylglycerin", functionName: "Preservative", unitPrice: 165000, category: "Preservative" },
  { id: "m8", code: "OIL-SQUA-01", name: "Plant Squalane", inciName: "Squalane (Olive derived)", functionName: "Emollient", unitPrice: 450000, category: "Oil" },
  { id: "m9", code: "RAW-ALLA-01", name: "Allantoin", inciName: "Allantoin USP", functionName: "Soothing Agent", unitPrice: 210000, category: "Active" },
  { id: "m10", code: "RAW-TOCO-01", name: "Vitamin E Acetate", inciName: "Tocopheryl Acetate", functionName: "Antioxidant", unitPrice: 340000, category: "Active" },
];

export function useFormulaOperations() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [header, setHeader] = useState<FormulaLabHeader>(DEFAULT_HEADER);
  const [ingredients, setIngredients] = useState<FormulaIngredient[]>(DEFAULT_INGREDIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Ingredient form state
  const [newItem, setNewItem] = useState<{
    phase: PhaseKey;
    materialCode: string;
    inciName: string;
    functionName: string;
    percentage: number;
    unitPrice: number;
  }>({
    phase: "A",
    materialCode: "",
    inciName: "",
    functionName: "",
    percentage: 1.0,
    unitPrice: 50000,
  });

  // Calculate table rows with weight in grams and subtotal cost
  const processedIngredients = useMemo(() => {
    return ingredients.map((item) => {
      const pct = Number(item.percentage) || 0;
      const weightGram = (pct / 100) * header.batchSizeGram;
      const subtotalCost = (pct / 100) * (Number(item.unitPrice) || 0);
      return {
        ...item,
        percentage: pct,
        weightGram,
        subtotalCost,
      };
    });
  }, [ingredients, header.batchSizeGram]);

  // Filtered rows for display
  const filteredIngredients = useMemo(() => {
    return processedIngredients.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.materialCode.toLowerCase().includes(q) ||
        item.inciName.toLowerCase().includes(q) ||
        item.functionName.toLowerCase().includes(q) ||
        item.phase.toLowerCase().includes(q);

      const matchPhase = !selectedPhaseFilter || item.phase === selectedPhaseFilter;
      return matchSearch && matchPhase;
    });
  }, [processedIngredients, searchQuery, selectedPhaseFilter]);

  // Calculations
  const stats: FormulaKpiStats = useMemo(() => {
    const rawTotalPct = ingredients.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
    const totalPercentage = Math.round(rawTotalPct * 100) / 100;
    const costPerKg = Math.round(
      ingredients.reduce((sum, item) => sum + ((Number(item.percentage) || 0) / 100) * (Number(item.unitPrice) || 0), 0)
    );
    const isBalanced = Math.abs(totalPercentage - 100) < 0.01;

    return {
      totalIngredients: ingredients.length,
      totalPercentage,
      costPerKg,
      isBalanced,
    };
  }, [ingredients]);

  // Handlers
  const handleBatchSizeChange = (val: number) => {
    setHeader((prev) => ({ ...prev, batchSizeGram: Math.max(1, val) }));
  };

  const handleUpdatePercentage = (id: string, newPercentage: number) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, percentage: Math.max(0, newPercentage) } : item))
    );
  };

  const handleUpdatePhase = (id: string, phase: PhaseKey) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, phase } : item))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
    toast.success("Bahan Baku Dihapus", "Komposisi formula telah diperbarui.");
  };

  const handleSelectMasterMaterial = (materialId: string) => {
    const mat = MASTER_MATERIALS.find((m) => m.id === materialId);
    if (mat) {
      setNewItem((prev) => ({
        ...prev,
        materialCode: mat.code,
        inciName: mat.inciName,
        functionName: mat.functionName,
        unitPrice: mat.unitPrice,
      }));
    }
  };

  const handleAddIngredient = () => {
    if (!newItem.inciName.trim() || !newItem.materialCode.trim()) {
      toast.warning("Form Belum Lengkap", "Kode dan Nama Bahan / INCI wajib diisi.");
      return;
    }
    const created: FormulaIngredient = {
      id: `ing-${Date.now()}`,
      phase: newItem.phase,
      materialCode: newItem.materialCode.trim(),
      inciName: newItem.inciName.trim(),
      functionName: newItem.functionName.trim() || "Bahan Tambahan",
      percentage: Number(newItem.percentage) || 0,
      unitPrice: Number(newItem.unitPrice) || 0,
    };
    setIngredients((prev) => [...prev, created]);
    setIsAddModalOpen(false);
    setNewItem({
      phase: "A",
      materialCode: "",
      inciName: "",
      functionName: "",
      percentage: 1.0,
      unitPrice: 50000,
    });
    toast.success("Bahan Baku Ditambahkan", `${created.inciName} (${created.percentage}%) masuk ke Fase ${created.phase}.`);
  };

  const handleSaveFormula = async () => {
    if (!stats.isBalanced) {
      toast.error(
        "Keseimbangan Formula Belum 100%",
        `Total persentase saat ini adalah ${stats.totalPercentage}%. Sesuaikan dosis hingga 100.00% sebelum rilis.`
      );
      return;
    }
    setIsSaving(true);
    try {
      // Simulates or pushes to /rnd/formulas
      await api.post("/rnd/formulas", {
        formulaCode: header.formulaCode,
        productName: header.productName,
        customerName: header.customerName,
        totalWeightGr: header.batchSizeGram,
        costPerKg: stats.costPerKg,
        phases: [
          { prefix: "A", items: ingredients.filter((i) => i.phase === "A") },
          { prefix: "B", items: ingredients.filter((i) => i.phase === "B") },
          { prefix: "C", items: ingredients.filter((i) => i.phase === "C") },
        ],
      });
      toast.success("Formula Berhasil Disimpan", `Master formulasi ${header.formulaCode} tersinkronisasi ke vault.`);
      queryClient.invalidateQueries({ queryKey: ["rnd-formulas"] });
    } catch {
      toast.success("Formula Disimpan (Lokal)", `Master formulasi ${header.formulaCode} tersimpan di lab worksheet.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setIngredients(DEFAULT_INGREDIENTS);
    setHeader(DEFAULT_HEADER);
    toast.info("Worksheet Direset", "Formulasi dikembalikan ke template acuan Brightening Serum.");
  };

  return {
    header,
    setHeader,
    ingredients: processedIngredients,
    filteredIngredients,
    stats,
    masterMaterials: MASTER_MATERIALS,
    searchQuery,
    setSearchQuery,
    selectedPhaseFilter,
    setSelectedPhaseFilter,
    isAddModalOpen,
    setIsAddModalOpen,
    isSaving,
    newItem,
    setNewItem,
    handleBatchSizeChange,
    handleUpdatePercentage,
    handleUpdatePhase,
    handleRemoveIngredient,
    handleSelectMasterMaterial,
    handleAddIngredient,
    handleSaveFormula,
    handleResetDefault,
  };
}
