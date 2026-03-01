/** Max added lines per chunk (configurable). */
const MAX_LINES_PER_CHUNK = 120

/**
 * Chunk reviewable lines so each chunk has at most MAX_LINES_PER_CHUNK lines.
 * Prefers not to split in the middle of a file: finish the current file, then start next chunk.
 * @param {Array<{ file: string, line: number, content: string }>} reviewableLines
 * @param {{ maxLinesPerChunk?: number }} options
 * @returns {Array<Array<{ file: string, line: number, content: string }>>}
 */
export const chunkReviewableLines = (reviewableLines, options = {}) => {
  const maxLines = options.maxLinesPerChunk ?? MAX_LINES_PER_CHUNK
  if (!Array.isArray(reviewableLines) || reviewableLines.length === 0) {
    return []
  }

  const chunks = []
  let currentChunk = []
  let currentLineCount = 0
  let currentFile = null

  for (const item of reviewableLines) {
    const fileChanged = currentFile !== null && item.file !== currentFile
    const atOrOverLimit = currentLineCount >= maxLines

    // Start new chunk only at file boundary when over limit (finish current file first)
    if (atOrOverLimit && fileChanged && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = []
      currentLineCount = 0
    }

    currentChunk.push(item)
    currentLineCount++
    currentFile = item.file
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}
