'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Heart,
    Loader2,
    CheckCircle,
    ArrowLeft,
    Download,
    Printer,
    Share2
} from 'lucide-react';
import Image from 'next/image';

interface DonationReceipt {
    id: string;
    donationId: string;
    name: string;
    email: string;
    phone?: string;
    pan?: string;
    address?: string;
    city?: string;
    pincode?: string;
    category: string;
    amount: string;
    paymentMethod: string;
    status: string;
    receiptNumber: string;
    transactionId?: string;
    createdAt: string;
    verifiedAt: string;
}

// Remove trailing /api if present since we add it in fetch calls
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

const categoryLabels: Record<string, string> = {
    general: 'General Donation',
    temple: 'Temple Construction',
    prasadam: 'Prasadam Distribution',
    education: 'Spiritual Education',
    community: 'Community Outreach',
    festivals: 'Festival Sponsorship',
};

export default function DonationReceiptPage() {
    const params = useParams();
    const router = useRouter();
    const donationId = params.donationId as string;
    const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (donationId) {
            fetchReceipt();
        }
    }, [donationId]);

    const fetchReceipt = async () => {
        try {
            const res = await fetch(`${API_URL}/donations/public/${donationId}`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data.status !== 'VERIFIED') {
                    setError('Receipt is only available for verified donations.');
                } else {
                    setReceipt(data);
                }
            } else {
                setError('Donation not found.');
            }
        } catch (err) {
            console.error('Failed to fetch receipt:', err);
            setError('Failed to load receipt.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
                <Card className="p-8 text-center max-w-md w-full">
                    <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {error || 'Receipt not available'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Please check the donation ID or try again later.
                    </p>
                    <Link href="/my-donations">
                        <Button className="bg-[#5750F1] hover:bg-[#4a43d6]">
                            Go to My Donations
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Actions Bar - Hidden in Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Link
                        href="/my-donations"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to My Donations
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>

                {/* Receipt Card */}
                <Card className="p-8 border-0 shadow-2xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                    {/* Header with Logo */}
                    <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Image
                                src="/logo.svg"
                                alt="ISKCON Burla"
                                width={60}
                                height={60}
                                className="w-14 h-14"
                            />
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ISKCON Burla</h1>
                                <p className="text-sm text-gray-500">International Society for Krishna Consciousness</p>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Payment Verified</span>
                        </div>
                    </div>

                    {/* Receipt Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">DONATION RECEIPT</h2>
                        <p className="text-[#5750F1] font-mono font-bold text-lg">{receipt.receiptNumber}</p>
                    </div>

                    {/* Donation Details */}
                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Donation ID</p>
                                <p className="font-mono font-bold text-gray-900 dark:text-white">{receipt.donationId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(receipt.verifiedAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Amount Donated</p>
                            <p className="text-4xl font-bold text-[#5750F1]">
                                ₹{Number(receipt.amount).toLocaleString()}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Purpose</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {categoryLabels[receipt.category] || receipt.category}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {receipt.paymentMethod === 'UPI' ? 'UPI' : 'Bank Transfer'}
                                </p>
                            </div>
                        </div>

                        {receipt.transactionId && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Transaction ID</p>
                                <p className="font-mono text-gray-900 dark:text-white">{receipt.transactionId}</p>
                            </div>
                        )}
                    </div>

                    {/* Donor Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Donor Information</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{receipt.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{receipt.email}</p>
                                </div>
                            </div>
                            {receipt.phone && (
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{receipt.phone}</p>
                                </div>
                            )}
                            {receipt.pan && (
                                <div>
                                    <p className="text-xs text-gray-500">PAN</p>
                                    <p className="font-medium text-gray-900 dark:text-white font-mono">{receipt.pan}</p>
                                </div>
                            )}
                            {receipt.address && (
                                <div>
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {receipt.address}{receipt.city && `, ${receipt.city}`}{receipt.pincode && ` - ${receipt.pincode}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
                        <p className="text-sm text-gray-500 mb-2">
                            Thank you for your generous contribution to ISKCON Burla.
                        </p>
                        <p className="text-xs text-gray-400">
                            This is a computer-generated receipt and does not require a signature.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            80G tax benefit certificate coming soon.
                        </p>
                    </div>
                </Card>

                {/* Additional Actions */}
                <div className="mt-6 text-center print:hidden">
                    <Link href="/donations">
                        <Button className="bg-[#5750F1] hover:bg-[#4a43d6]">
                            <Heart className="w-4 h-4 mr-2" />
                            Make Another Donation
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
