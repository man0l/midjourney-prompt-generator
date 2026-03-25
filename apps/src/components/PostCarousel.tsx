import React from 'react';
import PostCard from './PostCard';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  similarity: number;
  image_url?: string;
  description?: string;
}

interface PostCarouselProps {
  posts: RelatedPost[];
}

const PostCarousel: React.FC<PostCarouselProps> = ({ posts }) => {
  // Split posts into two rows of three
  const firstRow = posts.slice(0, 3);
  const secondRow = posts.slice(3, 6);

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold text-primary/90 mb-8">Related Posts</h2>
      <div className="space-y-8">
        {/* First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {firstRow.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              slug={post.slug}
              similarity={post.similarity}
              image_url={post.image_url}
              description={post.description}
            />
          ))}
        </div>
        {/* Second Row */}
        {secondRow.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondRow.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                slug={post.slug}
                similarity={post.similarity}
                image_url={post.image_url}
                description={post.description}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCarousel; 