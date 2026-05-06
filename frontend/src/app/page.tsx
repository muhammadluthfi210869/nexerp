import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to the main executive dashboard by default
  redirect('/executive/dashboard');
}

