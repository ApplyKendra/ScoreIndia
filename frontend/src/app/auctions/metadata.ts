import type { Metadata } from "next";

const siteUrl = "https://scoreindia.cloud";

export const auctionsMetadata: Metadata = {
    title: "Live Cricket Auction | ScoreIndia - SPL 2026",
    description:
        "Watch live cricket player auctions for Sambalpur Premier League (SPL) 2026. Real-time bidding, player stats, team squads, and instant updates. Join 150+ players, 8 teams competing live.",
    keywords: [
        "SPL 2026",
        "Sambalpur Premier League",
        "Live Cricket Auction",
        "Cricket Player Bidding",
        "Real-time Sports Auction",
        "Cricket Team Building",
        "Player Stats",
        "Team Squad",
        "Live Bidding",
        "Cricket Fantasy",
        "IPL Style Auction",
        "Local Cricket Tournament",
        "Odisha Cricket",
        "Sambalpur Cricket",
    ],
    openGraph: {
        type: "website",
        locale: "en_US",
        url: `${siteUrl}/auctions`,
        siteName: "ScoreIndia",
        title: "Live Cricket Auction | SPL 2026 - ScoreIndia",
        description:
            "Experience live cricket player auctions for SPL 2026. Watch real-time bidding, track teams, and see player stats. 150+ players, 8 teams.",
        images: [
            {
                url: `${siteUrl}/og-image.jpg`,
                width: 1200,
                height: 630,
                alt: "ScoreIndia Live Auction - SPL 2026",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Live Cricket Auction | SPL 2026 - ScoreIndia",
        description:
            "Watch live cricket player auctions for SPL 2026. Real-time bidding with 150+ players and 8 teams.",
        images: [`${siteUrl}/og-image.jpg`],
        creator: "@scoreindia",
    },
    alternates: {
        canonical: `${siteUrl}/auctions`,
    },
    robots: {
        index: true,
        follow: true,
    },
};

// JSON-LD structured data for the auctions page
export const auctionsJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Sambalpur Premier League 2026 Player Auction",
    description:
        "Live cricket player auction for SPL 2026 featuring 150+ players and 8 teams competing in real-time bidding.",
    url: `${siteUrl}/auctions`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
        "@type": "VirtualLocation",
        url: `${siteUrl}/auctions`,
    },
    organizer: {
        "@type": "Organization",
        name: "ScoreIndia",
        url: siteUrl,
    },
    sport: "Cricket",
    image: `${siteUrl}/og-image.jpg`,
};
