import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'

const navItems: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="size-5 shrink-0" /> },
  { to: '/analytics', label: 'Analytics', icon: <BarChart3 className="size-5 shrink-0" /> },
  { to: '/projects', label: 'Projects', icon: <FolderKanban className="size-5 shrink-0" /> },
  { to: '/integrations', label: 'Integrations', icon: <Plug className="size-5 shrink-0" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="size-5 shrink-0" /> },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [hovered, setHovered] = useState(false)
  const showLabels = !collapsed || hovered

  const nav = (
    <nav className={`flex flex-col gap-0.5 py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onMobileClose}
          className={({ isActive }) =>
            `flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200 ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-3'
            } ${
              isActive
                ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
            }`
          }
        >
          <span className="flex shrink-0 items-center justify-center text-current">{icon}</span>
          {showLabels && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Sidebar: mobile = drawer (off-screen when closed), desktop = always visible, width 72 or 260 */}
      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-full flex-col bg-[var(--color-sidebar)] border-r border-[var(--color-border)]',
          'w-[260px] transition-[transform,width] duration-200 ease-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
        ].join(' ')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] transition-colors ${
            collapsed ? 'px-2' : 'px-3 lg:px-4'
          }`}
        >
          {showLabels ? (
            <span className="truncate text-base font-semibold text-[var(--color-text)]">
              Nirik
            </span>
          ) : (
            <span className="text-base font-semibold text-[var(--color-primary)]">N</span>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onToggle}
              className="hidden lg:flex size-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
            {mobileOpen && (
              <button
                type="button"
                onClick={onMobileClose}
                className="lg:hidden size-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                aria-label="Close menu"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>
        </div>
        {nav}
      </aside>
    </>
  )
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden flex size-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      aria-label="Open menu"
    >
      <Menu className="size-5" />
    </button>
  )
}
