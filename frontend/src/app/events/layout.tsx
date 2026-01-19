import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Events - ISKCON Burla',
    description: 'Discover upcoming events and festivals at ISKCON Burla. Janmashtami, Gaura Purnima, Ratha Yatra, kirtans, and spiritual programs. Join us in celebration!',
    keywords: ['ISKCON events', 'Temple festivals Burla', 'Janmashtami Sambalpur', 'Ratha Yatra Odisha', 'Krishna events', 'Spiritual programs'],
    openGraph: {
        title: 'Events - ISKCON Burla',
        description: 'Discover upcoming events and festivals at ISKCON Burla. Join us in celebration!',
        url: 'https://www.iskconburla.com/events',
    },
};

export default function EventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
