import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Temple Store - ISKCON Burla',
    description: 'Shop spiritual items from ISKCON Burla temple store. Books, japa beads, deities, incense, clothing, and more. Authentic spiritual merchandise delivered to your doorstep.',
    keywords: ['ISKCON store', 'Temple store Burla', 'Krishna books', 'Japa beads', 'Spiritual items', 'Bhagavad Gita', 'ISKCON merchandise'],
    openGraph: {
        title: 'Temple Store - ISKCON Burla',
        description: 'Shop spiritual items from ISKCON Burla temple store. Books, beads, deities, and more.',
        url: 'https://www.iskconburla.com/store',
    },
};

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
