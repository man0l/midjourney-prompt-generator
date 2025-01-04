import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface PostCardProps {
  id: string;
  title: string;
  slug: string;
  similarity?: number;
  image_url?: string;
  description?: string;
  created_at: string;
  published_at?: string;
}

const PostCard: React.FC<PostCardProps> = ({ 
  title, 
  slug, 
  image_url, 
  description, 
  similarity,
  created_at,
  published_at 
}) => {
  const displayDate = published_at || created_at;
  
  const getFormattedDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formattedDate = getFormattedDate(displayDate);

  return (
    <Link 
      to={`/posts/${slug}`}
      className="group block bg-accent/5 backdrop-blur-sm hover:bg-accent/10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={image_url} 
            alt={title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-text/70 line-clamp-3 mb-3">
            {description}
          </p>
        )}
        {formattedDate && (
          <div className="text-xs text-text/50">
            {formattedDate}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PostCard; 