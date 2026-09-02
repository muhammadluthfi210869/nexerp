'use client';

import { useState } from 'react';
import { ClientTable } from '../components/ClientTable';
import type { Client } from '@/types/marketing-overview';

export function ClientsTab({ clients, onSelect }: { clients: Client[]; onSelect: (c: Client) => void }) {
  const [search, setSearch] = useState('');
  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [c.name, c.company, c.campaign, c.stage, c.owner, c.source].some((v) => v?.toLowerCase().includes(q));
  });
  return (
    <ClientTable clients={filtered} onSelect={onSelect} search={search} onSearchChange={setSearch} />
  );
}
