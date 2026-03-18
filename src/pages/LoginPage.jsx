import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (localStorage.getItem('garment_token')) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username || !password) return setError('Enter username and password')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ink-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-800 mb-4">
            <span className="text-primary-400 font-display font-bold text-2xl">TS</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-ink-50">Supekar Garments</h1>
          <p className="text-ink-500 text-sm mt-1">Billing System</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="section-label block mb-1.5">Username</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}