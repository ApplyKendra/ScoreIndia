'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Package, Clock, CheckCircle, XCircle, ArrowLeft, MapPin, Phone, FileText, Store, Bike, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';
import { prasadamApi, PrasadamOrder } from '@/lib/api/prasadam';

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
    READY: 'bg-green-100 text-green-800 border-green-200',
    COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    CONFIRMED: <Package className="h-4 w-4" />,
    PREPARING: <Package className="h-4 w-4" />,
    READY: <CheckCircle className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
};

const statusMessages: Record<string, string> = {
    PENDING: 'Your order has been placed and is awaiting confirmation.',
    CONFIRMED: 'Your order has been confirmed and will be prepared soon.',
    PREPARING: 'Your order is being prepared with love and devotion.',
    READY: 'Your order is ready! Please proceed to pick it up.',
    COMPLETED: 'Your order has been completed. Thank you for ordering!',
    CANCELLED: 'This order has been cancelled.',
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [order, setOrder] = useState<PrasadamOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;

            try {
                const data = await prasadamApi.getOrderById(orderId);
                setOrder(data);
            } catch (err: any) {
                console.error('Failed to load order:', err);
                setError(err.response?.data?.message || 'Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrder();
        }
    }, [orderId, isAuthenticated]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-[#5750F1] border-t-transparent animate-spin" />
                    </div>
                    <p className="text-gray-500">Loading order details...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        router.push('/login');
        return null;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Not Found</h1>
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                    <Button asChild className="bg-[#5750F1] hover:bg-[#4a43d6]">
                        <Link href="/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            View All Orders
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // No order found
    if (!order) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Not Found</h1>
                        <p className="text-muted-foreground">We couldn't find the order you're looking for.</p>
                    </div>
                    <Button asChild className="bg-[#5750F1] hover:bg-[#4a43d6]">
                        <Link href="/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            View All Orders
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-12">
            <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                </Link>

                {/* Success Banner */}
                <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                                Order Placed Successfully!
                            </h2>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                {statusMessages[order.status]}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Header */}
                <Card className="border-0 shadow-sm mb-6">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl mb-1">Order #{order.orderNumber}</CardTitle>
                                <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <Badge className={`${statusColors[order.status]} text-sm px-3 py-1.5 w-fit`}>
                                <span className="flex items-center gap-1.5">
                                    {statusIcons[order.status]}
                                    {order.status}
                                </span>
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UtensilsCrossed className="w-5 h-5 text-[#5750F1]" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(order.items as any[])?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#5750F1]/10 flex items-center justify-center">
                                                <UtensilsCrossed className="w-5 h-5 text-[#5750F1]" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500">₹{item.price} × {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-sm">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Order Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>₹{order.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg pt-2">
                                    <span>Total</span>
                                    <span className="text-[#5750F1]">₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Details */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                {order.deliveryType === 'DELIVERY' ? (
                                    <Bike className="w-5 h-5 text-[#5750F1]" />
                                ) : (
                                    <Store className="w-5 h-5 text-[#5750F1]" />
                                )}
                                {order.deliveryType === 'DELIVERY' ? 'Delivery Details' : 'Pickup Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Badge variant="outline" className="bg-white dark:bg-gray-800">
                                        {order.deliveryType}
                                    </Badge>
                                </div>

                                {order.deliveryType === 'PICKUP' ? (
                                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                        <p className="font-medium">Temple Prasadam Counter</p>
                                        <p className="text-gray-500">ISKCON Temple, Burla</p>
                                        <p className="text-xs text-gray-400 mt-3">
                                            Please show your order number when collecting your prasadam.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 text-sm">
                                        {(order as any).deliveryAddress && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <p className="text-gray-600 dark:text-gray-300">{(order as any).deliveryAddress}</p>
                                            </div>
                                        )}
                                        {(order as any).deliveryPhone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-600 dark:text-gray-300">{(order as any).deliveryPhone}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {(order as any).instructions && (
                                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4">
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Special Instructions</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-400">{(order as any).instructions}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline" className="border-gray-200">
                        <Link href="/orders">
                            View All Orders
                        </Link>
                    </Button>
                    <Button asChild className="bg-[#5750F1] hover:bg-[#4a43d6]">
                        <Link href="/prasadam">
                            Order More Prasadam
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
