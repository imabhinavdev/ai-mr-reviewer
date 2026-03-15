# Start PostgreSQL (for dashboard analytics). Matches DATABASE_URL in .env.
docker start postgres 2>/dev/null || docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nirik \
  postgres:16-alpine

# Start Redis (for webhook job queue).
docker start redis 2>/dev/null || docker run -d \
  --name redis \
  -p 6379:6379 \
  redis

npm run dev:server