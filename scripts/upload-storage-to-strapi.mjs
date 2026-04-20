import { readdirSync, statSync, createReadStream, writeFileSync, readFileSync } from 'fs';
import { join, basename } from 'path';

const STORAGE_DIR = process.env.STORAGE_DIR || '/home/manol/Downloads/nfeltpnqmrqwlvhsdjiy.storage/nfeltpnqmrqwlvhsdjiy';
const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.zenmanager.eu';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'missing_token';
const OLD_SUPABASE_STORAGE = 'https://nfeltpnqmrqwlvhsdjiy.supabase.co/storage/v1/object/public';

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.emptyFolderPlaceholder') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function getBucketAndPath(filePath) {
  // e.g. .../nfeltpnqmrqwlvhsdjiy/blog-images/uuid.webp
  const parts = filePath.replace(STORAGE_DIR + '/', '').split('/');
  return { bucket: parts[0], name: parts.slice(1).join('/') };
}

async function uploadFile(filePath) {
  const { bucket, name } = getBucketAndPath(filePath);
  const fileData = readFileSync(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  const blob = new Blob([fileData]);
  formData.append('files', blob, fileName);
  formData.append('path', bucket); // upload into a folder matching bucket name

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const data = await response.json();
  return { bucket, name, strapiUrl: data[0]?.url, strapiId: data[0]?.id };
}

async function updatePostContent(urlMap) {
  // Fetch all posts from Strapi
  const res = await fetch(`${STRAPI_URL}/api/posts?pagination[pageSize]=100&status=published`, {
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` },
  });
  const { data: posts } = await res.json();

  let updatedCount = 0;
  for (const post of posts) {
    let content = post.content || '';
    let changed = false;

    for (const [oldPath, newUrl] of Object.entries(urlMap)) {
      const oldUrl = `${OLD_SUPABASE_STORAGE}/${oldPath}`;
      if (content.includes(oldUrl)) {
        const strapiFullUrl = newUrl.startsWith('http') ? newUrl : `${STRAPI_URL}${newUrl}`;
        content = content.split(oldUrl).join(strapiFullUrl);
        changed = true;
      }
    }

    if (changed) {
      const updateRes = await fetch(`${STRAPI_URL}/api/posts/${post.documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({ data: { content } }),
      });
      if (updateRes.ok) {
        updatedCount++;
        console.log(`  📝 Updated URLs in: ${post.slug}`);
      } else {
        console.error(`  ❌ Failed to update post ${post.slug}`);
      }
    }
  }
  return updatedCount;
}

async function main() {
  const files = walkDir(STORAGE_DIR);
  console.log(`Found ${files.length} files to upload\n`);

  const urlMap = {}; // oldPath (bucket/name) → new Strapi URL
  let success = 0, failed = 0;

  for (const filePath of files) {
    const { bucket, name } = getBucketAndPath(filePath);
    try {
      const result = await uploadFile(filePath);
      urlMap[`${bucket}/${name}`] = result.strapiUrl;
      success++;
      process.stdout.write(`✅ ${bucket}/${name}\n`);
    } catch (err) {
      failed++;
      console.error(`❌ ${bucket}/${name}: ${err.message}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Uploaded: ${success}  Failed: ${failed}`);

  // Save URL map
  writeFileSync('storage-url-map.json', JSON.stringify(urlMap, null, 2));
  console.log('URL map saved to storage-url-map.json');

  // Update post content with new URLs
  console.log('\nUpdating post content with new image URLs...');
  const updatedPosts = await updatePostContent(urlMap);
  console.log(`Updated ${updatedPosts} posts`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => { console.error(err); process.exit(1); });
