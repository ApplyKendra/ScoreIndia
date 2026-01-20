'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, UtensilsCrossed, MapPin, Phone, FileText, Bike, Store, ShoppingCart, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { prasadamApi } from '@/lib/api/prasadam';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const MIN_ITEMS_FOR_DELIVERY = 10;
const DELIVERY_FEE = 50;

export default function CartPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isAuthenticated, _sessionVerified, isLoading } = useAuthStore();

    const {
        items,
        deliveryType,
        deliveryAddress,
        deliveryPhone,
        instructions,
        removeItem,
        updateQuantity,
        clearCart,
        setDeliveryType,
        setDeliveryAddress,
        setDeliveryPhone,
        setInstructions,
        getSubtotal,
        getDeliveryFee,
        getTotal,
    } = useCartStore();

    // Calculate total item count
    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const isDeliveryAllowed = totalItemCount >= MIN_ITEMS_FOR_DELIVERY;

    // Auto-switch to pickup if delivery is not allowed
    useEffect(() => {
        if (!isDeliveryAllowed && deliveryType === 'DELIVERY') {
            setDeliveryType('PICKUP');
        }
    }, [isDeliveryAllowed, deliveryType, setDeliveryType]);

    const handleCheckout = async () => {
        // Wait for session verification before checking auth
        if (!_sessionVerified || isLoading) {
            toast.info('Verifying your session...');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please login to place an order');
            router.push('/login');
            return;
        }

        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        if (deliveryType === 'DELIVERY' && (!deliveryAddress || !deliveryPhone)) {
            toast.error('Please provide delivery address and phone number');
            return;
        }

        setIsSubmitting(true);
        try {
            const order = await prasadamApi.createOrder({
                deliveryType,
                items: items.map((item) => ({
                    itemId: item.itemId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
                deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
                deliveryPhone: deliveryType === 'DELIVERY' ? deliveryPhone : undefined,
                instructions,
            });

            clearCart();
            toast.success('Order placed successfully!');
            router.push(`/orders/${order.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-4">
                <div className="max-w-md w-full text-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#5750F1]/10 flex items-center justify-center mb-4 sm:mb-6">
                        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-[#5750F1]" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Your Cart is Empty</h1>
                        <p className="text-muted-foreground text-base sm:text-lg px-4">
                            Looks like you haven't added anything yet.
                            Browse our prasadam menu to find something divine.
                        </p>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="bg-[#5750F1] hover:bg-[#4a43d6] shadow-lg shadow-[#5750F1]/20 font-semibold px-6 sm:px-8 py-5 sm:py-6 rounded-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Link href="/prasadam">
                            <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            Return to Menu
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-12">
            <div className="container px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="h-8 sm:h-10 w-1 bg-[#5750F1] rounded-full" />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Shopping Cart ({items.length})</h1>
                </div>

                {/* Delivery Policy Info Banner */}
                <div className="mb-4 sm:mb-6 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#5750F1] flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                            <p className="font-semibold mb-1 text-slate-800 dark:text-slate-100">Delivery Information</p>
                            <ul className="space-y-0.5 sm:space-y-1 text-slate-600 dark:text-slate-300">
                                <li>• Delivery is available for orders with <span className="font-semibold text-[#5750F1]">10 or more items</span></li>
                                <li>• A flat delivery fee of <span className="font-semibold text-[#5750F1]">₹{DELIVERY_FEE}</span> applies to all deliveries</li>
                                <li>• For smaller orders, please use our convenient <span className="font-semibold">Store Pickup</span> option</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pb-8 sm:pb-12">
                    {/* Cart Items Section */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
                            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 py-3 sm:pb-4 px-3 sm:px-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-[#5750F1]" />
                                    Order Items
                                    <span className="ml-auto text-xs sm:text-sm font-normal text-gray-500">
                                        {totalItemCount} item{totalItemCount !== 1 ? 's' : ''} total
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.map((item) => (
                                        <div key={item.itemId} className="p-3 sm:p-6 transition-colors hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                {/* Item Icon */}
                                                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-[#5750F1]/5 flex items-center justify-center flex-shrink-0 border border-[#5750F1]/10">
                                                    <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-[#5750F1]" />
                                                </div>

                                                {/* Item Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
                                                        <div className="min-w-0">
                                                            <h3 className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white truncate">
                                                                {item.name}
                                                            </h3>
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                ₹{item.price} per item
                                                            </p>
                                                        </div>
                                                        <p className="font-bold text-base sm:text-lg text-[#5750F1] whitespace-nowrap">
                                                            ₹{item.price * item.quantity}
                                                        </p>
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex items-center justify-between mt-2 sm:mt-4">
                                                        <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 bg-white dark:bg-gray-950">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => {
                                                                    if (item.quantity > 1) {
                                                                        updateQuantity(item.itemId, item.quantity - 1);
                                                                    } else {
                                                                        removeItem(item.itemId);
                                                                    }
                                                                }}
                                                            >
                                                                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            </Button>
                                                            <span className="w-8 sm:w-10 text-center font-semibold text-xs sm:text-sm">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md hover:text-[#5750F1] hover:bg-[#5750F1]/10"
                                                                onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                                                disabled={item.quantity >= item.maxQuantity}
                                                            >
                                                                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            </Button>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-gray-400 hover:text-red-500 hover:bg-transparent h-7 sm:h-auto px-2 sm:px-3"
                                                            onClick={() => removeItem(item.itemId)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                                                            <span className="hidden sm:inline text-xs">Remove</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Options */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="py-3 sm:pb-4 px-3 sm:px-6">
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    Order Instructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                                <Label htmlFor="instructions" className="sr-only">Special Instructions</Label>
                                <Textarea
                                    id="instructions"
                                    placeholder="Add notes for the kitchen (e.g., less spicy, extra packing...)"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="min-h-[80px] sm:min-h-[100px] resize-none border-gray-200 focus:border-[#5750F1] text-sm"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Checkout Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Delivery Details */}
                        <Card className="border-0 shadow-sm overflow-hidden lg:sticky lg:top-24">
                            <CardHeader className="bg-[#5750F1]/5 border-b border-[#5750F1]/10 py-3 sm:pb-4 px-3 sm:px-6">
                                <CardTitle className="text-base sm:text-lg text-[#5750F1]">Delivery Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                                <Tabs value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'PICKUP' | 'DELIVERY')} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-auto">
                                        <TabsTrigger
                                            value="PICKUP"
                                            className="data-[state=active]:bg-[#5750F1] data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm py-2 sm:py-2.5"
                                        >
                                            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                            Pickup
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="DELIVERY"
                                            disabled={!isDeliveryAllowed}
                                            className="data-[state=active]:bg-[#5750F1] data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm py-2 sm:py-2.5 disabled:opacity-50"
                                        >
                                            <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                            Delivery
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="DELIVERY" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2.5 sm:p-3 text-xs sm:text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                            <Bike className="w-4 h-4 flex-shrink-0" />
                                            <span>Delivery fee: <span className="font-semibold">₹{DELIVERY_FEE}</span> (flat rate)</span>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="address" className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Delivery Address
                                            </Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                <Textarea
                                                    id="address"
                                                    placeholder="Enter full delivery address..."
                                                    value={deliveryAddress}
                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                    className="pl-8 sm:pl-9 min-h-[60px] sm:min-h-[80px] resize-none focus-visible:ring-[#5750F1] text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <Label htmlFor="phone" className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Phone Number
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-2.5 sm:left-3 top-2 sm:top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={deliveryPhone}
                                                    onChange={(e) => setDeliveryPhone(e.target.value)}
                                                    className="pl-8 sm:pl-9 focus-visible:ring-[#5750F1] text-sm h-9 sm:h-10"
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="PICKUP" className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="rounded-lg bg-green-50 border border-green-100 p-3 sm:p-4 text-xs sm:text-sm text-green-800 flex items-start gap-2 sm:gap-3">
                                            <Store className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold mb-0.5 sm:mb-1">Store Pickup</p>
                                                <p className="opacity-90 text-xs sm:text-sm">Pickup your order directly from the temple counter. No delivery fee applied.</p>
                                            </div>
                                        </div>

                                        {!isDeliveryAllowed && (
                                            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-2.5 sm:p-3 text-xs text-amber-700 flex items-start gap-2">
                                                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                <span>
                                                    Add <span className="font-semibold">{MIN_ITEMS_FOR_DELIVERY - totalItemCount} more item{MIN_ITEMS_FOR_DELIVERY - totalItemCount !== 1 ? 's' : ''}</span> to unlock delivery option.
                                                </span>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                <Separator />

                                {/* Summary */}
                                <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-500">Subtotal ({totalItemCount} items)</span>
                                        <span className="font-medium">₹{getSubtotal()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            Delivery Fee
                                            {deliveryType === 'PICKUP' && <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">FREE</span>}
                                        </span>
                                        <span className="font-medium">₹{getDeliveryFee()}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center py-1 sm:py-2">
                                        <div>
                                            <span className="block text-xs sm:text-sm text-gray-500">Total Amount</span>
                                            <span className="text-xl sm:text-2xl font-bold text-[#5750F1]">₹{getTotal()}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-10 sm:h-12 text-sm sm:text-base bg-[#5750F1] hover:bg-[#4a43d6] shadow-lg shadow-[#5750F1]/25 hover:shadow-[#5750F1]/40 transition-all duration-300 rounded-xl"
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Confirm Order</span>
                                            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[10px] sm:text-xs text-center text-gray-400">
                                    Secure checkout powered by ISKCON Burla
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
