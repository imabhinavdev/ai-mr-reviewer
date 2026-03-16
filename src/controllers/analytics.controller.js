import { asyncHandler } from '../utils/asyncHandler.js'
import { isDbConfigured } from '../config/db.js'
import {
  getRepository,
  getRepositoryFileContents,
} from '../services/github.service.js'
import { getProject, getRepositoryFileRaw } from '../services/gitlab.service.js'
import {
  getOverview,
  listEvents,
  getEventById,
  listProjects,
  listUsers,
  getActivity,
  getUserProfile,
  listReposByUser,
  getActivityByUser,
  getIssuesActivityByUser,
  getRepoOverview,
  getRepoActivity,
  listUsersByRepo,
  getRepoIssueSummary,
  getRepoHealthScore,
  getReposHealthList,
  getPrComplexity,
  getReviewCompare,
  getAlerts,
} from '../db/repositories/reviewEvents.js'
import {
  getDetectionCategories,
  getUserCodeQualityInsights,
  getGlobalCodeQualityInsights,
  getFindingsByReviewEventIds,
} from '../db/repositories/reviewFindings.js'

function requireDb(req, res, next) {
  if (!isDbConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Database not configured (DATABASE_URL required for analytics)',
    })
    return
  }
  next()
}

export const overview = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getOverview()
    res.status(200).json({ success: true, data })
  }),
]

export const eventById = [
  requireDb,
  asyncHandler(async (req, res) => {
    const id = parseInt(String(req.params.id), 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid event id' })
      return
    }
    const event = await getEventById(id)
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' })
      return
    }
    res.status(200).json({ success: true, data: event })
  }),
]

export const events = [
  requireDb,
  asyncHandler(async (req, res) => {
    const {
      provider,
      repo,
      status,
      from,
      to,
      limit = 50,
      offset = 0,
      page,
    } = req.query
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 100)
    const offsetNum =
      page !== undefined
        ? Math.max(0, parseInt(String(page), 10) || 0) * limitNum
        : Math.max(0, parseInt(String(offset), 10) || 0)
    const { events: list, total } = await listEvents({
      provider: provider ? String(provider) : undefined,
      repo: repo ? String(repo) : undefined,
      status: status ? String(status) : undefined,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      limit: limitNum,
      offset: offsetNum,
    })
    res.status(200).json({
      success: true,
      data: { events: list, total, limit: limitNum, offset: offsetNum },
    })
  }),
]

export const projects = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await listProjects()
    res.status(200).json({ success: true, data })
  }),
]

export const users = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await listUsers()
    res.status(200).json({ success: true, data })
  }),
]

export const userProfile = [
  requireDb,
  asyncHandler(async (req, res) => {
    const provider = String(req.params.provider ?? '').toLowerCase()
    const username = decodeURIComponent(String(req.params.username ?? ''))
    if (!provider || !username) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and username required' })
      return
    }
    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateRange = {
      from: defaultFrom.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
      bucket: 'day',
    }
    const [profile, repos, recentEvents, activity, issuesActivity] =
      await Promise.all([
        getUserProfile(provider, username),
        listReposByUser(provider, username),
        listEvents({
          provider,
          authorUsername: username,
          limit: 20,
          offset: 0,
        }),
        getActivityByUser(provider, username, dateRange),
        getIssuesActivityByUser(provider, username, dateRange),
      ])
    if (!profile) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.status(200).json({
      success: true,
      data: {
        ...profile,
        repos,
        recentReviews: recentEvents.events,
        activity,
        issuesActivity,
      },
    })
  }),
]

export const activity = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { from, to, bucket = 'day' } = req.query
    const now = new Date()
    const defaultTo = to ? new Date(String(to)) : now
    const defaultFrom = from
      ? new Date(String(from))
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const data = await getActivity({
      from: defaultFrom.toISOString().slice(0, 10),
      to: defaultTo.toISOString().slice(0, 10),
      bucket: bucket === 'week' ? 'week' : 'day',
    })
    res.status(200).json({ success: true, data })
  }),
]

function getRepoParams(req) {
  const provider = String(req.params.provider ?? '').toLowerCase()
  const repoId = decodeURIComponent(String(req.params.repoId ?? ''))
  return { provider, repoId }
}

export const repoOverview = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    const data = await getRepoOverview(provider, repoId)
    res.status(200).json({ success: true, data })
  }),
]

export const repoActivity = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    const { from, to, bucket = 'day' } = req.query
    const now = new Date()
    const defaultTo = to ? new Date(String(to)) : now
    const defaultFrom = from
      ? new Date(String(from))
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const data = await getRepoActivity(provider, repoId, {
      from: defaultFrom.toISOString().slice(0, 10),
      to: defaultTo.toISOString().slice(0, 10),
      bucket: bucket === 'week' ? 'week' : 'day',
    })
    res.status(200).json({ success: true, data })
  }),
]

