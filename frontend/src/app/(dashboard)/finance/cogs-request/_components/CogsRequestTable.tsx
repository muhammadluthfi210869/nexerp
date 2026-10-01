import React from "react";
import { Search, Calculator, Eye, Loader2 } from "lucide-react";
import {
  TableWrapper,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { CogsRequestItem } from "../_types/cogs-request.types";

interface CogsRequestTableProps {
  isLoading: boolean;
  filteredRequests: CogsRequestItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectDetail: (product: string) => void;
}

export function CogsRequestTable({
  isLoading,
  filteredRequests,
  searchTerm,
  onSearchChange,
  onSelectDetail,
}: CogsRequestTableProps) {
  return (
    <TableWrapper
      filters={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="status-dot bg-blue-500 animate-pulse" />
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                VALUATION INDEX
              </h3>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                Daftar Permintaan Penentuan Cost of Goods Sold â€¢ {filteredRequests.length} Records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <DnaInput
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="CARI VALUATION ID..."
                className="bg-slate-50 border-none rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      }
    >
      <DnaTable>
        <DnaTableHead className="bg-slate-50/50">
          <DnaTableRow className="hover:bg-transparent border-slate-100">
            <DnaTh className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">REQUEST IDENTITY</DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CLIENT / DESC</DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PRODUCT</DnaTh>
            <DnaTh className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">FORMULA REF</DnaTh>
            <DnaTh className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">COST / REVENUE</DnaTh>
            <DnaTh className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</DnaTh>
            <DnaTh className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">ACTION</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {isLoading ? (
            <DnaTableRow>
              <DnaTd colSpan={7} className="px-4 py-12 text-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" />
              </DnaTd>
            </DnaTableRow>
          ) : filteredRequests.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={7} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Tidak ada data yang cocok dengan pencarian Anda
              </DnaTd>
            </DnaTableRow>
          ) : (
            filteredRequests.map((req, idx) => {
              const reqKode = req.kode || req.jobOrderNumber || req.id || `JO-${idx + 1}`;
              const reqDate = req.tanggal || (req.recordedAt ? new Date(req.recordedAt).toISOString().split('T')[0] : "-");
              const reqPelanggan = req.pelanggan || req.customer || req.description || "Job Order Costing";
              const reqProduk = req.produk || req.product || req.jobOrderNumber || "-";
              const reqFormula = req.formula || req.formulaCode || "FML-STD";
              const reqCost = Number(req.totalCost || req.cost || 0);
              const reqStatus = req.status || (req.closedAt ? "Selesai" : "Draft");

              return (
                <DnaTableRow key={req.id || reqKode} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                  <DnaTd className="py-3 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                        <Calculator className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight text-sm uppercase italic leading-none">{reqKode}</p>
                        <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-1">{reqDate}</p>
                      </div>
                    </div>
                  </DnaTd>
                  <DnaTd className="py-3">
                    <p className="font-black text-slate-900 text-xs uppercase leading-none">{reqPelanggan}</p>
                  </DnaTd>
                  <DnaTd className="py-3">
                    <p className="text-[11px] font-medium text-slate-600 uppercase leading-none">{reqProduk}</p>
                  </DnaTd>
                  <DnaTd className="py-3">
                    <DnaBadge variant="info">
                      {reqFormula}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="py-3 text-right tabular-nums text-xs font-black">
                    Rp {reqCost.toLocaleString()}
                  </DnaTd>
                  <DnaTd className="py-3 text-center">
                    <DnaBadge variant={reqStatus === "Selesai" ? "success" : reqStatus === "Draft" ? "default" : "warning"}>
                      {reqStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="py-3 pr-6 text-center">
                    <DnaButton
                      variant="primary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => onSelectDetail(reqProduk)}
                    >
                      DETAIL
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              );
            })
          )}
        </DnaTableBody>
      </DnaTable>
    </TableWrapper>
  );
}
