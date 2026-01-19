import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.iskconburla.com';
    const lastModified = new Date();

    // Main pages
    const mainPages = [
        { url: baseUrl, priority: 1 },
        { url: `${baseUrl}/about-us`, priority: 0.9 },
        { url: `${baseUrl}/contact-us`, priority: 0.8 },
        { url: `${baseUrl}/donations`, priority: 0.9 },
        { url: `${baseUrl}/temple-construction`, priority: 0.8 },
    ];

    // Service pages
    const servicePages = [
        { url: `${baseUrl}/prasadam`, priority: 0.9 },
        { url: `${baseUrl}/store`, priority: 0.8 },
        { url: `${baseUrl}/darshan`, priority: 0.9 },
        { url: `${baseUrl}/events`, priority: 0.8 },
        { url: `${baseUrl}/youth`, priority: 0.7 },
        { url: `${baseUrl}/seva-opportunities`, priority: 0.8 },
        { url: `${baseUrl}/nitya-sevak`, priority: 0.7 },
    ];

    // Legal pages
    const legalPages = [
        { url: `${baseUrl}/privacy`, priority: 0.3 },
        { url: `${baseUrl}/terms`, priority: 0.3 },
        { url: `${baseUrl}/refund`, priority: 0.3 },
    ];

    return [...mainPages, ...servicePages, ...legalPages].map((page) => ({
        url: page.url,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: page.priority,
    }));
}
