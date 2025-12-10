import type { Metadata } from "next";
import { Inter, Permanent_Marker, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Scoper - Najlepsze oferty dla freelancerów spersonalizowane pod Twoje słowa kluczowe",
  description: "Codziennie otrzymujesz najlepsze oferty dla freelancerów spersonalizowane pod Twoje słowa kluczowe. Dla członków Be Free Club.",
  keywords: ["freelance", "oferty", "zlecenia", "powiadomienia", "praca zdalna", "freelancer", "be free club", "spersonalizowane oferty", "AI", "scoper"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${inter.variable} ${permanentMarker.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center" 
            expand={true}
            visibleToasts={1}
            richColors 
            closeButton
            theme="dark"
            toastOptions={{
              style: {
                background: '#2B2E33',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              className: 'sonner-toast',
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
