import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "MVP Sprint Platform | START Lima",
  description: "Plataforma oficial de proyectos del MVP Sprint. Descubre los proyectos creados por los participantes del programa intensivo de startups de START Lima.",
  keywords: ["MVP Sprint", "START Lima", "startups", "proyectos", "healthtech", "agritech"],
  authors: [{ name: "START Lima" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
