import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function uploadImage(imagePath) {
  try {
    const fileName = path.basename(imagePath);
    const fileExt = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExt}`;
    const mimeType = mime.lookup(fileExt) || 'application/octet-stream';

    const fileBuffer = await fs.promises.readFile(imagePath);
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(uniqueFileName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uniqueFileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error(`Error uploading image ${imagePath}:`, error.message);
    throw error;
  }
}

async function processMarkdownContent(content, imageUrls) {
  try {
    let processedContent = content;
    if (imageUrls) {
      const urls = imageUrls.split(';').map(url => url.trim());
      for (const url of urls) {
        if (url && fs.existsSync(url)) {
          const publicUrl = await uploadImage(url);
          // Replace local image path with public URL in markdown
          processedContent = processedContent.replace(
            new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            publicUrl
          );
        }
      }
    }
    return processedContent;
  } catch (error) {
    console.error('Error processing markdown content:', error.message);
    throw error;
  }
}

async function processRow(row) {
  const {
    id,
    action,
    title,
    slug,
    content_markdown,
    image_urls,
    published_at
  } = row;

  try {
    // Validate required fields
    if (!title || !slug || !content_markdown || !action) {
      throw new Error('Missing required fields: title, slug, content_markdown, or action');
    }

    // Handle images if present
    let updatedContent = content_markdown;
    if (image_urls && image_urls.trim() !== '') {
      const imageList = image_urls.split(/[,;]/).map(url => url.trim()).filter(url => url);
      for (const imageUrl of imageList) {
        const publicUrl = await uploadImage(imageUrl);
        if (publicUrl) {
          // Replace the local image path with the Supabase URL in the content
          updatedContent = updatedContent.replace(imageUrl, publicUrl);
        }
      }
    }

    // Generate embedding for the content
    const embedding = await generateEmbedding(title + " " + updatedContent);

    const postData = {
      title,
      slug,
      content_markdown: updatedContent,
      published_at: published_at || null,
      embedding
    };

    let result;
    if (action === 'create') {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`Created post: ${title}`);
    } else if (action === 'update') {
      if (!id) throw new Error('ID is required for update action');
      
      const { data, error } = await supabase
        .from('posts')
        .update(postData)
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`Updated post: ${title}`);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    return result;
  } catch (error) {
    console.error(`Error processing post "${title}":`, error.message);
    return null;
  }
}

async function importCSV(filePath) {
  console.log(`Importing posts from ${filePath}...`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true
    }));

  for await (const row of parser) {
    try {
      const result = await processRow(row);
      if (result) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        title: row.title,
        error: error.message
      });
    }
  }

  console.log('\nImport Summary:');
  console.log(`Successfully imported: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(({ title, error }) => {
      console.log(`- ${title}: ${error}`);
    });
  }
}

// Get the CSV file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide a CSV file path');
  process.exit(1);
}

const csvPath = args[0];
console.log(`Importing posts from ${csvPath}...`);

importCSV(csvPath)
  .then(() => console.log('Import completed'))
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  }); 