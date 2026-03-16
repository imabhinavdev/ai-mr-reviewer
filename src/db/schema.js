import { pgTable, serial, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core'

export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().unique(),
  configured: boolean('configured').notNull().default(false),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviewEvents = pgTable('review_events', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(), // 'github' | 'gitlab'
  repoId: text('repo_id').notNull(),
  repoName: text('repo_name').notNull(),
  mrNumber: integer('mr_number').notNull(),
  authorUsername: text('author_username'),
  status: text('status').notNull().default('queued'), // queued | completed | failed
  commentsPostedCount: integer('comments_posted_count').notNull().default(0),
  bullmqJobId: text('bullmq_job_id').notNull().unique(),
  durationSeconds: real('duration_seconds'),
  aiProvider: text('ai_provider'),
  failureReason: text('failure_reason'),
  filesChanged: integer('files_changed'),
  linesAdded: integer('lines_added'),
  linesRemoved: integer('lines_removed'),
  queuedAt: timestamp('queued_at', { withTimezone: true }),
  diffFetchedAt: timestamp('diff_fetched_at', { withTimezone: true }),
  aiStartedAt: timestamp('ai_started_at', { withTimezone: true }),
  commentsPostedAt: timestamp('comments_posted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(),
  eventType: text('event_type').notNull(),
  repoName: text('repo_name').notNull(),
  action: text('action'),
  accepted: boolean('accepted').notNull().default(true),
  queued: boolean('queued').notNull().default(false),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviewFindings = pgTable('review_findings', {
  id: serial('id').primaryKey(),
  reviewEventId: integer('review_event_id')
    .notNull()
    .references(() => reviewEvents.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  count: integer('count').notNull().default(1),
})
