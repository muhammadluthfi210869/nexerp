import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nexerp.id';
  let articleEntries: MetadataRoute.Sitemap = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexerp.id/api';
    const res = await fetch(`${apiUrl}/v1/marketing/articles?limit=50`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const articles = Array.isArray(data) ? data : data.data || [];
      articleEntries = articles.map((article: any) => ({
        url: `${baseUrl}/blog/${article.slug}`,
        lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }
  } catch {
    // Graceful fallback during build time
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...articleEntries,
  ];
}

