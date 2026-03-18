import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import BillPage from './pages/BillPage'
import HistoryPage from './pages/HistoryPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('garment_token')
  return token ? children : <Navigate to="/login" replace />
}

const navItems = [
  { to: '/', label: 'Bill', icon: '🧾', exact: true },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/products', label: 'Products', icon: '👕' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div className="flex flex-col min-h-screen">
              <header className="flex items-center justify-between px-4 py-3 bg-ink-800/80 border-b border-ink-700/50 backdrop-blur sticky top-0 z-40">
                <div className="flex items-center gap-2">
                  <span className="text-primary-400 font-display font-bold text-lg tracking-tight">Supekar</span>
                  <span className="text-ink-200 font-display font-bold text-lg tracking-tight">Garments</span>
                </div>
                <nav className="hidden sm:flex items-center gap-1">
                  {navItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      className={({ isActive }) =>
                        `px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          isActive ? 'bg-primary-400/20 text-primary-400' : 'text-ink-400 hover:text-ink-200'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </header>

              <main className="flex-1 overflow-hidden">
                <Routes>
                  <Route path="/" element={<BillPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>

              <nav className="sm:hidden flex items-center justify-around bg-ink-800/95 border-t border-ink-700/50 backdrop-blur py-2 sticky bottom-0 z-40">
                {navItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                        isActive ? 'text-primary-400' : 'text-ink-500'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  )
}