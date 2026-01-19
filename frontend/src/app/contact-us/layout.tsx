import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us - ISKCON Burla',
    description: 'Contact ISKCON Burla temple. Get our address, phone number, email, and visiting hours. Located near Siphon, PC Bridge, Burla, Sambalpur, Odisha.',
    keywords: ['Contact ISKCON Burla', 'ISKCON Burla address', 'Temple timings', 'ISKCON Sambalpur contact', 'Temple phone number'],
    openGraph: {
        title: 'Contact Us - ISKCON Burla',
        description: 'Contact ISKCON Burla temple. Get our address, phone number, and visiting hours.',
        url: 'https://www.iskconburla.com/contact-us',
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
