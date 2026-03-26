const STRAPI_URL = import.meta.env.STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN || 'missing_token';

export async function fetchStrapi<T>(options: {
  endpoint: string;
  query?: Record<string, any>;
  populate?: string[];
  sort?: string;
}): Promise<T[]> {
  const url = new URL(`${STRAPI_URL}/api/${options.endpoint}`);

  url.searchParams.append('status', 'published');

  if (options.populate) {
    url.searchParams.append('populate', options.populate.join(','));
  }

  if (options.sort) {
    url.searchParams.append('sort', options.sort);
  }

  if (options.query) {
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

export async function fetchPosts() {
  return fetchStrapi<Post>({
    endpoint: 'posts',
    populate: ['seo'],
    sort: 'publishedAt:desc',
  });
}

export async function fetchPostBySlug(slug: string) {
  const posts = await fetchStrapi<Post>({
    endpoint: 'posts',
    query: { 'filters[slug][$eq]': slug },
    populate: ['seo'],
  });
  return posts[0];
}

export async function fetchStyles() {
  return fetchStrapi<StyleOption>({
    endpoint: 'style-options',
  });
}

export async function fetchLighting() {
  return fetchStrapi<LightingOption>({
    endpoint: 'lighting-options',
  });
}

export async function fetchCamera() {
  return fetchStrapi<CameraOption>({
    endpoint: 'camera-options',
  });
}

export async function fetchColors() {
  return fetchStrapi<ColorOption>({
    endpoint: 'color-options',
  });
}

export async function fetchMaterials() {
  return fetchStrapi<MaterialOption>({
    endpoint: 'material-options',
  });
}

export async function fetchArtists() {
  return fetchStrapi<ArtistOption>({
    endpoint: 'artist-options',
  });
}

interface Post {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

interface StyleOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}

interface LightingOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}

interface CameraOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}

interface ColorOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}

interface MaterialOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}

interface ArtistOption {
  id: number;
  documentId: string;
  name: string;
  description: string;
  promptAddition: string;
  imageUrl: string;
  tags: string[];
}