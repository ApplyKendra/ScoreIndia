import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Donate to ISKCON Burla - Support Temple & Community',
    description: 'Make a donation to ISKCON Burla. Support temple construction, anna dana (food distribution), cow protection, education, and spiritual programs. 80G tax benefits available.',
    keywords: ['Donate ISKCON', 'ISKCON donation', 'Temple donation', 'Anna Dana', '80G donation', 'Krishna temple donation', 'Charity Odisha'],
    openGraph: {
        title: 'Donate to ISKCON Burla - Support Temple & Community',
        description: 'Support ISKCON Burla through your generous donations. Your contributions help spread Krishna consciousness.',
        url: 'https://www.iskconburla.com/donations',
    },
};

export default function DonationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
