'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800",
                "before:absolute before:inset-0 before:-translate-x-full",
                "before:animate-[shimmer_1.5s_infinite]",
                "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
                "dark:before:via-white/10",
                className
            )}
        />
    );
}

// Hero section skeleton
export function HeroSkeleton() {
    return (
        <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center min-h-[auto] lg:min-h-[70vh]">
                    {/* Left Side - Text Content */}
                    <div className="text-center lg:text-left space-y-6">
                        {/* Badge */}
                        <Skeleton className="h-8 w-48 mx-auto lg:mx-0 bg-white/10" />

                        {/* Main Heading */}
                        <div className="space-y-3">
                            <Skeleton className="h-12 sm:h-16 w-3/4 mx-auto lg:mx-0 bg-white/10" />
                            <Skeleton className="h-12 sm:h-16 w-full mx-auto lg:mx-0 bg-white/10" />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-white/10" />
                            <Skeleton className="h-4 w-5/6 mx-auto lg:mx-0 bg-white/10" />
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-24 bg-white/10 rounded-full" />
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                            <Skeleton className="h-12 w-36 bg-white/20 rounded-xl" />
                            <Skeleton className="h-12 w-32 bg-white/10 rounded-xl" />
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-white/10">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="text-center">
                                    <Skeleton className="h-8 w-16 bg-white/10 mx-auto mb-2" />
                                    <Skeleton className="h-3 w-20 bg-white/10" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Slideshow Placeholder */}
                    <div className="hidden lg:flex items-center justify-center">
                        <Skeleton className="w-[360px] h-[500px] rounded-3xl bg-white/10" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// Services grid skeleton
export function ServicesSkeleton() {
    return (
        <section className="mt-6 sm:mt-8 md:mt-10 px-3 sm:px-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-4 sm:mb-5 flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 p-3 sm:p-5 border border-gray-200 dark:border-white/10">
                            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg mb-3 sm:mb-4" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Explore section skeleton
export function ExploreSkeleton() {
    return (
        <section className="mt-10 sm:mt-16 px-3 sm:px-4">
            <div className="mx-auto max-w-7xl">
                <div className="mb-5 sm:mb-8 text-center">
                    <Skeleton className="h-6 w-24 mx-auto mb-3 rounded-full" />
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    <Skeleton className="h-28 sm:h-40 rounded-xl sm:rounded-2xl" />
                    <Skeleton className="h-28 sm:h-40 rounded-xl sm:rounded-2xl" />
                    <Skeleton className="h-32 sm:h-48 rounded-xl sm:rounded-2xl col-span-2" />
                </div>
            </div>
        </section>
    );
}

// Full page skeleton
export function PageSkeleton() {
    return (
        <div className="animate-pulse">
            <HeroSkeleton />
            <ServicesSkeleton />
            <ExploreSkeleton />
        </div>
    );
}

// Card skeleton (for prasadam, store items, etc.)
export function CardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-10 w-28 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// List item skeleton
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            ))}
        </div>
    );
}
