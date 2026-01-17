'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { prasadamApi, PrasadamOrder } from '@/lib/api/prasadam';

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    CONFIRMED: <Package className="h-4 w-4" />,
    PREPARING: <Package className="h-4 w-4" />,
    READY: <CheckCircle className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
};

export default function OrdersPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const [orders, setOrders] = useState<PrasadamOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await prasadamApi.getMyOrders();
                // Handle paginated response - extract orders array
                const ordersData = Array.isArray(response) ? response : (response as any).orders || [];
                setOrders(ordersData);
            } catch (error) {
                console.error('Failed to load orders:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        router.push('/login');
        return null;
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container max-w-4xl py-12">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                            <p className="text-muted-foreground mb-4">
                                You haven&apos;t placed any prasadam orders yet.
                            </p>
                            <a
                                href="/prasadam"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Order Prasadam
                            </a>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                    <Badge className={statusColors[order.status]}>
                                        <span className="flex items-center gap-1">
                                            {statusIcons[order.status]}
                                            {order.status}
                                        </span>
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Delivery Type</span>
                                        <Badge variant="outline">{order.deliveryType}</Badge>
                                    </div>

                                    <div className="border-t pt-3">
                                        <p className="text-sm font-medium mb-2">Items</p>
                                        <ul className="space-y-1">
                                            {(order.items as any[])?.map((item, idx) => (
                                                <li key={idx} className="flex justify-between text-sm">
                                                    <span>{item.name} x{item.quantity}</span>
                                                    <span>₹{item.price * item.quantity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="border-t pt-3 flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span>₹{order.totalAmount}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
