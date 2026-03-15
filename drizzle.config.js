import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const connectionString =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/nirik'

/** @type { import("drizzle-kit").Config } */
export default {
  schema: './src/db/schema.js',
  out: './src/db/migrations',
  dialect: 'postgres',
  dbCredentials: {
    url: connectionString,
  },
}
