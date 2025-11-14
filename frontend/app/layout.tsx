import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GigScope - Najlepsze zlecenia spersonalizowane dla Ciebie",
  description: "Codziennie otrzymujesz najlepsze oferty freelance dopasowane do Twoich słów kluczowych. Dla członków be free club.",
  keywords: ["freelance", "oferty", "zlecenia", "powiadomienia", "praca zdalna", "freelancer", "be free club", "spersonalizowane oferty"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
