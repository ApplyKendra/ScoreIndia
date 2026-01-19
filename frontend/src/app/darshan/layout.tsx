import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Live Darshan - ISKCON Burla Temple',
    description: 'Watch live darshan of Sri Sri Radha Krishna from ISKCON Burla temple. Experience the divine presence from anywhere in the world through our live streaming service.',
    keywords: ['Live Darshan ISKCON', 'ISKCON Burla darshan', 'Krishna darshan online', 'Temple live stream', 'Radha Krishna darshan'],
    openGraph: {
        title: 'Live Darshan - ISKCON Burla Temple',
        description: 'Watch live darshan of Sri Sri Radha Krishna from ISKCON Burla temple.',
        url: 'https://www.iskconburla.com/darshan',
    },
};

export default function DarshanLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
