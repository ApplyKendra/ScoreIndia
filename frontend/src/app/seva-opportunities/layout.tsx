import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Seva Opportunities - ISKCON Burla',
    description: 'Explore seva (volunteer) opportunities at ISKCON Burla. Serve in deity worship, cooking, teaching, outreach, and more. Experience the joy of devotional service.',
    keywords: ['Seva ISKCON', 'Volunteer temple', 'Devotional service', 'Temple seva Burla', 'Volunteer opportunities Odisha'],
    openGraph: {
        title: 'Seva Opportunities - ISKCON Burla',
        description: 'Explore seva opportunities at ISKCON Burla. Experience the joy of devotional service.',
        url: 'https://www.iskconburla.com/seva-opportunities',
    },
};

export default function SevaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
