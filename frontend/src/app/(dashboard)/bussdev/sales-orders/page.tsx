"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SalesOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/finance/sales-orders");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
    </div>
  );
}
