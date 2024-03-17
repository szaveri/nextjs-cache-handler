const { createClient } = require('redis');

const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
client.connect();
 
module.exports = class CacheHandler {
  constructor(options) {
    this.options = options
  }
 
  async get(key) {
    // This could be stored anywhere, like durable storage
    let value = await client.get(key);
    if (value) {
      value = JSON.parse(value);
    }

    return value;
  }
 
  async set(key, data, ctx) {
    // Disable full page caching
    // This should be implemented once we find a good mapping value
    if (data.kind === 'PAGE' || data === null) {
      return;
    }
    
    // Set key in various tag hash maps
    // This will be used to clear tags in the future 
    ctx.tags.forEach((tag) => {
      client.hSet(tag, key, JSON.stringify({
        lastModified: Date.now()
      }));
    });

    // Key expires after 300 seconds by default
    // This is used for the `get` and stores the actual data
    client.setEx(key, 300, JSON.stringify({
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    }))
  }
 
  async revalidateTag(tag) {
    // Check if a hash key exists with given tag
    const keysToRemove = await client.hKeys(tag);

    keysToRemove.forEach((key) => {
      // Removes the individual cache keys async if exists
      client.unlink(key);
    });

    // Clean up hash
    client.del(tag);
  }
}