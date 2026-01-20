'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Loader2,
    LayoutDashboard,
    UtensilsCrossed,
    ShoppingBag,
    Users,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Home,
    Images,
    Info,
    Phone,
    Building2,
    Heart,
    Crown,
    Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading, _sessionVerified, logout } = useAuthStore();
    const [isClient, setIsClient] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Wait for session verification before redirecting
    useEffect(() => {
        if (isClient && _sessionVerified && !isLoading) {
            if (!isAuthenticated || !user) {
                router.push('/login');
            } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'SUB_ADMIN') {
                router.push('/');
            }
        }
    }, [isClient, _sessionVerified, isLoading, isAuthenticated, user, router]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {
            console.error(e);
        }
        logout();
        router.push('/login');
    };

    if (!isClient || isLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/30">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#5750F1] mx-auto" />
                    <p className="text-muted-foreground">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    const sidebarItems = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Hero Slideshow',
            href: '/admin/slideshow',
            icon: Images,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Prasadam Orders',
            href: '/admin/orders',
            icon: UtensilsCrossed,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Menu Items',
            href: '/admin/menu',
            icon: UtensilsCrossed,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Store Items',
            href: '/admin/store',
            icon: ShoppingBag,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Upcoming Events',
            href: '/admin/events',
            icon: Calendar,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Darshan Gallery',
            href: '/admin/darshan',
            icon: Images,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'About Us',
            href: '/admin/about-us',
            icon: Info,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Contact Us',
            href: '/admin/contact-us',
            icon: Phone,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Temple Construction',
            href: '/admin/temple-construction',
            icon: Building2,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Seva Opportunities',
            href: '/admin/seva',
            icon: Heart,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Nitya Sevak',
            href: '/admin/nitya-sevak',
            icon: Crown,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Donations',
            href: '/admin/donations',
            icon: Heart,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'Notifications',
            href: '/admin/notifications',
            icon: Bell,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
        {
            label: 'User Management',
            href: '/admin/users',
            icon: Users,
            roles: ['SUPER_ADMIN'], // SUPER_ADMIN only
        },
        {
            label: 'Settings',
            href: '/admin/settings',
            icon: Settings,
            roles: ['SUPER_ADMIN', 'SUB_ADMIN'],
        },
    ];

    return (
        <div className="h-screen overflow-hidden bg-muted/20">
            {/* Fixed Header - spans full width, sits on top of everything */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 md:px-6">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </Button>

                {/* Logo/Title */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#5750F1] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-[#5750F1]/30">
                        <Image
                            src="/logo.svg"
                            alt="ISKCON Logo"
                            width={20}
                            height={20}
                            className="h-5 w-5"
                        />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">ISKCON Admin</h1>
                        <p className="text-xs text-[#5750F1] font-medium hidden sm:block">
                            {user.role.replace('_', ' ')}
                        </p>
                    </div>
                </div>

                {/* Header right side actions */}
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Home className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">View Site</span>
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Fixed Sidebar - below header on desktop, overlay on mobile */}
            <aside className={`
                fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 
                bg-background/95 backdrop-blur-xl border-r border-border/50
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                flex flex-col overflow-hidden
            `}>
                {/* Mobile close button */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 md:hidden">
                    <span className="font-semibold text-foreground">Navigation</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation - scrollable */}
                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        if (!item.roles.includes(user.role)) return null;

                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                                <div className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                                    transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-[#5750F1] text-white shadow-md shadow-[#5750F1]/30'
                                        : 'text-muted-foreground hover:bg-[#5750F1]/10 hover:text-[#5750F1]'
                                    }
                                `}>
                                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-[#5750F1]'}`} />
                                    <span>{item.label}</span>
                                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area - scrollable, offset by header and sidebar */}
            <main className="pt-16 md:pl-72 h-screen overflow-auto">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

