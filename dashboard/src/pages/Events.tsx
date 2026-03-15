import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '@/api/analytics'

export function Events() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', page, limit],
    queryFn: () => fetchEvents({ limit, offset: page * limit }),
  })

  if (isLoading) return <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
  if (error) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    )
  }
  if (!data) return null

  const { events, total } = data
  const totalPages = Math.ceil(total / limit) || 1

  const statusClass = (status: string) => {
    if (status === 'completed') return 'text-green-600 dark:text-green-400'
    if (status === 'failed') return 'text-red-600 dark:text-red-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-gray-900 dark:text-gray-100">
        Review events
      </h1>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Provider
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Repo
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                MR #
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Author
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Comments
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-2.5 px-3 border-t border-gray-200 dark:border-gray-700">
                  No events yet
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="p-2.5 px-3">{ev.provider}</td>
                  <td className="p-2.5 px-3">{ev.repoName}</td>
                  <td className="p-2.5 px-3">{ev.mrNumber}</td>
                  <td className="p-2.5 px-3">{ev.authorUsername ?? '—'}</td>
                  <td className="p-2.5 px-3">
                    <span className={statusClass(ev.status)}>{ev.status}</span>
                  </td>
                  <td className="p-2.5 px-3">{ev.commentsPostedCount}</td>
                  <td className="p-2.5 px-3">
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1.5 cursor-pointer bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100"
        >
          Previous
        </button>
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          Page {page + 1} of {totalPages} ({total} total)
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1.5 cursor-pointer bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  )
}
