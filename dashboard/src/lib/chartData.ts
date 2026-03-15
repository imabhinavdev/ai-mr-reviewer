/**
 * Normalizes raw activity data from the API into a shape Recharts expects.
 * Tolerates missing or alternate keys (e.g. bucket/total) so charts always get valid data.
 */
export interface ActivityChartPoint {
  date: string
  count: number
}

type RawPoint = Record<string, unknown> & {
  date?: string | Date | null
  count?: number | string | null
  bucket?: string | Date | null
  total?: number | string | null
}

export function normalizeActivityData(raw: unknown): ActivityChartPoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (item == null || typeof item !== 'object') return null
      const d = item as RawPoint
      const date =
        d.date != null
          ? typeof d.date === 'string'
            ? d.date.slice(0, 10)
            : d.date instanceof Date
              ? d.date.toISOString().slice(0, 10)
              : null
          : d.bucket != null
            ? typeof d.bucket === 'string'
              ? d.bucket.slice(0, 10)
              : d.bucket instanceof Date
                ? d.bucket.toISOString().slice(0, 10)
                : null
            : null
      const count =
        d.count != null ? Number(d.count) : d.total != null ? Number(d.total) : 0
      if (date == null || Number.isNaN(count)) return null
      return { date, count: Math.max(0, count) }
    })
    .filter((p): p is ActivityChartPoint => p != null)
}
