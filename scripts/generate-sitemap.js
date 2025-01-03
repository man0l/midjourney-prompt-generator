import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function generateSitemap() {
  try {
    // Fetch all posts from Supabase
    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Base URLs that we know exist
    const staticPages = [
      {
        url: '/',
        priority: '1.0',
        changefreq: 'daily'
      },
      {
        url: '/posts',
        priority: '0.8',
        changefreq: 'daily'
      }
    ]

    // Add dynamic post URLs
    const postUrls = posts.map(post => ({
      url: `/posts/${post.slug}`,
      lastmod: post.updated_at.split('T')[0],
      priority: '0.6',
      changefreq: 'weekly'
    }))

    const allUrls = [...staticPages, ...postUrls]
    const baseUrl = 'https://midjourney-generator-two.vercel.app'

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : `<lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Write sitemap to public directory
    fs.writeFileSync('public/sitemap.xml', sitemap)
    console.log('Sitemap generated successfully!')

  } catch (error) {
    console.error('Error generating sitemap:', error)
    process.exit(1)
  }
}

generateSitemap() 