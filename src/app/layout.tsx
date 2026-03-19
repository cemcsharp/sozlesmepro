import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar";
import { MainWrapper } from "@/components/MainWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CompanyProvider } from "@/context/CompanyContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SözleşmePRO - Sözleşme Takip Yönetim Sistemi",
  description: "SözleşmePRO - Sözleşme Takip Yönetim Sistemi",
  keywords: ["Sözleşme", "Takip", "Yönetim", "Next.js", "TypeScript"],
  authors: [{ name: "SözleşmePRO" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "SözleşmePRO - Sözleşme Takip Yönetim Sistemi",
    description: "SözleşmePRO - Sözleşme Takip Yönetim Sistemi",
    url: "http://localhost:3000",
    siteName: "SözleşmePRO - Sözleşme Takip Yönetim Sistemi",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground`}
      >
        <CompanyProvider>
          <div className="flex min-h-screen">
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <MainWrapper>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </MainWrapper>
          </div>
          <Toaster />
        </CompanyProvider>
      </body>
    </html>
  );
}
