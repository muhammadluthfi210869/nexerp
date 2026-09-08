import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Management Task | ERP Digmar',
  description: 'Task board per-member untuk tim digital marketing.',
};

// Default ke halaman overview.
export default function ManagementTaskIndexPage() {
  redirect('/marketing/management-task/overview');
}

