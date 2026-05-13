import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "finBridge | Microfinance Accessibility Platform Bangladesh",
  description: "Get microfinance loans easily across Bangladesh. Empowering entrepreneurs and small businesses with transparent loan products.",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
