'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, MessageCircle, Star, Package, BookOpen, Shield, Award, Truck, CheckCircle2, Heart, ArrowRight, Gem, Flame, Music, Sparkles, ChevronDown, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storeApi, StoreItem, StoreCategory } from '@/lib/api/store';

// Category styles with warm amber theme for differentiation
const categoryStyles: Record<string, { accent: string; bg: string; border: string; icon: React.ElementType; gradient: string }> = {
    'books': { accent: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: BookOpen, gradient: 'from-amber-100 to-orange-100' },
    'artifacts': { accent: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: Gem, gradient: 'from-rose-100 to-pink-100' },
    'clothing': { accent: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: Sparkles, gradient: 'from-violet-100 to-purple-100' },
    'puja items': { accent: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: Flame, gradient: 'from-orange-100 to-red-100' },
    'music': { accent: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Music, gradient: 'from-cyan-100 to-blue-100' },
    'default': { accent: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Package, gradient: 'from-amber-100 to-yellow-100' },
};

const getCategoryStyle = (categoryName?: string) => {
    if (!categoryName) return categoryStyles.default;
    const key = categoryName.toLowerCase();
    return categoryStyles[key] || categoryStyles.default;
};

// Trust indicators with store-specific messaging
const trustBadges = [
    { icon: Shield, text: 'Quality Assured', description: 'Premium materials' },
    { icon: Award, text: 'Authentic Items', description: 'Genuine artifacts' },
    { icon: Truck, text: 'Fast Delivery', description: 'Quick shipping' },
    { icon: CheckCircle2, text: 'Temple Approved', description: 'Blessed items' },
];

