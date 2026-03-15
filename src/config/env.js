import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  /** Public base URL (e.g. https://your-domain.com) for startup log and docs. No trailing slash. */
  BASE_URL: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .optional(),
  LOG_FILE_PATH: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  /** Secret for verifying GitHub webhooks (X-Hub-Signature-256). Set in repo Webhook settings. */
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITLAB_TOKEN: z.string().optional(),
  GITLAB_PRIVATE_TOKEN: z.string().optional(),
  GITLAB_URL: z.string().optional(),
  /** Token for verifying GitLab webhooks (X-Gitlab-Token). Set in project Webhook settings. */
  GITLAB_WEBHOOK_TOKEN: z.string().optional(),
  /** Token required to access /metrics. */
  METRICS_TOKEN: z.string().min(16),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  /** Concurrency for the review worker (BullMQ). */
  REVIEW_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(1),
  /** PostgreSQL connection URL for analytics and dashboard. Required for auth/dashboard. */
  DATABASE_URL: z.string().optional(),
  /** Admin username for dashboard login. Required for auth. */
  ADMIN_USERNAME: z.string().optional(),
  /** Admin password for dashboard login. Required for auth. */
  ADMIN_PASSWORD: z.string().optional(),
  /** Secret for signing JWT tokens. Min 32 chars. Required for auth. */
  JWT_SECRET: z.string().min(32).optional(),
})

export const env = envSchema.parse(process.env)
