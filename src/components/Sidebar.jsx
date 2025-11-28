import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Home, Map, LogIn, User, LogOut, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import logoNormal from '../assets/parkme-logo.png';

export default function Sidebar() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static h-full bg-gradient-to-b from-blue-600 to-blue-700 text-white transition-all duration-300 z-50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'w-24 lg:w-24' : 'w-64 lg:w-64'
        }`}
      >
        <div className="flex flex-col h-full" style={{minHeight: '100vh'}}>
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white-500">
            {!isCollapsed && (
              <img
                src={logoNormal}
                alt="ParkMe Logo"
                className="h-10 w-auto bg-white rounded p-1"
              />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-1 hover:bg-blue-500 rounded"
              >
                <ChevronLeft className={`w-10 h-10 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1 hover:bg-blue-500 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center' : ''
                  } gap-2 pt-2 pb-2 pl-2 pr-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 shadow-lg'
                      : 'hover:bg-blue-500 hover:bg-opacity-50'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={`flex items-center justify-center ${
                      isCollapsed
                        ? 'w-11 h-11'
                        : ''
                    }`}
                  >
                    <Icon
                      className={`${
                        isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                      } flex-shrink-0`}
                    />
                  </span>
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Auth section */}
          <div className="p-4 border-t border-white-500">
            {session ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center' : ''
                  } gap-3 p-3 rounded-lg hover:bg-blue-500 hover:bg-opacity-50 transition-colors mb-2`}
                  title={isCollapsed ? 'Profile' : undefined}
                >
                  <span
                    className={`flex items-center justify-center ${
                      isCollapsed
                        ? 'w-11 h-11'
                        : ''
                    }`}
                  >
                    <User className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  </span>
                  {!isCollapsed && <span className="font-medium">Profile</span>}
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center' : ''
                  } gap-3 p-3 rounded-lg hover:bg-red-600 transition-colors`}
                  title={isCollapsed ? 'Sign Out' : undefined}
                >
                  <span
                    className={`flex items-center justify-center ${
                      isCollapsed
                        ? 'w-11 h-11'
                        : ''
                    }`}
                  >
                    <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  </span>
                  {!isCollapsed && <span className="font-medium">Sign Out</span>}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center' : ''
                } gap-3 p-3 rounded-lg hover:bg-blue-500 hover:bg-opacity-50 transition-colors`}
                title={isCollapsed ? 'Sign In' : undefined}
              >
                <span
                  className={`flex items-center justify-center ${
                    isCollapsed
                      ? 'w-11 h-11 rounded-lg bg-blue-700'
                      : ''
                  }`}
                >
                  <LogIn className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                </span>
                {!isCollapsed && <span className="font-medium">Sign In</span>}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

