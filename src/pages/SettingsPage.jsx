import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import axios from 'axios'
import { login } from '../api/auth'

export default function SettingsPage() {
  const { settings, isLoading, updateSettings, isSaving } = useSettings()

  const [form, setForm] = useState({ shopName: '', shopAddress: '', shopPhone: '', gstNumber: '' })
  const [qtySteps, setQtySteps] = useState([1, 2, 3, 6, 9, 12, 15, 18, 21, 24])
  const [qtyInput, setQtyInput] = useState('')

  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || '')
  const [connStatus, setConnStatus] = useState(null)
  const [testing, setTesting] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName || '',
        shopAddress: settings.shopAddress || '',
        shopPhone: settings.shopPhone || '',
        gstNumber: settings.gstNumber || '',
      })
      if (settings.qtySteps?.length) {
        setQtySteps(settings.qtySteps)
        setQtyInput(settings.qtySteps.join(', '))
      }
    }
  }, [settings])

  async function handleSave() {
    setSaveError('')
    setSaved(false)
    try {
      const stepsArr = qtyInput.split(/[\s,]+/).map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0)
      await updateSettings({ ...form, qtySteps: stepsArr.length ? stepsArr : qtySteps })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setSaveError(e.response?.data?.message || 'Save failed')
    }
  }

  async function testConnection() {
    setTesting(true)
    setConnStatus(null)
    try {
      const url = apiUrl.replace(/\/api\/?$/, '')
      await axios.get(`${url}/api/health`, { timeout: 5000 })
      setConnStatus('ok')
    } catch {
      setConnStatus('fail')
    } finally {
      setTesting(false)
    }
  }

  async function handleLogin() {
    setLoginError('')
    setLoginSuccess('')
    if (!username || !password) return setLoginError('Enter username and password')
    setLoggingIn(true)
    try {
      await login(username, password)
      setLoginSuccess('✓ Logged in successfully')
      setPassword('')
    } catch (e) {
      setLoginError(e.response?.data?.message || 'Login failed')
    } finally {
      setLoggingIn(false)
    }
  }

  const isLoggedIn = !!localStorage.getItem('garment_token')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Shop settings */}
      <div className="card p-5 space-y-4">
        <h2 className="font-display font-bold text-ink-100">Shop Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="section-label block mb-1.5">Shop Name</label>
            <input className="input" value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} placeholder="Fashion Garments" />
          </div>
          <div>
            <label className="section-label block mb-1.5">Phone</label>
            <input className="input" value={form.shopPhone} onChange={e => setForm(f => ({ ...f, shopPhone: e.target.value }))} placeholder="9876543210" />
          </div>
          <div className="sm:col-span-2">
            <label className="section-label block mb-1.5">Address</label>
            <input className="input" value={form.shopAddress} onChange={e => setForm(f => ({ ...f, shopAddress: e.target.value }))} placeholder="Main Market, Pune" />
          </div>
          <div>
            <label className="section-label block mb-1.5">GST Number</label>
            <input className="input font-mono" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="27XXXXX0000X1Z5" />
          </div>
        </div>
      </div>

      {/* Qty steps */}
      <div className="card p-5 space-y-3">
        <h2 className="font-display font-bold text-ink-100">Quantity Steps</h2>
        <p className="text-xs text-ink-500">Steps used by +/- buttons in bill. Comma or space separated.</p>
        <input
          className="input font-mono text-sm"
          value={qtyInput}
          onChange={e => setQtyInput(e.target.value)}
          placeholder="1, 2, 3, 6, 9, 12..."
        />
        <div className="flex flex-wrap gap-1.5">
          {(qtyInput || '').split(/[\s,]+/).filter(Boolean).map((n, i) => (
            <span key={i} className="chip chip-default font-mono">{n}</span>
          ))}
        </div>
      </div>

      {/* Save */}
      {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
      <button onClick={handleSave} disabled={isSaving || isLoading} className="btn-primary w-full py-3">
        {isSaving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* API connection */}
      <div className="card p-5 space-y-3">
        <h2 className="font-display font-bold text-ink-100">Backend Connection</h2>
        <div className="flex gap-2">
          <input
            className="input flex-1 font-mono text-sm"
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
            placeholder="http://localhost:3001/api"
          />
          <button onClick={testConnection} disabled={testing} className="btn-ghost text-sm flex-shrink-0 px-4">
            {testing ? '…' : 'Test'}
          </button>
        </div>
        {connStatus === 'ok' && <p className="text-primary-400 text-sm flex items-center gap-1.5">✓ Connected</p>}
        {connStatus === 'fail' && <p className="text-red-400 text-sm">✗ Connection failed</p>}
        <p className="text-xs text-ink-500">To change the API URL permanently, update <code className="font-mono bg-ink-700 px-1 rounded">VITE_API_URL</code> in your <code className="font-mono bg-ink-700 px-1 rounded">.env</code> and rebuild.</p>
      </div>

      {/* Login */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-ink-100">Login</h2>
          {isLoggedIn && <span className="text-xs text-primary-400 bg-primary-400/10 border border-primary-400/20 px-2.5 py-1 rounded-full">Logged in</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input text-sm" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          <input className="input text-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
        {loginSuccess && <p className="text-primary-400 text-sm">{loginSuccess}</p>}
        <div className="flex gap-2">
          <button onClick={handleLogin} disabled={loggingIn} className="btn-primary flex-1 text-sm">{loggingIn ? '…' : 'Login'}</button>
          {isLoggedIn && (
            <button onClick={() => { localStorage.removeItem('garment_token'); window.location.href = '/login' }} className="btn-danger text-sm px-4">Logout</button>
          )}
        </div>
      </div>
    </div>
  )
}