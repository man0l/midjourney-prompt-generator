import type { APIRoute } from 'astro';
import { fetchPosts } from '../lib/strapi';

const BASE_URL = 'https://www.midjourney-prompt-generator.eu';

const staticPages = [
  { url: '/',                              lastmod: '2026-04-15', priority: '1.0', changefreq: 'weekly'  },
  { url: '/prompt-builder',               lastmod: '2026-04-26', priority: '0.9', changefreq: 'weekly'  },
  { url: '/claude-prompt-generator',      lastmod: '2026-04-26', priority: '0.8', changefreq: 'weekly'  },
  { url: '/chatgpt-prompt-generator',     lastmod: '2026-04-15', priority: '0.8', changefreq: 'weekly'  },
  { url: '/chatgpt-prompt-improver',      lastmod: '2026-04-15', priority: '0.7', changefreq: 'weekly'  },
  { url: '/chatgpt-prompt-optimizer',     lastmod: '2026-04-15', priority: '0.7', changefreq: 'weekly'  },
  { url: '/chatgpt-image-prompt-generator', lastmod: '2026-04-15', priority: '0.7', changefreq: 'weekly' },
  { url: '/gemini-prompt-generator',      lastmod: '2026-04-15', priority: '0.8', changefreq: 'weekly'  },
  { url: '/grok-prompt-generator',        lastmod: '2026-04-09', priority: '0.7', changefreq: 'weekly'  },
  { url: '/cursor-prompt-generator',      lastmod: '2026-04-15', priority: '0.6', changefreq: 'weekly'  },
  { url: '/bolt-prompt-generator',        lastmod: '2026-04-15', priority: '0.6', changefreq: 'weekly'  },
  { url: '/lovable-prompt-generator',     lastmod: '2026-04-15', priority: '0.6', changefreq: 'weekly'  },
  { url: '/v0-prompt-generator',          lastmod: '2026-04-15', priority: '0.6', changefreq: 'weekly'  },
  { url: '/image-prompt-generator',        lastmod: '2026-04-28', priority: '0.8', changefreq: 'weekly'  },
  { url: '/compare',                      lastmod: '2026-04-28', priority: '0.7', changefreq: 'weekly'  },
  { url: '/compare/gemini-vs-chatgpt',    lastmod: '2026-04-28', priority: '0.9', changefreq: 'monthly' },
  { url: '/compare/chatgpt-vs-perplexity', lastmod: '2026-04-28', priority: '0.8', changefreq: 'monthly' },
  { url: '/compare/perplexity-vs-deepseek', lastmod: '2026-04-28', priority: '0.7', changefreq: 'monthly' },
  { url: '/compare/grok-vs-chatgpt',       lastmod: '2026-04-28', priority: '0.9', changefreq: 'monthly' },
  { url: '/compare/chatgpt-vs-claude',     lastmod: '2026-04-29', priority: '0.9', changefreq: 'monthly' },
  { url: '/posts',                        lastmod: '2026-04-26', priority: '0.5', changefreq: 'weekly'  },
];

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  let posts: { slug: string; publishedAt: string }[] = [];
  try {
    posts = await fetchPosts();
  } catch {}

  const staticEntries = staticPages.map(p =>
    urlEntry(`${BASE_URL}${p.url}`, p.lastmod, p.changefreq, p.priority)
  );

  const postEntries = posts.map(p => {
    const lastmod = p.publishedAt ? p.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];
    return urlEntry(`${BASE_URL}/posts/${p.slug}`, lastmod, 'monthly', '0.7');
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...postEntries].join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
