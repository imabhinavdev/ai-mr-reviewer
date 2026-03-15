import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'

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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
