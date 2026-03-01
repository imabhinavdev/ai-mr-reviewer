/**
 * Extract only added lines from parsed diff for review (MVP).
 * @param {Array<{ file: string, hunks: Array<{ addedLines: Array<{ line: number, content: string }> }> }>} diffFiles
 * @returns {Array<{ file: string, line: number, content: string }>}
 */
export const extractReviewableLines = (diffFiles) => {
  if (!Array.isArray(diffFiles)) return []

  const lines = []
  for (const { file, hunks } of diffFiles) {
    if (!file || !Array.isArray(hunks)) continue
    for (const hunk of hunks) {
      const added = hunk?.addedLines ?? []
      for (const { line, content } of added) {
        lines.push({ file, line: Number(line), content: String(content ?? '') })
      }
    }
  }
  return lines
}
