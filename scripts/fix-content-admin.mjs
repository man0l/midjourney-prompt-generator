/**
 * Fixes relative image paths in post content using the Strapi admin JWT (bypasses API token 403).
 * Replaces ![alt](relative/path.ext) → ![alt](https://strapi.zenmanager.eu/uploads/relative/path.ext)
 * (URL-encodes each path segment)
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.zenmanager.eu';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'manol.trendafilov@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FlowCraft2026!';

async function getAdminJwt() {
  const res = await fetch(`${STRAPI_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  if (!data.data?.token) throw new Error('Admin login failed: ' + JSON.stringify(data));
  return data.data.token;
}

function fixImageUrls(content) {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return match;
    const encodedSrc = src.split('/').map(seg => encodeURIComponent(seg)).join('/');
    return `![${alt}](${STRAPI_URL}/uploads/${encodedSrc})`;
  });
}

async function main() {
  console.log('Logging in to Strapi admin...');
  const jwt = await getAdminJwt();
  console.log('Got admin JWT\n');

  // Fetch all posts via admin API
  const res = await fetch(`${STRAPI_URL}/api/posts?pagination[pageSize]=100&status=published`, {
    headers: { 'Authorization': `Bearer ${jwt}` },
  });
  const { data: posts } = await res.json();
  console.log(`Fetched ${posts.length} posts\n`);

  let updatedCount = 0;

  for (const post of posts) {
    const originalContent = post.content || '';
    const fixedContent = fixImageUrls(originalContent);

    if (fixedContent === originalContent) {
      console.log(`  ─ No changes: ${post.slug}`);
      continue;
    }

    const updateRes = await fetch(`${STRAPI_URL}/api/posts/${post.documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({ data: { content: fixedContent } }),
    });

    if (updateRes.ok) {
      updatedCount++;
      // Count how many image paths were fixed
      const fixed = (fixedContent.match(/!\[[^\]]*\]\(https:\/\/strapi/g) || []).length;
      console.log(`  ✅ Updated: ${post.slug} (${fixed} images)`);
    } else {
      const err = await updateRes.text();
      console.error(`  ❌ Failed ${post.slug}: ${err.substring(0, 200)}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Updated ${updatedCount} / ${posts.length} posts`);
}

main().catch(err => { console.error(err); process.exit(1); });
