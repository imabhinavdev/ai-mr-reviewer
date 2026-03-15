import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../api/auth'
import { SidebarTrigger } from './Sidebar'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, clearUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current && !userMenuRef.current.contains(e.target as Node) &&
        notifRef.current && !notifRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    clearUser()
    navigate('/login', { replace: true })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchOpen(false)
      setSearchQuery('')
      // Could navigate to search results or trigger global search
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 sm:gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/80 min-w-0">
      <SidebarTrigger onClick={onMenuClick} />

      {/* Quick search */}
      <form
        onSubmit={handleSearch}
        className="relative hidden sm:block flex-1 max-w-md"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-4 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {/* Optional badge */}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 shadow-lg">
              <div className="px-4 py-2 text-sm font-medium text-[var(--color-text)]">
                Notifications
              </div>
              <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-medium text-sm">
              {(user?.username ?? 'A').charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium md:inline-block max-w-[120px] truncate">
              {user?.username ?? 'Admin'}
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
              <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">
                  {user?.username ?? 'Admin'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Signed in</p>
              </div>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                <User className="size-4" /> Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-error)]"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
