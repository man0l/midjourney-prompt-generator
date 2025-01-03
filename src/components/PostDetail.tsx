import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabaseClient';
import PostCarousel from './PostCarousel';

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

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
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
        setRelatedPosts(relatedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="p-8 text-text/60">Loading...</div>;
  }

  if (error || !post) {
    return <div className="p-8 text-red-400">Error: {error || 'Post not found'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <article className="prose prose-invert lg:prose-xl mx-auto">
        <h2 className="text-xl font-extrabold text-primary tracking-tight leading-tight mb-6">
          {post.title}
        </h2>
        {post.published_at && (
          <div className="text-sm text-text/80 mb-12 font-medium">
            Published on {new Date(post.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
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
  );
};

export default PostDetail; 