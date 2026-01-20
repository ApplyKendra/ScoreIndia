'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    Eye,
    RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Donation {
    id: string;
    donationId: string;
    name: string;
    email: string;
    phone: string;
    pan?: string;
    category: string;
    amount: string;
    paymentMethod: string;
    status: string;
    paymentProofUrl?: string;
    transactionId?: string;
    receiptNumber?: string;
    createdAt: string;
}

// Remove trailing /api if present since we add it in fetch calls
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
    PAYMENT_UPLOADED: { label: 'Uploaded', color: 'bg-blue-500/10 text-blue-600', icon: Upload },
    VERIFIED: { label: 'Verified', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-600', icon: XCircle },
    EXPIRED: { label: 'Expired', color: 'bg-gray-500/10 text-gray-600', icon: Clock },
};

export default function AdminDonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [filter, setFilter] = useState<string>('all');

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/donations${filter !== 'all' ? `?status=${filter}` : ''}`, {
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
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [filter]);

    const handleVerify = async (donationId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
        setVerifying(true);
        try {
            const res = await fetch(`${API_URL}/donations/${donationId}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status, rejectionReason: reason }),
            });

            if (res.ok) {
                toast.success(`Donation ${status === 'VERIFIED' ? 'verified' : 'rejected'} successfully`);
                setSelectedDonation(null);
                fetchDonations();
            } else {
                toast.error('Failed to update donation status');
            }
        } catch (error) {
            console.error('Error verifying donation:', error);
            toast.error('Something went wrong');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Donations</h1>
                    <p className="text-gray-500">Manage and verify donation payments</p>
                </div>
                <Button onClick={fetchDonations} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'PAYMENT_UPLOADED', 'PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                            ? 'bg-[#5750F1] text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                    >
                        {status === 'all' ? 'All' : statusConfig[status]?.label || status}
                    </button>
                ))}
            </div>

            {/* Donations Table */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {donations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No donations found</p>
                                    </td>
                                </tr>
                            ) : (
                                donations.map((donation) => {
                                    const config = statusConfig[donation.status] || statusConfig.PENDING;
                                    const StatusIcon = config.icon;
                                    return (
                                        <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-4">
                                                <span className="font-mono text-sm font-bold text-[#5750F1]">
                                                    {donation.donationId}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white">{donation.name}</p>
                                                <p className="text-xs text-gray-500">{donation.email}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    ₹{Number(donation.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className="text-xs">
                                                    {donation.paymentMethod === 'UPI' ? 'UPI' : 'Bank'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedDonation(donation)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Donation Details Modal */}
            <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Donation Details</DialogTitle>
                    </DialogHeader>

                    {selectedDonation && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-500">Donation ID</p>
                                <p className="font-mono font-bold text-[#5750F1]">{selectedDonation.donationId}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-medium">{selectedDonation.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="font-bold text-lg">₹{Number(selectedDonation.amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{selectedDonation.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{selectedDonation.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="font-medium capitalize">{selectedDonation.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Method</p>
                                    <p className="font-medium">{selectedDonation.paymentMethod}</p>
                                </div>
                                {selectedDonation.pan && (
                                    <div>
                                        <p className="text-sm text-gray-500">PAN</p>
                                        <p className="font-medium font-mono">{selectedDonation.pan}</p>
                                    </div>
                                )}
                                {selectedDonation.transactionId && (
                                    <div>
                                        <p className="text-sm text-gray-500">Transaction ID</p>
                                        <p className="font-medium font-mono">{selectedDonation.transactionId}</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Proof */}
                            {selectedDonation.paymentProofUrl && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                                    <div className="border rounded-lg overflow-hidden">
                                        <img
                                            src={selectedDonation.paymentProofUrl}
                                            alt="Payment proof"
                                            className="w-full max-h-64 object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedDonation.status === 'PAYMENT_UPLOADED' && (
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => handleVerify(selectedDonation.donationId, 'VERIFIED')}
                                        disabled={verifying}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Verify
                                    </Button>
                                    <Button
                                        onClick={() => handleVerify(selectedDonation.donationId, 'REJECTED', 'Payment not received')}
                                        disabled={verifying}
                                        variant="outline"
                                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
