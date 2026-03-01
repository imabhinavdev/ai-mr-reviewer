import { ApiError } from './apiError.js'

const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
]

const isIgnoredFile = (filePath = '') => {
  const normalized = filePath.replace(/\\/g, '/').trim()
  if (!normalized) return true

  const fileName = normalized.split('/').pop() || ''
  if (/^package.*\.json$/i.test(fileName)) {
    return true
  }

  return IGNORED_DIRS.some(
    (dir) =>
      normalized === dir ||
      normalized.startsWith(`${dir}/`) ||
      normalized.includes(`/${dir}/`),
  )
}

const parseDiff = (diffText) => {
  const lines = diffText.split('\n')

  const files = []
  let currentFile = null
  let currentHunk = null

  let oldLine = 0
  let newLine = 0

  for (const line of lines) {
    // Detect new file
    if (line.startsWith('diff --git')) {
      if (currentFile?.file && !isIgnoredFile(currentFile.file)) {
        files.push(currentFile)
      }

      currentFile = {
        file: null,
        hunks: [],
      }

      currentHunk = null
      continue
    }

    // Capture filename
    if (line.startsWith('+++ b/')) {
      currentFile.file = line.replace('+++ b/', '').trim()
      continue
    }

    // Detect new hunk
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
      if (!match) continue

      oldLine = parseInt(match[1], 10)
      newLine = parseInt(match[3], 10)

      currentHunk = {
        oldStart: oldLine,
        newStart: newLine,
        addedLines: [],
        removedLines: [],
      }

      currentFile.hunks.push(currentHunk)
      continue
    }

    if (!currentHunk) continue

    // Added lines
    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.addedLines.push({
        line: newLine,
        content: line.slice(1),
      })
      newLine++
      continue
    }

    // Removed lines
    if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.removedLines.push({
        line: oldLine,
        content: line.slice(1),
      })
      oldLine++
      continue
    }

    // Context lines
    if (!line.startsWith('\\ No newline')) {
      oldLine++
      newLine++
    }
  }

  if (currentFile?.file && !isIgnoredFile(currentFile.file)) {
    files.push(currentFile)
  }

  return files
}

export const getDiffFromEvent = async (event) => {
  const GITHUB_DIFF_API = 'https://patch-diff.githubusercontent.com/raw'

  if (!event?.pull_request?.diff_url) {
    throw new ApiError(400, 'Invalid GitHub event payload')
  }

  const diffUrl = event.pull_request.diff_url.replace(
    'https://github.com',
    GITHUB_DIFF_API,
  )

  const response = await fetch(diffUrl)

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch PR diff')
  }

  const diff = await response.text()
  const parsedDiff = parseDiff(diff)
  return parsedDiff
}
