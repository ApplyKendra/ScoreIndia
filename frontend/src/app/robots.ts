import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://www.iskconburla.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/login',
                    '/register',
                    '/profile',
                    '/my-donations',
                    '/orders',
                    '/cart',
                    '/setup-2fa',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
