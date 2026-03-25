import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'missing_token';

async function verifySync() {
  console.log('🔍 Verifying Strapi ↔ Supabase sync...\n');

  // Fetch from both sources
  const { data: supabasePosts, error: sbError } = await supabase
    .from('posts')
    .select('id, title, slug, published_at');

  if (sbError) {
    console.error('Failed to fetch from Supabase:', sbError);
    process.exit(1);
  }

  const strapiResponse = await fetch(`${STRAPI_URL}/api/posts`, {
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` },
  });
  const strapiJson = await strapiResponse.json();
  const strapiPosts = strapiJson.data || [];

  console.log(`📊 Supabase posts: ${supabasePosts.length}`);
  console.log(`📊 Strapi posts: ${strapiPosts.length}\n`);

  // Check for missing posts in Supabase
  const missingInSupabase = strapiPosts.filter(
    sp => !supabasePosts.find(sb => sb.slug === sp.attributes.slug)
  );

  if (missingInSupabase.length > 0) {
    console.log(`⚠️  Posts missing in Supabase:`);
    missingInSupabase.forEach(post => {
      console.log(`   - ${post.attributes.slug} (published: ${post.attributes.publishedAt})`);
    });
  } else {
    console.log('✅ All Strapi posts synced to Supabase');
  }

  // Check for orphaned posts in Supabase
  const orphanedInSupabase = supabasePosts.filter(
    sb => !strapiPosts.find(sp => sp.attributes.slug === sb.slug)
  );

  if (orphanedInSupabase.length > 0) {
    console.log(`\n⚠️  Orphaned posts in Supabase:`);
    orphanedInSupabase.forEach(post => {
      console.log(`   - ${post.slug} (published: ${post.published_at})`);
    });
  } else {
    console.log('✅ No orphaned posts in Supabase');
  }

  // Verify publish dates
  console.log('\n⏰ Verifying exact publish dates...');
  let dateMismatches = 0;

  for (const sp of strapiPosts) {
    const sb = supabasePosts.find(s => s.slug === sp.attributes.slug);
    if (sb && sb.published_at !== sp.attributes.publishedAt) {
      dateMismatches++;
      console.log(`⚠️  ${sp.attributes.slug}:`);
      console.log(`   Strapi: ${sp.attributes.publishedAt}`);
      console.log(`   Supabase: ${sb.published_at}`);
    }
  }

  if (dateMismatches === 0) {
    console.log('✅ All publish dates match exactly');
  }

  console.log(`\n✨ Verification complete!`);
}

verifySync();