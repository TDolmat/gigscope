import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gig Scope - Najlepsze oferty freelance prosto do Ciebie",
  description: "🚀 Otrzymuj najnowsze oferty freelance prosto na swoją skrzynkę. Subskrybuj powiadomienia i bądź na bieżąco z najlepszymi zleceniami z popularnych platform freelancerskich. Zupełnie za darmo!",
  keywords: ["freelance", "oferty", "zlecenia", "powiadomienia", "praca zdalna", "freelancer", "zdalnie"],
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
        {children}
      </body>
    </html>
  );
}
