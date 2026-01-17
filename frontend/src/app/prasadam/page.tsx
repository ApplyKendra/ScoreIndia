'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, ShoppingCart, Loader2, Search, Sparkles, Star, Shield, Leaf, Clock, Heart, ArrowRight, UtensilsCrossed, ChevronRight, CheckCircle2, Coffee, Cake, Salad, Cookie, Soup, GlassWater, Utensils, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { prasadamApi, PrasadamCategory, PrasadamItem } from '@/lib/api/prasadam';
import { useCartStore } from '@/lib/stores/cart-store';
import Link from 'next/link';

// Category styles with SVG icons
const categoryColors: Record<string, { accent: string; bg: string; border: string; icon: React.ElementType }> = {
    'sweets': { accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Cake },
    'savories': { accent: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: Cookie },
    'beverages': { accent: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: GlassWater },
    'meals': { accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Utensils },
    'snacks': { accent: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Soup },
    'default': { accent: 'text-[#5750F1]', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: UtensilsCrossed },
};

const getCategoryStyle = (categoryName?: string) => {
    if (!categoryName) return categoryColors.default;
    const key = categoryName.toLowerCase();
    return categoryColors[key] || categoryColors.default;
};

// Trust indicators
const trustBadges = [
    { icon: Shield, text: 'Quality Assured', description: 'Premium ingredients' },
    { icon: Leaf, text: '100% Vegetarian', description: 'Pure veg kitchen' },
    { icon: Clock, text: 'Fresh Daily', description: 'Made fresh everyday' },
    { icon: CheckCircle2, text: 'Temple Certified', description: 'Blessed offerings' },
];

