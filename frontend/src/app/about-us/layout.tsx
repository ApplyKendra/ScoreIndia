import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us - ISKCON Burla',
    description: 'Learn about ISKCON Burla temple, our mission, history, and spiritual programs. Discover how we are spreading Krishna consciousness in Sambalpur and Odisha region.',
    keywords: ['About ISKCON Burla', 'ISKCON history', 'Krishna temple Sambalpur', 'ISKCON mission', 'Prabhupada', 'Krishna consciousness Odisha'],
    openGraph: {
        title: 'About Us - ISKCON Burla',
        description: 'Learn about ISKCON Burla temple, our mission, history, and spiritual programs.',
        url: 'https://www.iskconburla.com/about-us',
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
