"use client";

import React, { useState, useEffect } from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type { MarketingTeamMember } from "@/types/marketing-api";
import { useDnaToast } from "@/components/dna/DnaToast";

interface MemberEditModalProps {
  isOpen: boolean;
  member: MarketingTeamMember | null;
  onClose: () => void;
  onSave: (updated: Partial<MarketingTeamMember>) => Promise<void> | void;
}

export default function MemberEditModal({
  isOpen,
  member,
  onClose,
  onSave,
}: MemberEditModalProps) {
  const toast = useDnaToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member && isOpen) {
      setName(member.name || "");
      setRole(member.role || "");
      setDepartment(member.department || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama anggota tim wajib diisi");
      return;
    }
    if (!role.trim()) {
      toast.error("Jabatan/Role anggota tim wajib diisi");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        department: department.trim() || "Marketing",
        email: email.trim() || member.email,
        phone: phone.trim() || undefined,
      });
      toast.success("Profil anggota berhasil diperbarui");
      onClose();
    } catch {
      toast.error("Gagal memperbarui profil anggota");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profil Anggota Tim"
      description="Perbarui informasi personal, role jabatan, dan kontak PIC"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Nama Member *
          </label>
          <DnaInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Gusti Raditya"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Jabatan / Role *
          </label>
          <DnaInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Contoh: Lead Digital & Brand Strategist"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Departemen / Divisi
          </label>
          <DnaInput
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Contoh: Digital Strategy"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <DnaInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@dreamlab.id"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              No. WhatsApp
            </label>
            <DnaInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812-xxxx-xxxx"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <DnaButton type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
