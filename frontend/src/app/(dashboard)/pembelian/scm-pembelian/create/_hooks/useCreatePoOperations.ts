import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { useDnaToast } from "@/components/dna";
import type {
  SupplierOption,
  WarehouseOption,
  MaterialOption,
  CartLineItem,
  CartRowItem,
} from "../_types/create-po.types";

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

export function useCreatePoOperations() {
  const router = useRouter();
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [estArrival, setEstArrival] = useState("");
  const [noteText, setNoteText] = useState("");
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);

  const [discountRp, setDiscountRp] = useState<number>(0);
  const [shippingCostRp, setShippingCostRp] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  const suppliersQuery = useQuery<SupplierOption[]>({
    queryKey: ["master-suppliers-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/suppliers");
        return unwrapList(res.data).map((s: any) => ({
          id: s.id,
          name: s.name,
          categoryName: s.category?.name,
        }));
      } catch {
        return [];
      }
    },
  });

  const warehousesQuery = useQuery<WarehouseOption[]>({
    queryKey: ["master-warehouses-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses/active");
        return unwrapList(res.data).map((w: any) => ({ id: w.id, name: w.name }));
      } catch {
        return [];
      }
    },
  });

  const materialsQuery = useQuery<MaterialOption[]>({
    queryKey: ["master-materials-po-form"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/materials", { params: { limit: 500 } });
        return unwrapList(res.data).map((m: any) => ({
          id: m.id,
          code: m.code || "â€”",
          name: m.name,
          unit: m.unit || m.usageUnit || "unit",
          unitPrice: Number(m.unitPrice ?? 0),
          type: m.type || "â€”",
          categoryName: m.category?.name,
        }));
      } catch {
        return [];
      }
    },
  });

  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  const materialById = useMemo(() => {
    const map = new Map<string, MaterialOption>();
    materials.forEach((m) => map.set(m.id, m));
    return map;
  }, [materials]);

  const cartRows: CartRowItem[] = cartItems.map((line) => {
    const material = materialById.get(line.materialId);
    return {
      ...line,
      materialName: material?.name || "â€”",
      materialCode: material?.code || "â€”",
      unit: material?.unit || "unit",
      subtotal: Number(line.qty || 0) * Number(line.unitPrice || 0),
    };
  });

  const subtotalBarang = cartRows.reduce((sum, item) => sum + item.subtotal, 0);
  const afterDiscount = Math.max(0, subtotalBarang - discountRp);
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + shippingCostRp + taxAmount;

  const handleAddItem = () => {
    const first = materials[0];
    setCartItems([
      ...cartItems,
      {
        id: `line-${Date.now()}`,
        materialId: first?.id || "",
        qty: 1,
        unitPrice: first?.unitPrice || 0,
      },
    ]);
  };

  const handleSelectMaterial = (lineId: string, materialId: string) => {
    const material = materialById.get(materialId);
    setCartItems(
      cartItems.map((line) =>
        line.id === lineId
          ? {
              ...line,
              materialId,
              unitPrice: line.unitPrice || material?.unitPrice || 0,
            }
          : line
      )
    );
  };

  const handleUpdateItem = (lineId: string, field: "qty" | "unitPrice", val: number) => {
    setCartItems(
      cartItems.map((line) => (line.id === lineId ? { ...line, [field]: val } : line))
    );
  };

  const handleRemoveItem = (lineId: string) => {
    setCartItems(cartItems.filter((line) => line.id !== lineId));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/purchase/orders", {
        supplierId,
        warehouseId: warehouseId || undefined,
        items: cartItems.map((line) => ({
          materialId: line.materialId,
          quantity: Number(line.qty),
          unitPrice: Number(line.unitPrice),
        })),
        discountManual: discountRp || undefined,
        shippingCost: shippingCostRp || undefined,
        taxPercent: taxRate || undefined,
        estArrival: estArrival || undefined,
        notes: noteText || undefined,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success(
        "PO Berhasil Dibuat",
        `Purchase Order ${created?.poNumber || ""} diterbitkan dan siap diverifikasi Finance.`
      );
      router.push("/purchase");
    },
    onError: (error) => {
      const { message } = extractApiError(error);
      toast.error("Gagal Membuat PO", message || "Server menolak permintaan pembuatan PO.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error("Supplier Wajib Dipilih", "Mohon pilih supplier mitra pengadaan.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang Kosong", "Tambahkan minimal 1 item barang yang dipesan.");
      return;
    }
    if (cartItems.some((line) => !line.materialId || Number(line.qty) <= 0)) {
      toast.error("Item Tidak Lengkap", "Setiap baris wajib punya bahan dan qty lebih dari 0.");
      return;
    }
    createMutation.mutate();
  };

  const isLoading =
    suppliersQuery.isLoading || warehousesQuery.isLoading || materialsQuery.isLoading;
  const isError =
    suppliersQuery.isError || warehousesQuery.isError || materialsQuery.isError;

  const refetchAll = () => {
    suppliersQuery.refetch();
    warehousesQuery.refetch();
    materialsQuery.refetch();
  };

  return {
    router,
    toast,
    supplierId,
    setSupplierId,
    warehouseId,
    setWarehouseId,
    estArrival,
    setEstArrival,
    noteText,
    setNoteText,
    cartItems,
    discountRp,
    setDiscountRp,
    shippingCostRp,
    setShippingCostRp,
    taxRate,
    setTaxRate,
    suppliers,
    warehouses,
    materials,
    cartRows,
    subtotalBarang,
    grandTotal,
    handleAddItem,
    handleSelectMaterial,
    handleUpdateItem,
    handleRemoveItem,
    handleSubmit,
    createMutation,
    isSubmitting: createMutation.isPending,
    isLoading,
    isError,
    refetchAll,
  };
}

export type UseCreatePoOperationsReturn = ReturnType<typeof useCreatePoOperations>;
