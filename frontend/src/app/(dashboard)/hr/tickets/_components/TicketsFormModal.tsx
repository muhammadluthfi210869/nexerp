import React from "react";
import { DnaModal, DnaSelect, DnaInput, DnaButton } from "@/components/dna";
import type { NewTicketFormState, EmployeeOption } from "../_types/tickets.types";

interface TicketsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTicket: NewTicketFormState;
  setNewTicket: React.Dispatch<React.SetStateAction<NewTicketFormState>>;
  employees: EmployeeOption[];
  onSubmit: (e: React.FormEvent) => void;
  isCreating: boolean;
}

export const TicketsFormModal: React.FC<TicketsFormModalProps> = ({
  isOpen,
  onClose,
  newTicket,
  setNewTicket,
  employees,
  onSubmit,
  isCreating,
}) => {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Formulir Pengajuan Izin / Cuti / Lembur"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Pilih Karyawan *
          </label>
          <DnaSelect
            value={newTicket.employeeId || employees[0]?.id || ""}
            onChange={(val) => setNewTicket({ ...newTicket, employeeId: val })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name || emp.fullName} ({emp.employeeId || emp.nik || "Karyawan"}) -{" "}
                {emp.department || "Operasional"}
              </option>
            ))}
            {employees.length === 0 && (
              <option value="">(Memuat data karyawan...)</option>
            )}
          </DnaSelect>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Jenis Pengajuan *
          </label>
          <DnaSelect
            value={newTicket.type}
            onChange={(val) => setNewTicket({ ...newTicket, type: val })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="LEAVE">Cuti Tahunan / Izin Sakit (LEAVE)</option>
            <option value="OVERTIME">
              Surat Perintah Lembur / SPL Produksi (OVERTIME)
            </option>
            <option value="REIMBURSE">
              Dinas Luar Kota / Reimburse (REIMBURSE)
            </option>
          </DnaSelect>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal Mulai *
            </label>
            <DnaInput
              type="date"
              required
              value={newTicket.startDate}
              onChange={(e) =>
                setNewTicket({ ...newTicket, startDate: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanggal Selesai *
            </label>
            <DnaInput
              type="date"
              required
              value={newTicket.endDate}
              onChange={(e) =>
                setNewTicket({ ...newTicket, endDate: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Alasan Pengajuan & Keterangan *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Jelaskan kebutuhan pengajuan cuti/lembur secara spesifik..."
            value={newTicket.reason}
            onChange={(e) =>
              setNewTicket({ ...newTicket, reason: e.target.value })
            }
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <DnaButton
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
          >
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            type="submit"
            disabled={isCreating}
          >
            {isCreating ? "Mengirim..." : "Kirim Tiket Pengajuan"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
};
