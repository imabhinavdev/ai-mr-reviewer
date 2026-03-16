import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fetchActivity } from '@/api/analytics'

function getDateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function Activity() {
  const [days, setDays] = useState(30)
  const range = getDateRange(days)

  const { data, isLoading, error } = useQuery({
    queryKey: ['activity', range.from, range.to],
    queryFn: () =>
      fetchActivity({
        from: range.from,
        to: range.to,
        bucket: days > 14 ? 'week' : 'day',
      }),
  })

  if (isLoading)
    return (
      <p className="text-gray-600 dark:text-gray-400">Loading activity...</p>
    )
  if (error) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    )
  }

  const chartData = Array.isArray(data) ? data : []

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="m-0 text-2xl font-medium text-gray-900 dark:text-gray-100">
          Activity
        </h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[320px]">
        {chartData.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No activity in this range
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" name="Reviews" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