export default function PrasadamPage() {
    const [categories, setCategories] = useState<PrasadamCategory[]>([]);
    const [menuItems, setMenuItems] = useState<PrasadamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const { items: cartItems, addItem } = useCartStore();
    const itemCount = useCartStore((state) => state.getItemCount());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, items] = await Promise.all([
                    prasadamApi.getCategories(),
                    prasadamApi.getMenuItems(),
                ]);
                setCategories(cats);
                setMenuItems(items);
            } catch (error) {
                toast.error('Failed to load menu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getCartQuantity = (itemId: string) => {
        const cartItem = cartItems.find((item) => item.itemId === itemId);
        return cartItem?.quantity || 0;
    };

    const handleAddToCart = (item: PrasadamItem) => {
        addItem({
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
            maxQuantity: item.maxQuantityPerOrder,
        });
        toast.success(`Added ${item.name} to cart`);
    };

    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        return matchesCategory && matchesSearch;
    });

    const getCategoryItemCount = (categoryId: string) => {
        if (categoryId === 'all') return menuItems.length;
        return menuItems.filter(item => item.categoryId === categoryId).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-[#5750F1] border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <UtensilsCrossed className="h-8 w-8 text-[#5750F1]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-800 font-medium">Loading prasadam menu...</p>
                        <p className="text-gray-500 text-sm mt-1">Preparing divine offerings</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">

            {/* === Floating Cart Button === */}
            <Link href="/cart" className="fixed bottom-8 right-8 z-50 group">
                <div className="relative">
                    <Button
                        size="lg"
                        className="relative h-16 w-16 rounded-full bg-[#5750F1] hover:bg-[#4a43d6] hover:scale-110 transition-all duration-300 shadow-xl shadow-[#5750F1]/30"
                    >
                        <ShoppingCart className="h-10 w-10 text-white" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                                {itemCount}
                            </span>
                        )}
                    </Button>
                </div>
            </Link>

            {/* === HERO SECTION === */}
            <section className="relative bg-white border-b border-gray-100">
                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left Side - Content */}
                        <div className="text-center lg:text-left">
                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-8">
                                <Shield className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">Temple Certified Quality</span>
                            </div>

                            {/* Main Heading */}
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-gray-900 mb-6">
                                Sacred
                                <span className="block mt-2 text-[#5750F1]">
                                    Prasadam
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                                Pure vegetarian offerings prepared with devotion in our temple kitchen.
                                Every item is blessed and made with the highest quality ingredients.
                            </p>

                            {/* Browse Menu Button */}
                            <div className="max-w-lg mx-auto lg:mx-0 mb-8">
                                <Button
                                    onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    size="lg"
                                    className="group w-full px-8 py-6 text-base font-semibold bg-[#5750F1] hover:bg-[#4a43d6] text-white shadow-xl shadow-[#5750F1]/20 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Browse Menu
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rotate-90" />
                                    </span>
                                </Button>
                            </div>

                            {/* Trust Badges Grid */}
                            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
                                {trustBadges.map((badge) => {
                                    const Icon = badge.icon;
                                    return (
                                        <div
                                            key={badge.text}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-[#5750F1]/10 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-[#5750F1]" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-900">{badge.text}</p>
                                                <p className="text-xs text-gray-500">{badge.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side - Bulk Order Card */}
                        <div className="relative flex items-center justify-center">
                            {/* Bulk Order Display Card */}
                            <div className="relative w-full max-w-md">
                                {/* Main Card */}
                                <div className="relative bg-gradient-to-br from-[#5750F1] via-[#6B5DD3] to-[#7C3AED] rounded-3xl overflow-hidden shadow-xl shadow-[#5750F1]/30">
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full translate-y-16 -translate-x-16 blur-xl" />

                                    {/* Content */}
                                    <div className="relative p-8">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 font-medium backdrop-blur-sm">
                                                <Utensils className="w-3 h-3 mr-1" />
                                                Bulk Orders
                                            </Badge>
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                <Sparkles className="w-5 h-5 text-white" />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-bold text-white mb-3">Order for Special Events</h3>
                                        <p className="text-white/90 mb-6 leading-relaxed">
                                            Planning a special occasion? We cater to all your prasadam needs for:
                                        </p>

                                        {/* Event Types Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {[
                                                { name: 'Marriages', Icon: Heart },
                                                { name: 'Birthdays', Icon: Cake },
                                                { name: 'Shradh', Icon: Star },
                                                { name: 'Home Festivals', Icon: Sparkles },
                                            ].map((event) => (
                                                <div key={event.name} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-2.5 rounded-xl border border-white/20">
                                                    <event.Icon className="w-4 h-4 text-white" />
                                                    <span className="text-sm font-medium text-white">{event.name}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Additional Text */}
                                        <p className="text-white/80 text-sm mb-6 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Also for Kitty Parties, Office Events & Get-togethers
                                        </p>

                                        {/* CTA */}
                                        <Link href="/contact-us">
                                            <Button className="w-full h-12 bg-white hover:bg-gray-100 text-[#5750F1] font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                                                <span className="flex items-center gap-2">
                                                    Enquire Now
                                                    <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Floating Mini Cards - Repositioned */}
                                <div className="absolute -left-4 bottom-20 bg-white rounded-2xl border border-gray-200 p-3 shadow-lg">
                                    <Users className="w-6 h-6 text-[#5750F1]" />
                                </div>
                                <div className="absolute -right-4 top-20 bg-white rounded-2xl border border-gray-200 p-3 shadow-lg">
                                    <Coffee className="w-6 h-6 text-purple-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === CATEGORY NAVIGATION === */}
            <section className="sticky top-0 z-40 bg-gray-100 backdrop-blur-lg border-b border-gray-200 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                        {/* All Items Button */}
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-300 ${activeCategory === 'all'
                                ? 'bg-[#5750F1] text-white border-[#5750F1] shadow-lg shadow-[#5750F1]/20'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Sparkles className="w-5 h-5" />
                            <div className="text-left">
                                <p className="font-semibold text-sm">All Items</p>
                                <p className="text-xs opacity-70">{getCategoryItemCount('all')} items</p>
                            </div>
                        </button>

                        {/* Category Buttons */}
                        {categories.map((cat) => {
                            const catStyle = getCategoryStyle(cat.name);
                            const isActive = activeCategory === cat.id;
                            const IconComponent = catStyle.icon;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-300 ${isActive
                                        ? 'bg-[#5750F1] text-white border-[#5750F1] shadow-lg shadow-[#5750F1]/20'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">{cat.name}</p>
                                        <p className="text-xs opacity-70">{getCategoryItemCount(cat.id)} items</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* === PRODUCT GRID === */}
            <section id="menu-section" className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {activeCategory === 'all'
                                    ? 'All Menu Items'
                                    : categories.find(c => c.id === activeCategory)?.name || 'Menu'}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                {filteredItems.length} items available
                            </p>
                        </div>

                        <Link href="/cart" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                            <ShoppingCart className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-600">View Cart</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                    </div>

                    {/* Empty State */}
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <Search className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No items found</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                We couldn't find any prasadam matching your search. Try adjusting your filters.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        /* Product Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredItems.map((item) => {
                                const cartQty = getCartQuantity(item.id);
                                const isAvailable = item.isAvailable;
                                const isHovered = hoveredItem === item.id;
                                const catStyle = getCategoryStyle(item.category?.name);
                                const IconComponent = catStyle.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="group"
                                        onMouseEnter={() => setHoveredItem(item.id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    >
                                        {/* Card */}
                                        <div className={`relative h-full bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 ${isHovered
                                            ? 'border-[#5750F1] shadow-xl shadow-[#5750F1]/10 -translate-y-2'
                                            : 'border-gray-100 shadow-sm hover:shadow-md'
                                            }`}>

                                            {/* Image Area */}
                                            <div className={`relative h-48 overflow-hidden ${!item.imageUrl ? catStyle.bg : 'bg-gray-100'}`}>
                                                {/* Product Image or Icon */}
                                                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                                                            <IconComponent className={`w-10 h-10 ${catStyle.accent}`} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Price Badge */}
                                                <div className="absolute top-4 right-4">
                                                    <div className="bg-white text-gray-900 px-3 py-1.5 rounded-lg font-bold text-sm shadow-md border border-gray-100">
                                                        ₹{item.price}
                                                    </div>
                                                </div>

                                                {/* Veg Badge */}
                                                <div className="absolute top-4 left-4">
                                                    <div className="bg-white border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                                                        <div className="w-3 h-3 border-2 border-emerald-500 rounded-sm flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                        </div>
                                                        <span className="text-xs font-medium text-emerald-700">Veg</span>
                                                    </div>
                                                </div>

                                                {/* Unavailable Overlay */}
                                                {!isAvailable && (
                                                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                                                        <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-4 py-2">
                                                            Currently Unavailable
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Quick Add Button (appears on hover) */}
                                                {isAvailable && cartQty === 0 && (
                                                    <div className={`absolute bottom-4 left-0 right-0 px-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                                        <Button
                                                            onClick={() => handleAddToCart(item)}
                                                            className="w-full h-11 rounded-xl bg-[#5750F1] hover:bg-[#4a43d6] text-white font-semibold shadow-lg transition-all"
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Add to Cart
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                {/* Category Tag */}
                                                {item.category && (
                                                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-md ${catStyle.bg} ${catStyle.accent} mb-3`}>
                                                        {item.category.name}
                                                    </span>
                                                )}

                                                {/* Title */}
                                                <h3 className={`font-bold text-lg text-gray-900 mb-2 transition-colors ${isHovered ? 'text-[#5750F1]' : ''}`}>
                                                    {item.name}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
                                                    {item.description || 'Delicious prasadam prepared with devotion and pure ingredients.'}
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                    {/* Rating - 5 Stars */}
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                        ))}
                                                        <span className="text-sm font-medium text-gray-700 ml-1">5.0</span>
                                                    </div>

                                                    {/* Cart Controls */}
                                                    {isAvailable && cartQty > 0 ? (
                                                        <div className="flex items-center gap-2 bg-[#5750F1] rounded-lg px-3 py-1.5">
                                                            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                                                                <span className="text-xs font-bold text-white">{cartQty}</span>
                                                            </div>
                                                            <span className="text-xs font-medium text-white/80">in cart</span>
                                                            <button
                                                                onClick={() => handleAddToCart(item)}
                                                                disabled={cartQty >= item.maxQuantityPerOrder}
                                                                className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                                                            >
                                                                <Plus className="w-3 h-3 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : isAvailable ? (
                                                        <button
                                                            onClick={() => handleAddToCart(item)}
                                                            className="px-4 py-2 rounded-lg bg-[#5750F1]/10 text-[#5750F1] text-sm font-semibold hover:bg-[#5750F1]/20 transition-all"
                                                        >
                                                            Add +
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* === BOTTOM CTA SECTION === */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative">
                        {/* Card */}
                        <div className="relative bg-gradient-to-br from-[#5750F1] to-indigo-600 rounded-3xl p-8 sm:p-12 text-white overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

                            <div className="relative z-10">
                                <Shield className="w-12 h-12 text-white/80 mx-auto mb-4" />
                                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                                    Quality You Can Trust
                                </h3>
                                <p className="text-white/80 max-w-lg mx-auto mb-8">
                                    Every prasadam item is prepared in our temple kitchen with pure ingredients and offered to the Lord with devotion.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/cart">
                                        <Button size="lg" className="px-8 py-6 text-base font-semibold bg-white text-[#5750F1] hover:bg-gray-100 rounded-xl shadow-xl">
                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                            View Cart ({itemCount})
                                        </Button>
                                    </Link>
                                    <Link href="/">
                                        <Button variant="outline" size="lg" className="px-8 py-6 text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl">
                                            Explore Temple
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === FOOTER QUOTE === */}
            <section className="py-12 bg-gray-50 border-t border-gray-100">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <blockquote className="text-xl sm:text-2xl font-medium italic text-gray-700 leading-relaxed">
                        "Prasadam is the mercy of Lord Krishna. By honoring prasadam, we receive His divine blessings."
                    </blockquote>
                    <p className="mt-4 text-[#5750F1] font-semibold">— Srila Prabhupada</p>
                </div>
            </section>
        </div>
    );
}
