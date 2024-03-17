import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheHandler: resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
