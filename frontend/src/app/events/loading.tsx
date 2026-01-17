'use client';

import { CardSkeleton } from '@/components/ui/skeleton-loaders';
import { Skeleton } from '@/components/ui/skeleton-loaders';

export default function EventsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
            {/* Hero Section Skeleton */}
            <section className="relative pt-20 pb-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <Skeleton className="h-8 w-40 mx-auto mb-4 bg-white/10 rounded-full" />
                    <Skeleton className="h-12 w-64 mx-auto mb-3 bg-white/10" />
                    <Skeleton className="h-5 w-72 mx-auto bg-white/10" />
                </div>
            </section>

            {/* Events Grid Skeleton */}
            <section className="relative pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <CardSkeleton count={4} />
                </div>
            </section>
        </div>
    );
}
