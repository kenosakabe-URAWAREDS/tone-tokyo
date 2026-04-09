import type { MetadataRoute } from 'next';

const SITE = 'https://tone-tokyo.com';

// AI / answer-engine crawlers we explicitly welcome.
// Listing them by name (in addition to the wildcard rule) makes the
// invitation unambiguous and survives future tightening of `*`.
const AI_CRAWLERS = [
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
  'Bingbot',
  'CCBot',
  'Amazonbot',
  'Bytespider',
  'DuckAssistBot',
  'Meta-ExternalAgent',
  'cohere-ai',
  'YouBot',
  'Diffbot',
  'FacebookBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/studio/', '/input'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ['/', '/api/llms-full'],
        disallow: ['/api/', '/studio/', '/input'],
      })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
