import { ApiError } from './apiError.js'

const parseDiff = (diffText) => {
  const lines = diffText.split('\n')

  const files = []
  let currentFile = null
  let currentHunk = null

  let oldLine = 0
  let newLine = 0

  for (const line of lines) {
    // 1️⃣ Detect new file
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        files.push(currentFile)
      }

      currentFile = {
        file: null,
        hunks: [],
      }

      currentHunk = null
      continue
    }

    // 2️⃣ Capture filename
    if (line.startsWith('+++ b/')) {
      currentFile.file = line.replace('+++ b/', '').trim()
      continue
    }

    // 3️⃣ Detect new hunk
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

    // 4️⃣ Added lines
    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.addedLines.push({
        line: newLine,
        content: line.slice(1),
      })
      newLine++
      continue
    }

    // 5️⃣ Removed lines
    if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.removedLines.push({
        line: oldLine,
        content: line.slice(1),
      })
      oldLine++
      continue
    }

    // 6️⃣ Context lines
    if (!line.startsWith('\\ No newline')) {
      oldLine++
      newLine++
    }
  }

  if (currentFile) {
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
