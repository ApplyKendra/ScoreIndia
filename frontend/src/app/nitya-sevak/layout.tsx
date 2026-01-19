import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nitya Sevak Program - ISKCON Burla',
    description: 'Become a Nitya Sevak (eternal servant) of ISKCON Burla. Monthly donation program for continuous spiritual contribution and exclusive benefits.',
    keywords: ['Nitya Sevak', 'Monthly donation ISKCON', 'Regular temple donation', 'Lifetime membership ISKCON', 'Sevak program'],
    openGraph: {
        title: 'Nitya Sevak Program - ISKCON Burla',
        description: 'Become a Nitya Sevak of ISKCON Burla. Monthly donation program for continuous service.',
        url: 'https://www.iskconburla.com/nitya-sevak',
    },
};

export default function NityaSevakLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
