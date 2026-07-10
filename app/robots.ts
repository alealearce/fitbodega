import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  const aiAgents = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/dashboard'],
      },
      ...aiAgents.map((userAgent) => ({
        userAgent,
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/admin', '/dashboard'],
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
