import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Temple Construction - ISKCON Burla',
    description: 'Support the construction of ISKCON Burla temple. Contribute to building a magnificent temple for Lord Krishna in Sambalpur, Odisha. Various sponsorship opportunities available.',
    keywords: ['Temple construction ISKCON', 'Build Krishna temple', 'Temple donation', 'ISKCON Burla temple project', 'Sponsor temple construction'],
    openGraph: {
        title: 'Temple Construction - ISKCON Burla',
        description: 'Support the construction of ISKCON Burla temple. Build a magnificent temple for Lord Krishna.',
        url: 'https://www.iskconburla.com/temple-construction',
    },
};

export default function TempleConstructionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
