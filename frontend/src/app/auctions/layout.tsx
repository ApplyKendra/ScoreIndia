import { auctionsMetadata, auctionsJsonLd } from "./metadata";

export const metadata = auctionsMetadata;

export default function AuctionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(auctionsJsonLd) }}
            />
            {children}
        </>
    );
}
