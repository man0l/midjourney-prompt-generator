import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import { AuthModal } from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { SSRDataContext } from './entry-server';

interface Post {
  id: string;
  title: string;
  slug: string;
  published_at: string;
}

const FooterPosts: React.FC = () => {
  const ssrData = React.useContext(SSRDataContext);
  const [posts, setPosts] = React.useState<Post[]>(ssrData?.footerPosts || []);

  React.useEffect(() => {
    const fetchPosts = async () => {
      if (ssrData?.footerPosts) return; // Skip fetching if we have SSR data

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, published_at')
        .order('published_at', { ascending: false })
        .limit(9);

      if (!error && data) {
        setPosts(data);
      }
    };

    if (!ssrData?.footerPosts) {
      fetchPosts();
    }
  }, [ssrData]);

  const columns = [
    posts.slice(0, 3),
    posts.slice(3, 6),
    posts.slice(6, 9),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-2">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex}>
          {column.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.slug}`}
              className="block py-2 group"
            >
              <h4 className="text-text/70 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setIsAuthModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-start via-background-end to-background-start">
      <nav className="border-b border-accent/10 backdrop-blur-md bg-background-start/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-3xl font-extrabold text-primary hover:text-primary/90 transition-colors tracking-tight"
              >
                Midjourney Prompt Generator
              </Link>
              <Link 
                to="/posts" 
                className="text-lg text-text/80 hover:text-primary transition-colors font-medium"
              >
                Posts
              </Link>
            </div>
            <div>
              {session ? (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-8 py-3 bg-red-600 text-text font-semibold rounded-xl hover:bg-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-8 py-3 bg-primary text-text font-semibold rounded-xl hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="animate-fade-in max-w-5xl mx-auto px-6 py-12">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-accent/10 bg-background-end/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="animate-fade-in space-y-6">
              <h3 className="text-2xl font-bold text-primary">About</h3>
              <p className="text-lg text-text/80 leading-relaxed">
                Create stunning AI art with our Midjourney prompt generator. Optimize your prompts and unleash your creativity.
              </p>
              <div className="flex space-x-8">
                <Link 
                  to="/" 
                  className="text-lg text-text/60 hover:text-primary transition-colors font-medium"
                >
                  Home
                </Link>
                <Link 
                  to="/posts" 
                  className="text-lg text-text/60 hover:text-primary transition-colors font-medium"
                >
                  Posts
                </Link>
              </div>
            </div>
            <div className="animate-fade-in space-y-8">
              <h3 className="text-2xl font-bold text-primary">Latest Posts</h3>
              <FooterPosts />
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-accent/10 text-center">
            <p className="text-lg text-text/60 font-medium">
              © {new Date().getFullYear()} Midjourney Generator. We are not affiliated with Midjourney in any way.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default App;