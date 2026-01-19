'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SidebarProvider, Sidebar } from '@/components/layout';
import { NotificationModal } from '@/components/NotificationModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isHomePage = pathname === '/';

    // Admin routes have their own layout - don't show public header/footer/sidebar
    if (isAdminRoute) {
        return <>{children}</>;
    }

    // Auth routes (login/register) - minimal layout without header/footer
    if (isAuthRoute) {
        return <>{children}</>;
    }

    // Homepage gets full layout with footer
    if (isHomePage) {
        return (
            <SidebarProvider defaultOpen={false}>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <Sidebar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <NotificationModal />
                </div>
            </SidebarProvider>
        );
    }

    // All other public routes - NO footer
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex flex-col min-h-screen">
                <Header />
                <Sidebar />
                <main className="flex-1">{children}</main>
                <NotificationModal />
            </div>
        </SidebarProvider>
    );
}
