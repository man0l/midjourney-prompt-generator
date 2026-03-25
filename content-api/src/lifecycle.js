import { createClient } from '@supabase/supabase-js';
import openai from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SITE_SUPABASE_SERVICE_KEY || 'fallback_service_key'
);

const openaiClient = process.env.OPENAI_API_KEY ? new openai({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Generate embedding from content
async function generateEmbedding(content) {
  if (!openaiClient) {
    console.warn('OpenAI API key not configured, skipping embedding generation');
    return null;
  }

  try {
    // Extract text from richtext (Markdown format)
    const text = content.replace(/<[^>]+>/g, ' ').trim();
    const truncatedText = text.substring(0, 8000);

    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

module.exports = {
  async afterCreate(event) {
    if (event.model.uid === 'api::post.post') {
      const post = event.result;

      console.log(`🔄 Syncing new post to Supabase: ${post.attributes.slug}`);

      // Generate vector embedding
      const embedding = await generateEmbedding(post.attributes.content);

      if (!embedding) {
        console.error('Failed to generate embedding for post');
        return;
      }

      // Insert into Supabase (keep original Supabase structure)
      const { error } = await supabase.from('posts').upsert({
        id: post.documentId,  // Use Strapi ID
        title: post.attributes.title,
        slug: post.attributes.slug,
        content_markdown: post.attributes.content,  // Keep as Markdown
        published_at: post.attributes.publishedAt,  // Exact date preserved
        embedding: embedding,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to sync to Supabase:', error);
      } else {
        console.log(`✅ Synced post to Supabase`);
      }
    }
  },

  async afterUpdate(event) {
    if (event.model.uid === 'api::post.post') {
      const post = event.result;

      console.log(`🔄 Updating post in Supabase: ${post.attributes.slug}`);

      // Regenerate embedding on content change
      const embedding = await generateEmbedding(post.attributes.content);

      if (!embedding) return;

      const { error } = await supabase.from('posts').upsert({
        id: post.documentId,
        title: post.attributes.title,
        slug: post.attributes.slug,
        content_markdown: post.attributes.content,
        published_at: post.attributes.publishedAt,
        embedding: embedding,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to update Supabase:', error);
      } else {
        console.log(`✅ Updated post in Supabase`);
      }
    }
  },

  async afterDelete(event) {
    if (event.model.uid === 'api::post.post') {
      const post = event.result;

      console.log(`🗑️ Deleting post from Supabase: ${post.attributes.slug}`);

      const { error } = await supabase.from('posts').delete().eq('id', post.documentId);

      if (error) {
        console.error('Failed to delete from Supabase:', error);
      } else {
        console.log(`✅ Deleted post from Supabase`);
      }
    }
  }
};