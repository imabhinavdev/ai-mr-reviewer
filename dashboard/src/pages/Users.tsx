import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '@/api/analytics'

export function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  if (isLoading) {
    return <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
  }
  if (error) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    )
  }
  if (!data) return null

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-gray-900 dark:text-gray-100">
        Users
      </h1>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Provider
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Username
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                MR count
              </th>
              <th className="p-2.5 px-3 text-left font-semibold bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Comments
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-2.5 px-3 border-t border-gray-200 dark:border-gray-700"
                >
                  No users yet
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={`${row.provider}-${row.authorUsername ?? i}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="p-2.5 px-3">{row.provider}</td>
                  <td className="p-2.5 px-3">{row.authorUsername ?? '—'}</td>
                  <td className="p-2.5 px-3">{row.mrCount}</td>
                  <td className="p-2.5 px-3">{row.commentCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
