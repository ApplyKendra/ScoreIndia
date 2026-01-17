import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISKCON Digital Ecosystem",
  description: "Prasadam ordering, Temple store, Youth programs, and more from ISKCON",
  keywords: ["ISKCON", "Krishna", "Prasadam", "Temple", "Spirituality"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
        <Toaster
          position="bottom-right"
          richColors
          duration={2000}
          toastOptions={{
            style: {
              padding: '10px 14px',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
