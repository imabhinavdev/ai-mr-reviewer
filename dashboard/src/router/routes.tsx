import { type ReactNode } from 'react'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { Overview } from '@/pages/Overview'
import { Analytics } from '@/pages/Analytics'
import { Projects } from '@/pages/Projects'
import { Integrations } from '@/pages/Integrations'
import { Settings } from '@/pages/Settings'

export const LOGIN_PATH = '/login'

/** Public routes: no auth required. Redirect to dashboard if already logged in is handled in Login/Signup. */
export const publicRoutes: RouteConfig[] = [
  { path: '/login', element: <Login />, title: 'Login' },
  { path: '/forgot-password', element: <ForgotPassword />, title: 'Forgot password' },
]

/** Protected routes: require auth. Redirect to login when not authorized. Uses `layout` so the router wraps with ProtectedRoute and renders child routes inside Layout's Outlet. */
export const protectedRoutes: RouteConfig[] = [
  {
    path: '/',
    layout: Layout,
    title: 'Dashboard',
    children: [
      { index: true, element: <Overview />, title: 'Overview' },
      { path: 'analytics', element: <Analytics />, title: 'Analytics' },
      { path: 'projects', element: <Projects />, title: 'Projects' },
      { path: 'integrations', element: <Integrations />, title: 'Integrations' },
      { path: 'settings', element: <Settings />, title: 'Settings' },
    ],
  },
]

export interface RouteConfig {
  path?: string
  index?: boolean
  /** Omit when using layout + children (protected layout route). */
  element?: ReactNode
  title?: string
  layout?: React.ComponentType
  children?: RouteConfig[]
}
