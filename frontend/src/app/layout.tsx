import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO Configuration
const siteUrl = "https://www.cricketauctionpro.com";
const siteName = "CricketAuction Pro";
const siteDescription = "CricketAuction Pro - The ultimate cricket player auction platform. Experience live auctions, build your dream team, track budgets, and compete in real-time. Enterprise-grade auction management for cricket leagues.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CricketAuction Pro | Live Cricket Player Auction Platform",
    template: "%s | CricketAuction Pro",
  },
  description: siteDescription,
  keywords: [
    "Cricket Auction",
    "IPL Auction",
    "Player Auction",
    "Cricket League",
    "Fantasy Cricket",
    "Live Auction",
    "Team Building",
    "Player Bidding",
    "Cricket Tournament",
    "Auction Platform",
    "Sports Auction",
    "Cricket Fantasy",
  ],
  authors: [{ name: "CricketAuction Pro", url: siteUrl }],
  creator: "CricketAuction Pro",
  publisher: "CricketAuction Pro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: "CricketAuction Pro | Live Cricket Player Auction Platform",
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "CricketAuction Pro - Live Cricket Player Auctions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CricketAuction Pro | Live Cricket Player Auction Platform",
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@cricketauctionpro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Sports & Recreation",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0066FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CricketAuction Pro",
  alternateName: "Cricket Player Auction Platform",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  image: `${siteUrl}/og-image.jpg`,
  description: siteDescription,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          <LayoutWrapper>
            {/* Main Layout Wrapper */}
            {children}
          </LayoutWrapper>
        </AuthProvider>
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
