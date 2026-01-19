'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    Heart,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    ArrowLeft,
    FileText,
    Sparkles,
    TrendingUp,
    Calendar,
    IndianRupee,
    Gift,
    RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Donation {
    id: string;
    donationId: string;
    name: string;
    email: string;
    category: string;
    amount: string;
    paymentMethod: string;
    status: string;
    receiptNumber?: string;
    createdAt: string;
    verifiedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string; borderColor: string }> = {
    PENDING: { label: 'Pending Payment', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', icon: Clock },
    PAYMENT_UPLOADED: { label: 'Under Review', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: Upload },
    VERIFIED: { label: 'Verified', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', icon: XCircle },
    EXPIRED: { label: 'Expired', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', borderColor: 'border-gray-200 dark:border-gray-700', icon: Clock },
};

const categoryConfig: Record<string, { label: string; icon: any; gradient: string }> = {
    general: { label: 'General Donation', icon: Heart, gradient: 'from-rose-500 to-pink-500' },
    temple: { label: 'Temple Construction', icon: Sparkles, gradient: 'from-[#5750F1] to-purple-600' },
    prasadam: { label: 'Prasadam Distribution', icon: Gift, gradient: 'from-amber-500 to-orange-500' },
    education: { label: 'Spiritual Education', icon: FileText, gradient: 'from-emerald-500 to-teal-500' },
    community: { label: 'Community Outreach', icon: Heart, gradient: 'from-cyan-500 to-blue-500' },
    festivals: { label: 'Festival Sponsorship', icon: Sparkles, gradient: 'from-yellow-500 to-amber-500' },
};

export default function MyDonationsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDonations();
        }
    }, [isAuthenticated]);

    const fetchDonations = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/api/donations/my`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setDonations(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch donations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate stats
    const totalDonated = donations.reduce((sum, d) => d.status === 'VERIFIED' ? sum + Number(d.amount) : sum, 0);
    const verifiedCount = donations.filter(d => d.status === 'VERIFIED').length;
    const pendingCount = donations.filter(d => d.status === 'PENDING' || d.status === 'PAYMENT_UPLOADED').length;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center animate-pulse">
                        <Heart className="w-8 h-8 text-white" />
                    </div>
                    <Loader2 className="h-6 w-6 animate-spin text-[#5750F1]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Premium Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />

                {/* Animated Orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-500/30 to-pink-600/20 blur-3xl animate-orb-1" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#5750F1]/30 to-purple-600/20 blur-3xl animate-orb-2" />
                </div>

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-5xl mx-auto">
                        <Link
                            href="/"
                            className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-6 text-sm group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>

                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-3">
                                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                                    <span className="text-xs font-medium text-white/80">Your Contributions</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                                    My Donations
                                </h1>
                                <p className="text-white/60 text-sm sm:text-base">
                                    Track your sacred contributions and download receipts
                                </p>
                            </div>

                            <Button
                                onClick={() => fetchDonations(true)}
                                variant="outline"
                                disabled={refreshing}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                        <IndianRupee className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">₹{totalDonated.toLocaleString()}</p>
                                        <p className="text-xs text-white/60">Total Contributed</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5750F1] to-purple-600 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{verifiedCount}</p>
                                        <p className="text-xs text-white/60">Verified Donations</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{pendingCount}</p>
                                        <p className="text-xs text-white/60">Pending Review</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
                        <path
                            d="M0 120L48 108C96 96 192 72 288 66C384 60 480 72 576 78C672 84 768 84 864 78C960 72 1056 60 1152 60C1248 60 1344 72 1392 78L1440 84V120H0Z"
                            className="fill-gray-50 dark:fill-gray-950"
                        />
                    </svg>
                </div>
            </section>

            {/* Donations List */}
            <section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="max-w-5xl mx-auto">
                    {donations.length === 0 ? (
                        <Card className="p-12 sm:p-16 text-center border-0 shadow-xl bg-white dark:bg-gray-900 rounded-3xl">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-12 h-12 text-rose-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No donations yet</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                You haven't made any donations yet. Your contributions help us serve the community and spread Krishna consciousness.
                            </p>
                            <Link href="/donations">
                                <Button className="px-8 py-6 text-lg bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 rounded-xl shadow-xl shadow-[#5750F1]/25">
                                    <Heart className="w-5 h-5 mr-2" />
                                    Make Your First Donation
                                </Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {donations.map((donation) => {
                                const config = statusConfig[donation.status] || statusConfig.PENDING;
                                const StatusIcon = config.icon;
                                const categoryInfo = categoryConfig[donation.category] || categoryConfig.general;
                                const CategoryIcon = categoryInfo.icon;

                                return (
                                    <Card
                                        key={donation.id}
                                        className={`p-6 border-2 ${config.borderColor} bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Left Section: Category Icon + Details */}
                                            <div className="flex items-start gap-4">
                                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryInfo.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                    <CategoryIcon className="w-7 h-7 text-white" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm font-bold text-[#5750F1] bg-[#5750F1]/10 px-2 py-0.5 rounded-lg">
                                                            {donation.donationId}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {config.label}
                                                        </span>
                                                    </div>

                                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                        ₹{Number(donation.amount).toLocaleString()}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-medium">{categoryInfo.label}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span>{donation.paymentMethod === 'UPI' ? 'UPI Payment' : 'Bank Transfer'}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(donation.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section: Receipt Button */}
                                            {donation.status === 'VERIFIED' && donation.receiptNumber && (
                                                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 px-3 py-1">
                                                        {donation.receiptNumber}
                                                    </Badge>
                                                    <Link href={`/receipt/${donation.donationId}`}>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#5750F1] hover:bg-[#4a43d6] text-white rounded-xl"
                                                        >
                                                            <FileText className="w-4 h-4 mr-1.5" />
                                                            View Receipt
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Message */}
                                        {donation.status === 'PENDING' && (
                                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Please complete your payment and upload the screenshot.
                                                </p>
                                            </div>
                                        )}
                                        {donation.status === 'PAYMENT_UPLOADED' && (
                                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                                    <Upload className="w-4 h-4" />
                                                    Your payment is being verified. This usually takes 24-48 hours.
                                                </p>
                                            </div>
                                        )}
                                        {donation.status === 'VERIFIED' && (
                                            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                                <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Thank you! Your donation has been verified. Receipt is ready.
                                                </p>
                                            </div>
                                        )}
                                        {donation.status === 'REJECTED' && (
                                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                                                    <XCircle className="w-4 h-4" />
                                                    Your payment could not be verified. Please contact support.
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Make Another Donation CTA */}
                    {donations.length > 0 && (
                        <div className="mt-12 text-center">
                            <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-[#5750F1]/5 to-purple-500/5 border border-[#5750F1]/10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Continue Your Journey
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                    Every donation brings us closer to spreading Krishna consciousness worldwide.
                                </p>
                                <Link href="/donations">
                                    <Button className="px-8 py-5 bg-gradient-to-r from-[#5750F1] to-purple-600 hover:from-[#4a43d6] hover:to-purple-700 rounded-xl shadow-xl shadow-[#5750F1]/25">
                                        <Heart className="w-5 h-5 mr-2" />
                                        Make Another Donation
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
