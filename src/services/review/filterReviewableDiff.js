/**
 * Extended ignore patterns for review (reduce tokens).
 * getDiffFromEvent already filters node_modules, dist, package*.json, etc.
 * This adds lock files, minified, source maps, env files, and binary-like extensions.
 */
const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  '.git',
]

const IGNORED_FILE_PATTERNS = [
  /^package(-lock)?\.json$/i,
  /\.lock$/i,
  /\.min\.(js|css|mjs|cjs)$/i,
  /\.(map|chunk\.js)$/i,
  /^\.env(\.|$)/i,
  /\.(png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot|pdf)$/i,
]

/**
 * @param {string} filePath
 * @returns {boolean} true if file should be excluded from review
 */
export const shouldExcludeFile = (filePath = '') => {
  const normalized = filePath.replace(/\\/g, '/').trim()
  if (!normalized) return true

  const fileName = normalized.split('/').pop() || ''

  if (IGNORED_FILE_PATTERNS.some((re) => re.test(fileName))) {
    return true
  }

  return IGNORED_DIRS.some(
    (dir) =>
      normalized === dir ||
      normalized.startsWith(`${dir}/`) ||
      normalized.includes(`/${dir}/`),
  )
}

/**
 * Filter parsed diff to only include reviewable files (reduces tokens).
 * @param {Array<{ file: string, hunks: Array }>} diffFiles - output from getDiffFromEvent
 * @returns {Array<{ file: string, hunks: Array }>} filtered diff, same shape
 */
export const filterReviewableDiff = (diffFiles) => {
  if (!Array.isArray(diffFiles)) return []
  return diffFiles.filter((f) => f?.file && !shouldExcludeFile(f.file))
}