export default function StorePage() {
    const [items, setItems] = useState<StoreItem[]>([]);
    const [categories, setCategories] = useState<StoreCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsData, catsData] = await Promise.all([
                    storeApi.getItems(),
                    storeApi.getCategories(),
                ]);
                setItems(itemsData);
                setCategories(catsData);
            } catch (error) {
                toast.error('Failed to load store items');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'ALL' || item.categoryId === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const getCategoryItemCount = (categoryId: string) => {
        if (categoryId === 'ALL') return items.length;
        return items.filter(item => item.categoryId === categoryId).length;
    };

    const handleWhatsAppInquiry = (item: StoreItem) => {
        const message = `Hare Krishna! I am interested in checking availability for: ${item.name}`;
        const url = `https://wa.me/919999999999?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Get a featured item for display
    const featuredItem = items.find(item => item.isFeatured) || items[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
                        <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-800 font-medium">Loading temple store...</p>
                        <p className="text-gray-500 text-sm mt-1">Preparing sacred items</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50 text-gray-900">

            {/* === Floating WhatsApp Button === */}
            <a
                href="https://wa.me/919999999999?text=Hare%20Krishna!%20I%20would%20like%20to%20inquire%20about%20items%20in%20your%20temple%20store."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 group sm:bottom-8 sm:right-8"
            >
                <div className="relative">
                    <Button
                        size="lg"
                        className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-600 hover:bg-green-700 hover:scale-110 transition-all duration-300 shadow-xl shadow-green-600/30"
                    >
                        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </Button>
                    <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 animate-pulse" />
                </div>
            </a>

            {/* === HERO SECTION - Unique Warm Theme === */}
            <section className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 overflow-hidden">
                {/* Decorative Background Pattern - Bookshelf Style */}
                <div className="absolute inset-0" aria-hidden>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImJvb2tzaGVsZiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48cmVjdCB4PSI1IiB5PSI1IiB3aWR0aD0iMTIiIGhlaWdodD0iNTAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgcng9IjIiLz48cmVjdCB4PSIyMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0NSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgcng9IjIiLz48cmVjdCB4PSIzNSIgeT0iMyIgd2lkdGg9IjgiIGhlaWdodD0iNTIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xMikiIHJ4PSIyIi8+PHJlY3QgeD0iNDgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjQ3IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIiByeD0iMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNib29rc2hlbGYpIi8+PC9zdmc+')] opacity-50" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-yellow-400/20 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    {/* Single Column Hero - Mobile First */}
                    <div className="text-center max-w-3xl mx-auto">
                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6 sm:mb-8">
                            <BookOpen className="w-4 h-4 text-white" />
                            <span className="text-xs sm:text-sm font-medium text-white">Spiritual Books & Sacred Items</span>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white mb-4 sm:mb-6">
                            Temple Store
                        </h1>

                        {/* Description */}
                        <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                            Browse our collection of spiritual books, artifacts, and devotional items.
                            Contact us on WhatsApp for inquiries.
                        </p>

                        {/* Search Bar - Optimized for Mobile */}
                        <div className="relative max-w-lg mx-auto mb-6 sm:mb-8 px-2">
                            <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-black/10">
                                <Search className="ml-4 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Search books, items..."
                                    className="h-12 sm:h-14 bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 text-base"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mr-2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setSearch('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Trust Badges - 2x2 Grid on Mobile, 4 columns on Desktop */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto px-2">
                            {trustBadges.map((badge) => {
                                const Icon = badge.icon;
                                return (
                                    <div
                                        key={badge.text}
                                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <div className="text-left min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-white truncate">{badge.text}</p>
                                            <p className="text-[10px] sm:text-xs text-white/70 hidden sm:block">{badge.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Wave Decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 sm:h-12">
                        <path d="M0,40 C320,80 420,0 720,40 C1020,80 1120,0 1440,40 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.1)" />
                        <path d="M0,50 C360,90 540,10 720,50 C900,90 1080,10 1440,50 L1440,60 L0,60 Z" fill="white" className="fill-amber-50/50 dark:fill-gray-900" />
                    </svg>
                </div>
            </section>

            {/* === MOBILE CATEGORY FILTER BUTTON === */}
            <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="px-4 py-3">
                    <Button
                        variant="outline"
                        onClick={() => setMobileFilterOpen(true)}
                        className="w-full justify-between h-11 border-amber-200 hover:bg-amber-50"
                    >
                        <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">
                                {activeCategory === 'ALL'
                                    ? 'All Categories'
                                    : categories.find(c => c.id === activeCategory)?.name || 'Category'}
                            </span>
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                </div>
            </div>

            {/* === MOBILE CATEGORY BOTTOM SHEET === */}
            {mobileFilterOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Select Category</h3>
                                <Button variant="ghost" size="icon" onClick={() => setMobileFilterOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
                            {/* All Items */}
                            <button
                                onClick={() => { setActiveCategory('ALL'); setMobileFilterOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${activeCategory === 'ALL'
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                                    }`}
                            >
                                <Sparkles className="w-5 h-5" />
                                <span className="font-medium">All Items</span>
                                <span className="ml-auto text-sm opacity-70">{getCategoryItemCount('ALL')}</span>
                            </button>

                            {categories.map((cat) => {
                                const catStyle = getCategoryStyle(cat.name);
                                const isActive = activeCategory === cat.id;
                                const IconComponent = catStyle.icon;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setActiveCategory(cat.id); setMobileFilterOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                                ? 'bg-amber-600 text-white border-amber-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="font-medium">{cat.name}</span>
                                        <span className="ml-auto text-sm opacity-70">{getCategoryItemCount(cat.id)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* === MAIN CONTENT WITH SIDEBAR === */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="flex gap-8">

                    {/* === DESKTOP SIDEBAR CATEGORIES === */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-8 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Categories</h3>

                            {/* All Items */}
                            <button
                                onClick={() => setActiveCategory('ALL')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${activeCategory === 'ALL'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                                    }`}
                            >
                                <Sparkles className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-semibold text-sm">All Items</p>
                                    <p className="text-xs opacity-70">{getCategoryItemCount('ALL')} items</p>
                                </div>
                            </button>

                            {categories.map((cat) => {
                                const catStyle = getCategoryStyle(cat.name);
                                const isActive = activeCategory === cat.id;
                                const IconComponent = catStyle.icon;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
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

                            {/* WhatsApp Quick Contact */}
                            <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
                                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                                <p className="text-xs text-gray-600 mb-3">Contact us on WhatsApp for inquiries</p>
                                <a
                                    href="https://wa.me/919999999999"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
                                >
                                    Chat Now
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* === PRODUCT GRID === */}
                    <main className="flex-1 min-w-0">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {activeCategory === 'ALL'
                                        ? 'All Items'
                                        : categories.find(c => c.id === activeCategory)?.name || 'Items'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    {filteredItems.length} items available
                                </p>
                            </div>
                        </div>

                        {/* Empty State */}
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-16 sm:py-20">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No items found</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto px-4">
                                    We couldn't find any items matching your search. Try adjusting your filters.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => { setSearch(''); setActiveCategory('ALL'); }}
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            /* Product Grid - Responsive */
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                {filteredItems.map((item) => {
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
                                            {/* Card with Book-style Effect */}
                                            <div className={`relative h-full bg-white rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 ${isHovered
                                                    ? 'border-amber-400 shadow-xl shadow-amber-200/50 -translate-y-1 sm:-translate-y-2'
                                                    : 'border-amber-100 shadow-sm hover:shadow-lg'
                                                }`}>
                                                {/* Book Spine Effect - Left Border */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 bg-gradient-to-b ${catStyle.gradient} opacity-80`} />

                                                {/* Image Area */}
                                                <div className={`relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br ${catStyle.gradient} ml-1.5 sm:ml-2`}>
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            fill
                                                            className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}
                                                        />
                                                    ) : (
                                                        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110' : ''}`}>
                                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                                                                <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 ${catStyle.accent}`} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Price Badge */}
                                                    <div className="absolute top-3 right-3">
                                                        <div className="bg-white text-gray-900 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm shadow-md border border-gray-100">
                                                            {item.displayPrice ? `₹${item.displayPrice}` : 'Contact'}
                                                        </div>
                                                    </div>

                                                    {/* Featured Badge */}
                                                    {item.isFeatured && (
                                                        <div className="absolute top-3 left-3 ml-1.5 sm:ml-0">
                                                            <Badge className="bg-amber-500 text-white border-0 px-2 py-0.5 text-xs font-medium shadow-sm">
                                                                <Star className="w-3 h-3 mr-1 fill-white" />
                                                                Featured
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {/* Out of Stock Overlay */}
                                                    {!item.inStock && (
                                                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                                                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs sm:text-sm px-3 py-1.5">
                                                                Out of Stock
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 sm:p-5 ml-1.5 sm:ml-2">
                                                    {/* Category Tag */}
                                                    {item.category && (
                                                        <span className={`inline-block text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md ${catStyle.bg} ${catStyle.accent} mb-2`}>
                                                            {item.category.name}
                                                        </span>
                                                    )}

                                                    {/* Title */}
                                                    <h3 className={`font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-1 transition-colors ${isHovered ? 'text-amber-700' : ''}`}>
                                                        {item.name}
                                                    </h3>

                                                    {/* Author */}
                                                    {item.author && (
                                                        <p className="text-xs sm:text-sm text-gray-500 mb-2">by {item.author}</p>
                                                    )}

                                                    {/* Description */}
                                                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3 sm:mb-4 min-h-[32px] sm:min-h-[40px]">
                                                        {item.description}
                                                    </p>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                                                        {/* Rating */}
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                                                            <span className="text-xs sm:text-sm font-medium text-gray-700">4.8</span>
                                                        </div>

                                                        {/* Inquiry Button */}
                                                        {item.inStock ? (
                                                            <button
                                                                onClick={() => handleWhatsAppInquiry(item)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-50 text-green-700 text-xs sm:text-sm font-semibold hover:bg-green-100 transition-all border border-green-200"
                                                            >
                                                                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                <span>Inquire</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs sm:text-sm text-gray-400">Unavailable</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* === BOTTOM CTA SECTION === */}
            <section className="py-12 sm:py-16 bg-white border-t border-gray-100">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative">
                        {/* Card */}
                        <div className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-yellow-400/20 rounded-full translate-y-16 -translate-x-16 blur-2xl" />

                            <div className="relative z-10">
                                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white/80 mx-auto mb-4" />
                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
                                    Can't Find What You're Looking For?
                                </h3>
                                <p className="text-white/80 max-w-lg mx-auto mb-6 sm:mb-8 text-sm sm:text-base">
                                    We have a vast collection of spiritual books, artifacts, and devotional items. Contact us directly on WhatsApp for custom requests.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                    <a
                                        href="https://wa.me/919999999999?text=Hare%20Krishna!%20I%20am%20looking%20for%20a%20specific%20item..."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-white text-amber-700 hover:bg-amber-50 rounded-xl shadow-xl">
                                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            Contact on WhatsApp
                                        </Button>
                                    </a>
                                    <a href="/">
                                        <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl">
                                            Explore Temple
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* === FOOTER QUOTE === */}
            <section className="py-10 sm:py-12 bg-amber-50/50 border-t border-amber-100">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium italic text-gray-700 leading-relaxed">
                        "A person who has unflinching faith in the Lord, the spiritual master, and the scriptures, is actually a liberated soul."
                    </blockquote>
                    <p className="mt-4 text-amber-700 font-semibold">— Srila Prabhupada</p>
                </div>
            </section>
        </div>
    );
}
