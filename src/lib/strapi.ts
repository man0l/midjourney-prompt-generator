import 'dotenv/config';

interface FetchOptions {
  query?: Record<string, any>;
  populate?: string[];
  sort?: string;
}

export async function fetchStrapi(endpoint: string, options?: FetchOptions): Promise<any[]> {
  const STRAPI_URL = process.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'missing_token';
  
  const url = new URL(`${STRAPI_URL}/api/${endpoint}`);
  
  url.searchParams.append('publicationState', 'live');
  
  if (options?.populate) {
    url.searchParams.append('populate', options.populate.join(','));
  }
  
  if (options?.sort) {
    url.searchParams.append('sort', options.sort);
  }
  
  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
  });
  
  const json = await response.json();
  return json.data || [];
}

export async function fetchPosts(): Promise<any[]> {
  return fetchStrapi('posts', {
    populate: ['seo'],
    sort: 'publishedAt:desc',
  });
}

export async function fetchPostBySlug(slug: string): Promise<any> {
  const posts = await fetchStrapi('posts', {
    query: { 'filters[slug][$eq]': slug },
    populate: ['seo'],
  });
  return posts[0];
}

export async function fetchStyles(): Promise<any[]> {
  return fetchStrapi('style-options');
}

export async function fetchLighting(): Promise<any[]> {
  return fetchStrapi('lighting-options');
}

export async function fetchCamera(): Promise<any[]> {
  return fetchStrapi('camera-options');
}

export async function fetchColors(): Promise<any[]> {
  return fetchStrapi('color-options');
}

export async function fetchMaterials(): Promise<any[]> {
  return fetchStrapi('material-options');
}

export async function fetchArtists(): Promise<any[]> {
  return fetchStrapi('artist-options');
}