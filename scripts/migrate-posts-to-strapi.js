import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'missing_token';

async function migratePosts() {
  console.log('🔄 Starting posts migration...\n');

  // Fetch from Supabase
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*');

  if (error) throw error;

  console.log(`📄 Found ${posts.length} posts in Supabase`);
  console.log(`⏰ Preserving exact publish dates\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const post of posts) {
    try {
      // Preserve exact publish date from Supabase
      const strapiPost = {
        data: {
          title: post.title,
          slug: post.slug,
          content: post.content_markdown,  // Markdown format preserved
          excerpt: post.content_markdown.substring(0, 200) + '...',
          publishedAt: post.published_at,  // EXACT DATE PRESERVED
          seo: {
            metaTitle: post.title,
            metaDescription: post.content_markdown.substring(0, 150),
          },
        }
      };

      const response = await fetch(`${STRAPI_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify(strapiPost),
      });

      if (response.ok) {
        successCount++;
        console.log(`✅ ${post.slug} → ${post.published_at}`);

        results.push({
          supabaseId: post.id,
          strapiId: (await response.json()).data.documentId,
          slug: post.slug,
          publishedAt: post.published_at,
          status: 'migrated'
        });
      } else {
        failureCount++;
        const errorText = await response.text();
        console.error(`❌ ${post.slug}: ${errorText}`);

        results.push({
          supabaseId: post.id,
          slug: post.slug,
          publishedAt: post.published_at,
          status: 'failed',
          error: errorText
        });
      }
    } catch (err) {
      failureCount++;
      console.error(`❌ ${post.slug}: ${err.message}`);
    }
  }

  // Save migration report
  const reportFilename = `migration-report-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
  writeFileSync(reportFilename, JSON.stringify(results, null, 2));

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Migration complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed:  ${failureCount}`);
  console.log(`   Report:   ${reportFilename}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  return results;
}

migratePosts()
  .then(() => {
    console.log(`\n✅ Posts migration complete!\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });