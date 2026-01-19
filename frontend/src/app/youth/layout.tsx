import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Youth Programs - ISKCON Burla',
    description: 'Join ISKCON Burla youth programs. Sessions on Bhagavad Gita, personality development, stress management, and spiritual growth for college students and young professionals.',
    keywords: ['ISKCON youth', 'Youth programs Burla', 'Bhagavad Gita classes', 'Student programs', 'VOICE ISKCON', 'Youth spirituality'],
    openGraph: {
        title: 'Youth Programs - ISKCON Burla',
        description: 'Join ISKCON Burla youth programs. Bhagavad Gita classes and spiritual growth for young people.',
        url: 'https://www.iskconburla.com/youth',
    },
};

export default function YouthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
