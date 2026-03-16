import { type ReactNode } from 'react'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { Overview } from '@/pages/Overview'
import { Analytics } from '@/pages/Analytics'
import { Projects } from '@/pages/Projects'
import { Integrations } from '@/pages/Integrations'
import { Settings } from '@/pages/Settings'
import { Users } from '@/pages/Users'
import { UserProfile } from '@/pages/UserProfile'
import { Reviews } from '@/pages/Reviews'
import { ReviewDetail } from '@/pages/ReviewDetail'
import { RepositoryDetail } from '@/pages/RepositoryDetail'
import { Profile } from '@/pages/Profile'
import { Rules } from '@/pages/Rules'
import { Queue } from '@/pages/Queue'
import { WebhookEvents } from '@/pages/WebhookEvents'

export const LOGIN_PATH = '/login'

/** Public routes: no auth required. Redirect to dashboard if already logged in is handled in Login/Signup. */
export const publicRoutes: RouteConfig[] = [
  { path: '/login', element: <Login />, title: 'Login' },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    title: 'Forgot password',
  },
]

/** Protected routes: require auth. Redirect to login when not authorized. Uses `layout` so the router wraps with ProtectedRoute and renders child routes inside Layout's Outlet. */
export const protectedRoutes: RouteConfig[] = [
  {
    path: '/',
    layout: Layout,
    title: 'Dashboard',
    children: [
      { index: true, element: <Overview />, title: 'Overview' },
      { path: 'reviews', element: <Reviews />, title: 'Reviews' },
      {
        path: 'reviews/:id',
        element: <ReviewDetail />,
        title: 'Review details',
      },
      { path: 'projects', element: <Projects />, title: 'Repositories' },
      {
        path: 'projects/:provider/:repoId',
        element: <RepositoryDetail />,
        title: 'Repository details',
      },
      {
        path: 'integrations',
        element: <Integrations />,
        title: 'Integrations',
      },
      { path: 'profile', element: <Profile />, title: 'Profile' },
      { path: 'analytics', element: <Analytics />, title: 'Analytics' },
      { path: 'queue', element: <Queue />, title: 'Queue' },
      { path: 'webhooks', element: <WebhookEvents />, title: 'Webhook events' },
      { path: 'rules', element: <Rules />, title: 'Rules' },
      { path: 'settings', element: <Settings />, title: 'Settings' },
      { path: 'users', element: <Users />, title: 'Users' },
      {
        path: 'users/:provider/:username',
        element: <UserProfile />,
        title: 'User profile',
      },
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
