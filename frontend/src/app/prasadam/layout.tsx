import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Order Prasadam Online - ISKCON Burla',
    description: 'Order fresh, sattvic prasadam from ISKCON Burla. Authentic vegetarian food prepared with love and devotion. Breakfast, lunch, dinner, and sweets available for pickup and delivery.',
    keywords: ['Prasadam Burla', 'ISKCON food', 'Vegetarian food Sambalpur', 'Krishna Prasadam', 'Temple food delivery', 'Sattvic food Odisha'],
    openGraph: {
        title: 'Order Prasadam Online - ISKCON Burla',
        description: 'Order fresh, sattvic prasadam from ISKCON Burla. Authentic vegetarian food prepared with love.',
        url: 'https://www.iskconburla.com/prasadam',
    },
};

export default function PrasadamLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
