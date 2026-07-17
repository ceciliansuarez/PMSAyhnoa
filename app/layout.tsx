import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/navigation";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aynoa PMS - Premium Property Management",
  description: "Property Management System ultra-minimalista, limpio y de alta gama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground">
        {/* Navegación híbrida (Sidebar en Desktop / Bottom bar en Mobile) */}
        <Navigation isMock={db.isMock} />
        
        {/* Área de Contenido Principal */}
        <main className="flex-1 pb-24 md:pb-6 md:p-8 p-4 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
