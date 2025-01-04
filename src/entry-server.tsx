import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { Routes, Route, matchPath } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import PostList from './components/PostList'
import PostDetail from './components/PostDetail'
import AuthCallback from './components/AuthCallback'
import { supabase } from './lib/supabaseClient'

// Helper function to get excerpt from markdown content
function getExcerpt(markdown: string, maxLength: number = 160): string {
  const plainText = markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
}

// Function to fetch post data
async function fetchPostData(slug: string) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (post) {
    const { data: relatedPosts } = await supabase
      .rpc('get_similar_posts', { post_id: post.id })
      .limit(6);
    
    return { post, relatedPosts: relatedPosts || [] };
  }
  
  return null;
}

// Function to fetch footer posts
async function fetchFooterPosts() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, published_at')
    .order('published_at', { ascending: false })
    .limit(9);
  
  return data || [];
}

async function getMetaTags(url: string) {
  // Define routes and their corresponding meta tags
  const routes = [
    {
      path: '/',
      getMeta: () => ({
        title: 'AI Art Generator',
        description: 'Create stunning AI art with our Midjourney Prompt Generator. Craft perfect prompts for breathtaking digital art, from hyper-realistic portraits to fantastical landscapes.',
        type: 'website'
      })
    },
    {
      path: '/posts',
      getMeta: () => ({
        title: 'AI Art Prompts',
        description: 'Explore our collection of Midjourney prompts and AI-generated artwork. Find inspiration and learn how to create stunning AI art.',
        type: 'website'
      })
    },
    {
      path: '/posts/:slug',
      getMeta: async (params: any) => {
        if (!params.slug) {
          return {
            title: 'Post Not Found',
            description: 'The requested post could not be found.',
            type: 'article'
          };
        }

        const data = await fetchPostData(params.slug);
        if (!data?.post) {
          return {
            title: 'Post Not Found',
            description: 'The requested post could not be found.',
            type: 'article'
          };
        }

        return {
          title: data.post.title,
          description: getExcerpt(data.post.content_markdown),
          type: 'article'
        };
      }
    }
  ];

  // Find matching route
  const matchingRoute = routes.find(route => matchPath(route.path, url));
  
  if (!matchingRoute) {
    return {
      title: 'Midjourney Generator',
      description: 'Create stunning AI art with our Midjourney Prompt Generator',
      type: 'website'
    };
  }

  const params = matchPath(matchingRoute.path, url)?.params;
  const meta = await matchingRoute.getMeta(params);

  return meta;
}

// Create a context for SSR data
export const SSRDataContext = React.createContext<any>(null);

export async function render(url: string) {
  const meta = await getMetaTags(url);
  
  // Fetch data based on the route
  let ssrData: any = {};
  const postMatch = matchPath('/posts/:slug', url);
  if (postMatch?.params.slug) {
    const postData = await fetchPostData(postMatch.params.slug);
    if (postData) {
      ssrData = { ...postData };
    }
  }

  // Fetch footer posts for all routes
  const footerPosts = await fetchFooterPosts();
  ssrData.footerPosts = footerPosts;
  
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <SSRDataContext.Provider value={ssrData}>
        <StaticRouter location={url}>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<HomePage />} />
              <Route path="/posts" element={<PostList />} />
              <Route path="/posts/:slug" element={<PostDetail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Route>
          </Routes>
        </StaticRouter>
      </SSRDataContext.Provider>
    </React.StrictMode>
  );

  const metaTags = `
    <title>${meta.title} | Midjourney Generator</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title} | Midjourney Generator" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:type" content="${meta.type}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title} | Midjourney Generator" />
    <meta name="twitter:description" content="${meta.description}" />
  `;

  // Serialize SSR data to be used by the client
  const ssrScript = ssrData ? `<script>window.__SSR_DATA__ = ${JSON.stringify(ssrData)}</script>` : '';

  return { html, metaTags, ssrScript };
} 