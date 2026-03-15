import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const SIDEBAR_W = 260
const SIDEBAR_W_COLLAPSED = 72

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content: offset by sidebar width on desktop only */}
      <div
        className="layout-content flex flex-1 flex-col min-h-screen min-w-0 transition-[margin] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
