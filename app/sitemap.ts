import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.tjtradehub.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-04-13'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // SEO Landing Pages
    {
      url: `${baseUrl}/trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forex-trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/futures-trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mt5-trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // SEO Content Pages
    {
      url: `${baseUrl}/what-is-a-trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/how-to-use-a-trading-journal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/forex-trading-journal-guide`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/trading-performance-tracking`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
  ]
}
