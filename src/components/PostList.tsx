import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PostCard from './PostCard';
import SEO from '../components/SEO';

interface Post {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  created_at: string;
  content_markdown: string;
}

// Helper function to get excerpt from markdown content
function getExcerpt(markdown: string, maxLength: number = 160): string {
  // Remove markdown syntax and get plain text
  const plainText = markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/[#*`_~]/g, '') // Remove markdown symbols
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Get first n characters
  const excerpt = plainText.slice(0, maxLength);
  return excerpt.length < plainText.length ? `${excerpt}...` : excerpt;
}

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (!data) {
          setPosts([]);
          return;
        }

        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-text/70">
        No posts available at the moment.
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="AI Art Prompts"
        description="Explore our collection of Midjourney prompts and AI-generated artwork. Find inspiration and learn how to create stunning AI art."
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-text">All Posts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              slug={post.slug}
              published_at={post.published_at || undefined}
              created_at={post.created_at}
              description={getExcerpt(post.content_markdown)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default PostList; 