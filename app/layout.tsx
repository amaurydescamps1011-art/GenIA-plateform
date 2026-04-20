import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenIA Studio — Platform",
  description: "Plateforme interne GenIA Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
