import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { writeFileSync } from 'fs';

const BACKUP_FILE = process.env.BACKUP_FILE || '/home/manol/Downloads/db_cluster-03-06-2025@19-52-25.backup.gz';
const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi.zenmanager.eu';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'missing_token';

async function readBackup() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    createReadStream(BACKUP_FILE)
      .pipe(createGunzip())
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject);
  });
}

function parsePostsCopy(sql) {
  const match = sql.match(/COPY public\.posts \((.+?)\) FROM stdin;\n([\s\S]*?)\n\\\./);
  if (!match) throw new Error('COPY block for public.posts not found in dump');

  const columns = match[1].split(',').map(c => c.trim());
  const rows = match[2].split('\n').filter(Boolean);

  return rows.map(row => {
    const fields = row.split('\t');
    const obj = {};
    columns.forEach((col, i) => {
      const val = fields[i];
      // Unescape postgres COPY format
      obj[col] = val === '\\N' ? null : val
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
    });
    return obj;
  });
}

async function migratePosts() {
  console.log('Reading backup file...');
  const sql = await readBackup();

  const posts = parsePostsCopy(sql);
  console.log(`Found ${posts.length} posts in backup\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (const post of posts) {
    const excerpt = (post.content_markdown || '')
      .replace(/!\[.*?\]\(.*?\)/g, '')   // remove images
      .replace(/[#*`>\[\]]/g, '')         // strip markdown
      .trim()
      .substring(0, 200)
      .trim() + '...';

    const strapiPost = {
      data: {
        title: post.title,
        slug: post.slug,
        content: post.content_markdown,
        excerpt,
        publishedAt: post.published_at,
        seo: {
          metaTitle: post.title,
          metaDescription: (post.content_markdown || '').substring(0, 150).replace(/[#*`>\[\]]/g, '').trim(),
        },
      }
    };

    try {
      const response = await fetch(`${STRAPI_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify(strapiPost),
      });

      const body = await response.text();

      if (response.ok) {
        successCount++;
        const data = JSON.parse(body);
        console.log(`✅ ${post.slug} → ${post.published_at}`);
        results.push({ slug: post.slug, strapiDocId: data?.data?.documentId, status: 'migrated' });
      } else {
        failureCount++;
        console.error(`❌ ${post.slug}: ${body.substring(0, 200)}`);
        results.push({ slug: post.slug, status: 'failed', error: body.substring(0, 200) });
      }
    } catch (err) {
      failureCount++;
      console.error(`❌ ${post.slug}: ${err.message}`);
      results.push({ slug: post.slug, status: 'error', error: err.message });
    }
  }

  const reportFile = `migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  writeFileSync(reportFile, JSON.stringify(results, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Success: ${successCount}  ❌ Failed: ${failureCount}`);
  console.log(`Report: ${reportFile}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

migratePosts().catch(err => { console.error(err); process.exit(1); });