export const repoContributors = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    const data = await listUsersByRepo(provider, repoId)
    res.status(200).json({ success: true, data })
  }),
]

export const repoIssueSummary = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    const data = await getRepoIssueSummary(provider, repoId)
    res.status(200).json({ success: true, data })
  }),
]

export const repoHealthScore = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    const data = await getRepoHealthScore(provider, repoId)
    res.status(200).json({ success: true, data })
  }),
]

const RULES_PATH = '.nirik/rules.md'

export const repoRules = [
  asyncHandler(async (req, res) => {
    const { provider, repoId } = getRepoParams(req)
    if (!provider || !repoId) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and repoId required' })
      return
    }
    try {
      if (provider === 'github') {
        const repo = await getRepository(repoId)
        const content = await getRepositoryFileContents(
          repoId,
          RULES_PATH,
          repo.default_branch,
        )
        if (content == null) {
          res
            .status(404)
            .json({ success: false, message: 'No .nirik/rules.md found' })
          return
        }
        res.status(200).json({ success: true, data: { content } })
        return
      }
      if (provider === 'gitlab') {
        const project = await getProject(repoId)
        const content = await getRepositoryFileRaw(
          repoId,
          RULES_PATH,
          project.default_branch,
        )
        if (content == null) {
          res
            .status(404)
            .json({ success: false, message: 'No .nirik/rules.md found' })
          return
        }
        res.status(200).json({ success: true, data: { content } })
        return
      }
      res.status(400).json({ success: false, message: 'Unknown provider' })
    } catch (err) {
      if (
        err.message?.includes('not set') ||
        err.message?.includes('required')
      ) {
        res
          .status(503)
          .json({ success: false, message: 'Git integration not configured' })
        return
      }
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        res
          .status(404)
          .json({ success: false, message: 'Repository or file not found' })
        return
      }
      throw err
    }
  }),
]

export const reposHealthList = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getReposHealthList()
    res.status(200).json({ success: true, data })
  }),
]

export const detectionCategories = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getDetectionCategories()
    res.status(200).json({ success: true, data })
  }),
]

export const codeQualityInsights = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getGlobalCodeQualityInsights()
    res.status(200).json({ success: true, data: { categories: data } })
  }),
]

export const prComplexity = [
  requireDb,
  asyncHandler(async (req, res) => {
    const provider = req.query.provider ? String(req.query.provider) : undefined
    const repoId = req.query.repoId ? String(req.query.repoId) : undefined
    const data = await getPrComplexity({ provider, repoId })
    res.status(200).json({ success: true, data })
  }),
]

export const reviewCompare = [
  requireDb,
  asyncHandler(async (req, res) => {
    const id1 = parseInt(String(req.query.id1), 10)
    const id2 = parseInt(String(req.query.id2), 10)
    if (Number.isNaN(id1) || Number.isNaN(id2)) {
      res.status(400).json({ success: false, message: 'id1 and id2 required' })
      return
    }
    const { event1, event2 } = await getReviewCompare(id1, id2)
    if (!event1 || !event2) {
      res
        .status(404)
        .json({ success: false, message: 'One or both reviews not found' })
      return
    }
    const findings = await getFindingsByReviewEventIds([event1.id, event2.id])
    res.status(200).json({
      success: true,
      data: {
        event1: {
          id: event1.id,
          provider: event1.provider,
          repoName: event1.repoName,
          mrNumber: event1.mrNumber,
          status: event1.status,
          commentsPostedCount: event1.commentsPostedCount,
          findings: findings[event1.id] ?? [],
        },
        event2: {
          id: event2.id,
          provider: event2.provider,
          repoName: event2.repoName,
          mrNumber: event2.mrNumber,
          status: event2.status,
          commentsPostedCount: event2.commentsPostedCount,
          findings: findings[event2.id] ?? [],
        },
      },
    })
  }),
]

export const alerts = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getAlerts()
    res.status(200).json({ success: true, data: { alerts: data } })
  }),
]

export const userInsights = [
  requireDb,
  asyncHandler(async (req, res) => {
    const provider = String(req.params.provider ?? '').toLowerCase()
    const username = decodeURIComponent(String(req.params.username ?? ''))
    if (!provider || !username) {
      res
        .status(400)
        .json({ success: false, message: 'Provider and username required' })
      return
    }
    const categories = await getUserCodeQualityInsights(provider, username)
    res.status(200).json({ success: true, data: { categories } })
  }),
]
