import type { Metadata, Viewport } from "next";
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

// SEO Configuration
const siteUrl = "https://www.iskconburla.com";
const siteName = "ISKCON Burla";
const siteDescription = "ISKCON Burla - Your spiritual home in Sambalpur, Odisha. Order prasadam online, shop at our temple store, join youth programs, watch live darshan, donate for temple construction, and explore seva opportunities.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ISKCON Burla | Temple, Prasadam, Darshan & Spiritual Programs",
    template: "%s | ISKCON Burla",
  },
  description: siteDescription,
  keywords: [
    "ISKCON Burla",
    "ISKCON Sambalpur",
    "ISKCON Odisha",
    "Krishna Temple Burla",
    "Hare Krishna Burla",
    "Prasadam Burla",
    "Temple Sambalpur",
    "Live Darshan ISKCON",
    "Krishna Consciousness",
    "Bhagavad Gita",
    "Spiritual Programs Odisha",
    "Temple Store",
    "Donate ISKCON",
    "Youth Programs ISKCON",
    "Nitya Sevak",
    "Temple Construction Burla",
  ],
  authors: [{ name: "ISKCON Burla", url: siteUrl }],
  creator: "ISKCON Burla",
  publisher: "ISKCON Burla",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: siteName,
    title: "ISKCON Burla | Temple, Prasadam, Darshan & Spiritual Programs",
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ISKCON Burla - Krishna Temple in Sambalpur, Odisha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISKCON Burla | Temple, Prasadam, Darshan & Spiritual Programs",
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@iskconburla",
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
  verification: {
    // Add your verification codes here after setting up
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "Religion & Spirituality",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5750F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0c29" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD Structured Data for Organization
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ReligiousOrganization",
  name: "ISKCON Burla",
  alternateName: "International Society for Krishna Consciousness - Burla",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  image: `${siteUrl}/og-image.jpg`,
  description: siteDescription,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Near Siphon, PC Bridge",
    addressLocality: "Burla",
    addressRegion: "Sambalpur, Odisha",
    postalCode: "768019",
    addressCountry: "IN",
  },
  telephone: "+91-87630-25178",
  email: "info@iskconburla.com",
  sameAs: [
    "https://www.facebook.com/iskconburla",
    "https://www.instagram.com/iskconburla",
    "https://www.youtube.com/@iskconburla",
  ],
  openingHours: "Mo-Su 04:30-13:00, Mo-Su 16:00-21:00",
  priceRange: "Free",
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
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
