'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const isAuctionsPage = pathname === '/auctions';
    const isBiddersPage = pathname === '/bidders';

    // All pages get the same layout with header and footer
    return (
        <div className="flex flex-col min-h-screen">
            {!isAuctionsPage && !isBiddersPage && <Header />}
            <main className="flex-1">{children}</main>
            {isHomePage && <Footer />}
        </div>
    );
}
