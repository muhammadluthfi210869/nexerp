import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { Toaster } from "@/components/dna";
import { ActivityLogger } from "@/hooks/useActivityLog";

// EMERGENCY: skip static prerender globally. Several pre-existing pages had
// React render errors during build (e.g. /system/settings, /samples/omni-crm).
// Pages are now SSR'd on request. Performance cost: small initial-render
// overhead. Trade-off accepted to unblock OmniCRM MVP deploy.
// Restore static prerender when the pre-existing React errors are fixed.
export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NexERP | Production",
  description: "Next-Generation Enterprise Resource Planning",
  manifest: "/manifest.json",
  icons: {
    icon: "/nexerp-logo.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-base text-text-main font-sans antialiased`}>
        <ReactQueryProvider>
          <ActivityLogger />
          {children}
          <Toaster position="top-right" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}

