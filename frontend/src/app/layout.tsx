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

// SEO Configuration - Optimized for India/Cricket Audiences
const siteUrl = "https://scoreindia.cloud";
const siteName = "ScoreIndia";
const siteDescription = "ScoreIndia - India's premier cricket player auction platform. Host live auctions for SPL (Sambalpur Premier League), local cricket tournaments, and fantasy leagues. Real-time bidding, team management, player statistics, and broadcast-quality auction experience for cricket enthusiasts across India.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ScoreIndia | Live Cricket Player Auction Platform in India",
    template: "%s | ScoreIndia - Cricket Auctions",
  },
  description: siteDescription,
  keywords: [
    // Primary Keywords
    "Cricket Auction Platform India",
    "Live Cricket Player Auction",
    "IPL Style Auction",
    "Fantasy Cricket Auction",
    // Tournament Specific
    "SPL 2026",
    "Sambalpur Premier League",
    "Local Cricket Tournament Auction",
    "Corporate Cricket Auction",
    // Location Keywords
    "Cricket Auction Odisha",
    "Cricket Tournament India",
    "Sambalpur Cricket",
    "Indian Cricket League",
    // Feature Keywords
    "Real-time Bidding Platform",
    "Cricket Team Building",
    "Player Bidding System",
    "Auction Management Software",
    "Cricket Fantasy League",
    // Long-tail Keywords
    "Host Cricket Auction Online",
    "Best Cricket Auction Platform",
    "Live Player Bidding App",
    "Cricket Tournament Management",
    "Sports Auction Software India",
  ],
  authors: [{ name: "ScoreIndia", url: siteUrl }],
  creator: "ScoreIndia",
  publisher: "ScoreIndia",
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
    title: "ScoreIndia | #1 Live Cricket Player Auction Platform in India",
    description: "Host live cricket player auctions with ScoreIndia. Real-time bidding, team management, and broadcast-quality experience for SPL, local tournaments & fantasy leagues.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ScoreIndia - Live Cricket Player Auctions Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScoreIndia | Live Cricket Player Auction Platform",
    description: "Host live cricket auctions with real-time bidding. Perfect for SPL, local tournaments & fantasy leagues. 🏏",
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@scoreindia",
    site: "@scoreindia",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-IN": siteUrl,
      "en-US": siteUrl,
    },
  },
  category: "Sports & Recreation",
  other: {
    // Geo Meta Tags for Indian Audience
    "geo.region": "IN-OR",
    "geo.placename": "Sambalpur, Odisha, India",
    "geo.position": "21.4669;83.9812",
    "ICBM": "21.4669, 83.9812",
    // Google Verification placeholder
    "google-site-verification": "YOUR_GOOGLE_VERIFICATION_CODE",
    // Additional SEO hints
    "rating": "general",
    "distribution": "global",
    "revisit-after": "1 days",
  },
  verification: {
    // Add your verification codes here
    google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
    // yandex: "YOUR_YANDEX_CODE",
    // bing: "YOUR_BING_CODE",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0066FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

// JSON-LD Structured Data - Multiple Schemas for Rich Results
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "ScoreIndia",
  alternateName: "Score India Cricket Auctions",
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/logo.svg`,
    width: 512,
    height: 512,
  },
  image: `${siteUrl}/og-image.jpg`,
  description: siteDescription,
  sameAs: [
    // Add your social media links here
    // "https://facebook.com/scoreindia",
    // "https://twitter.com/scoreindia",
    // "https://instagram.com/scoreindia",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-89566-36255",
    email: "admin@scoreindia.cloud",
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
  address: {
    "@type": "PostalAddress",
    addressRegion: "Odisha",
    addressCountry: "IN",
  },
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${siteUrl}/#webapp`,
  name: "ScoreIndia",
  alternateName: "Cricket Player Auction Platform",
  url: siteUrl,
  applicationCategory: "SportsApplication",
  operatingSystem: "Web, iOS, Android",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free to view live auctions",
  },
  featureList: [
    "Live cricket player auctions",
    "Real-time bidding system",
    "Team budget management",
    "Player statistics tracking",
    "YouTube live stream integration",
    "Mobile-responsive design",
  ],
  screenshot: `${siteUrl}/og-image.jpg`,
  softwareVersion: "2.0",
  datePublished: "2026-01-01",
  dateModified: "2026-01-26",
  inLanguage: "en-IN",
  isAccessibleForFree: true,
  creator: organizationSchema,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "ScoreIndia",
  description: siteDescription,
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/auctions?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-IN",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ScoreIndia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ScoreIndia is India's premier cricket player auction platform. It allows you to host live cricket auctions for local tournaments, corporate leagues, and fantasy cricket with real-time bidding, team management, and broadcast-quality experience.",
      },
    },
    {
      "@type": "Question",
      name: "How can I host my own cricket auction?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Contact us at admin@scoreindia.cloud or call +91-89566-36255 to set up your premium cricket auction. We provide a complete professional auction dashboard, live big screen display, team management tools, and real-time bidding system.",
      },
    },
    {
      "@type": "Question",
      name: "Is ScoreIndia free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Watching live auctions on ScoreIndia is completely free. For hosting your own tournament auction, contact us for premium packages tailored to your needs.",
      },
    },
    {
      "@type": "Question",
      name: "What is SPL 2026?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SPL 2026 (Sambalpur Premier League 2026) is the inaugural edition of a local cricket tournament in Sambalpur, Odisha featuring 150+ players and 8 teams competing in live auction format.",
      },
    },
  ],
};

// Combined JSON-LD for all schemas
const jsonLd = [
  organizationSchema,
  webApplicationSchema,
  websiteSchema,
  faqSchema,
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* SVG favicon - supported by all modern browsers */}
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
