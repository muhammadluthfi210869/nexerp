import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Management Task | ERP Digmar',
  description: 'Task board per-member untuk tim digital marketing.',
};

// Default ke halaman overview. Member-specific URL:
//   /marketing/management-task/overview
//   /marketing/management-task/aurel
//   /marketing/management-task/revi
//   /marketing/management-task/zarka
//   /marketing/management-task/gusti
//   /marketing/management-task/luthfi
//   /marketing/management-task/rahmat
export default function ManagementTaskIndexPage() {
  redirect('/marketing/management-task/overview');
}

