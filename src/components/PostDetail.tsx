import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabaseClient';
import PostCarousel from './PostCarousel';
import SEO from '../components/SEO';
import { SSRDataContext } from '../entry-server';

interface Post {
  id: string;
  title: string;
  content_markdown: string;
  published_at: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  similarity: number;
}

// Helper function to get excerpt from markdown content
function getExcerpt(markdown: string, maxLength: number = 160): string {
  const plainText = markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
}

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const ssrData = useContext(SSRDataContext);
  const [post, setPost] = useState<Post | null>(ssrData?.post || null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>(ssrData?.relatedPosts || []);
  const [loading, setLoading] = useState(!ssrData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (ssrData) return; // Skip fetching if we have SSR data

      try {
        setLoading(true);
        setError(null);

        // Fetch the main post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (postError) throw postError;
        setPost(postData);

        // Fetch related posts using the similarity function
        const { data: relatedData, error: relatedError } = await supabase
          .rpc('get_similar_posts', { post_id: postData.id })
          .limit(6);

        if (relatedError) throw relatedError;
        setRelatedPosts(relatedData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug && !ssrData) {
      fetchPost();
    }
  }, [slug, ssrData]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (loading) {
    return <div className="p-8 text-text/60">Loading...</div>;
  }

  if (error || !post) {
    return (
      <>
        <SEO 
          title="Post Not Found"
          description="The requested post could not be found."
        />
        <div className="p-8 text-text/60">
          {error || 'Post not found'}
        </div>
      </>
    );
  }

  const formattedDate = formatDate(post.published_at);

  return (
    <>
      <SEO 
        title={post.title}
        description={getExcerpt(post.content_markdown)}
        type="article"
      />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-invert lg:prose-xl mx-auto">
          <h2 className="text-xl font-extrabold text-primary tracking-tight leading-tight mb-6">
            {post.title}
          </h2>
          {formattedDate && (
            <div className="text-sm text-text/80 mb-12 font-medium">
              Published on {formattedDate}
            </div>
          )}
          <div className="prose-headings:text-primary prose-p:text-text/90 prose-p:leading-relaxed prose-a:text-accent hover:prose-a:text-accent/80 prose-strong:text-text prose-code:text-accent">
            <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <PostCarousel posts={relatedPosts} />
        )}
      </div>
    </>
  );
};

export default PostDetail; 