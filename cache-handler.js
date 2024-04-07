const { createClient } = require('redis');

const NEXT_PREFIX = '_N_T_';
const DEFAULT_TTL = 300;

const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
client.connect();
 
module.exports = class CacheHandler {
  constructor(options) {
    this.options = options
  }
 
  async get(key) {
    console.log('get ', key);
    // This could be stored anywhere, like durable storage
    let value = await client.get(key);
    if (value) {
      value = JSON.parse(value);
    }

    return value;
  }
 
  async set(key, data, ctx) {
    console.log('set ', key);
    /**
     * Special handler for PAGE caching to ensure we 
     * invalidate PAGE caching when clearing FETCH cache.
     * This is to ensure if we clear any FETCH within a page
     * it will also invalidate any page associted with that tag
     * 
     * Revalidate is based on lowest revalidate value on page
     * https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data
     */
    if (data?.kind === 'PAGE' && data?.status === 200) {
      ctx.tags = data.headers['x-next-cache-tags'].split(',').filter(tag => !tag.startsWith(NEXT_PREFIX) && tag !== '');
    }
    
    /**
     * We're creating a mapping of all the keys
     * associted with a give FETCH tag
     */
    ctx.tags.forEach((tag) => {
      client.hSet(tag, key, JSON.stringify({
        lastModified: Date.now()
      }));
    });

    /**
     * Used ot set the expiration of a key based on 
     * the revalidate value or DEFAULT_TTL
     */
    client.set(
      key, 
      JSON.stringify({
        value: data,
        lastModified: Date.now(),
        tags: ctx.tags,
      }), 
      {
        EX: (ctx?.revalidate || DEFAULT_TTL),
      }
    )
  }
 
  async revalidateTag(tag) {
    console.log('clearing ', tag)
    const normalizedtag = tag.replace(NEXT_PREFIX, '');

    // We dont' store subkeys by page so skip check
    if (!normalizedtag.startsWith('/')) {
      // Check if a hash key exists with given tag (should only exist for FETCH)
      const keysToRemove = await client.hKeys(normalizedtag) || [];

      keysToRemove.forEach((key) => {
        console.log('removing sub cache ', key)
        // Removes the individual cache keys async if exists
        client.unlink(key);
      });
    }
  
    // Clean up hash
    console.log('removing final tag', normalizedtag)
    client.unlink(normalizedtag);
  }
}