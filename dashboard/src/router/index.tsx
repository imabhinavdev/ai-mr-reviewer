import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { publicRoutes, protectedRoutes, LOGIN_PATH } from './routes'

/**
 * Renders all application routes from the route config.
 * Protected routes require auth; unauthorized users are redirected to login.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      {publicRoutes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}

      {/* Protected routes: redirect to login when not authorized */}
      {protectedRoutes.map((route) => {
        const LayoutComponent = route.layout
        if (!LayoutComponent || !route.children?.length) return null
        return (
          <Route
            key={route.path ?? '/'}
            path={route.path}
            element={
              <ProtectedRoute redirectTo={LOGIN_PATH}>
                <LayoutComponent />
              </ProtectedRoute>
            }
          >
            {route.children.map((child) =>
              child.index ? (
                <Route key="index" index element={child.element} />
              ) : (
                <Route key={child.path} path={child.path} element={child.element} />
              )
            )}
          </Route>
        )
      })}

      {/* Catch-all: redirect to dashboard (will redirect to login if not authorized) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
