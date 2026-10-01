import React from "react";
import { Search, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import type { HrTicketItem } from "../_types/tickets.types";

interface TicketsTableProps {
  filteredTickets: HrTicketItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTicket: (ticket: HrTicketItem) => void;
}

export const TicketsTable: React.FC<TicketsTableProps> = ({
  filteredTickets,
  searchQuery,
  onSearchChange,
  onSelectTicket,
}) => {
  return (
    <DnaDataTableCard
      customToolbar={
        <div className="flex items-center justify-between w-full">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <DnaInput
              type="text"
              placeholder="Cari no tiket, nama, atau divisi..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan{" "}
            <span className="font-semibold text-slate-800">
              {filteredTickets.length}
            </span>{" "}
            Tiket Pengajuan
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left min-w-[1150px]">
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <DnaTh className="px-3.5 py-2.5 w-[120px]">No Tiket</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px]">NIK</DnaTh>
              <DnaTh className="px-3.5 py-2.5">Karyawan</DnaTh>
              <DnaTh className="px-3.5 py-2.5">Departemen</DnaTh>
              <DnaTh className="px-3.5 py-2.5 text-center w-[130px]">
                Jenis Pengajuan
              </DnaTh>
              <DnaTh className="px-3.5 py-2.5">Jadwal & Durasi</DnaTh>
              <DnaTh className="px-3.5 py-2.5">Alasan / Keperluan</DnaTh>
              <DnaTh className="px-3.5 py-2.5">Approver</DnaTh>
              <DnaTh className="px-3.5 py-2.5 text-center w-[100px]">Status</DnaTh>
              <DnaTh className="px-3.5 py-2.5 text-center w-[70px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody className="divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <DnaTableRow>
                <DnaTd
                  colSpan={10}
                  className="px-3.5 py-8 text-center text-xs text-slate-400"
                >
                  Tidak ada tiket pengajuan yang sesuai dengan kriteria filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredTickets.map((tck) => (
                <DnaTableRow
                  key={tck.id}
                  className="h-[48px] hover:bg-slate-50/80 transition-colors"
                >
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code>{tck.ticketNo}</DnaCell.Code>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code>{tck.empId}</DnaCell.Code>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text className="font-semibold text-slate-900">
                      {tck.empName}
                    </DnaCell.Text>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text className="text-slate-700">
                      {tck.department}
                    </DnaCell.Text>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        tck.type === "LEMBUR_PRODUKSI"
                          ? "purple"
                          : tck.type === "CUTI_TAHUNAN"
                          ? "info"
                          : tck.type === "IZIN_SAKIT"
                          ? "warning"
                          : "default"
                      }
                    >
                      {tck.type.replace("_", " ")}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.NaturalPair
                      primary={`${tck.startDate}${
                        tck.startDate !== tck.endDate ? ` s/d ${tck.endDate}` : ""
                      }`}
                      secondary={`Durasi: ${tck.duration}`}
                    />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text className="text-slate-800">
                      {tck.reason}
                    </DnaCell.Text>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text className="text-slate-600 font-medium">
                      {tck.approver}
                    </DnaCell.Text>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        tck.status === "APPROVED"
                          ? "success"
                          : tck.status === "PENDING"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {tck.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectTicket(tck)}
                      title="Lihat Detail & Aksi"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
};
