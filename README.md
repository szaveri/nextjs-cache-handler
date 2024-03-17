# Summary

Example NextJS project with custom cache handler using Redis

* Caches fetch responses in Redis
* Revalidate fetch call via Server Side Action `revalidateTag`

## Getting Started

1. Start up a new `Redis` instance using docker

```bash
$ docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

2. Start up the development server

```bash
$ pnpm run dev
```

## TODO

* Add Full Route Caching
* Test client Route Caching via `next/link`