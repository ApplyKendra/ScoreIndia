'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock, ChefHat, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    CONFIRMED: <CheckCircle className="h-4 w-4" />,
    PREPARING: <ChefHat className="h-4 w-4" />,
    READY: <Package className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />,
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<PrasadamOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PrasadamOrder | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await prasadamApi.getAdminOrders(
                statusFilter !== 'ALL' ? statusFilter : undefined
            );
            // Handle paginated response - extract orders array
            const ordersData = Array.isArray(response) ? response : (response as any).orders || [];
            setOrders(ordersData);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (newStatus === 'CANCELLED') {
            setSelectedOrder(orders.find(o => o.id === orderId) || null);
            setCancelDialogOpen(true);
            return;
        }

        setUpdating(orderId);
        try {
            await prasadamApi.updateOrderStatus(orderId, newStatus);
            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order status');
        } finally {
            setUpdating(null);
        }
    };

    const handleCancelConfirm = async () => {
        if (!selectedOrder) return;

        setUpdating(selectedOrder.id);
        try {
            await prasadamApi.updateOrderStatus(selectedOrder.id, 'CANCELLED', cancelReason);
            toast.success('Order cancelled');
            setCancelDialogOpen(false);
            setCancelReason('');
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to cancel order');
        } finally {
            setUpdating(null);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Prasadam Orders</h1>
                    <p className="text-muted-foreground">Manage incoming orders</p>
                </div>
                <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Orders</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="PREPARING">Preparing</SelectItem>
                            <SelectItem value="READY">Ready</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No orders found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>{order.user?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {(order.items as any[])?.length || 0} items
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">₹{order.totalAmount}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{order.deliveryType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[order.status]}>
                                                <span className="flex items-center gap-1">
                                                    {statusIcons[order.status]}
                                                    {order.status}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell>
                                            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                                    disabled={updating === order.id}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CONFIRMED">Confirm</SelectItem>
                                                        <SelectItem value="PREPARING">Preparing</SelectItem>
                                                        <SelectItem value="READY">Ready</SelectItem>
                                                        <SelectItem value="COMPLETED">Complete</SelectItem>
                                                        <SelectItem value="CANCELLED">Cancel</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel order {selectedOrder?.orderNumber}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
                            <Input
                                id="reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="e.g., Customer request, Out of stock"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Keep Order
                        </Button>
                        <Button variant="destructive" onClick={handleCancelConfirm} disabled={updating !== null}>
                            {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
