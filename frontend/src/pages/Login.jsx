import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function Login() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setLoading(true)
    setError('')
    
    try {
      // Set the key temporarily in localStorage so the API client picks it up
      localStorage.setItem('apiKey', apiKey.trim())
      
      const res = await api.get('/verify')
      if (res.data.valid) {
        navigate('/events')
      } else {
        localStorage.removeItem('apiKey')
        setError('Invalid API key')
      }
    } catch (err) {
      localStorage.removeItem('apiKey')
      if (err.response && err.response.status === 403) {
        setError('Invalid API key. Please check and try again.')
      } else {
        setError('Connection error. Please ensure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Enter your tenant API key to access the audit logs.
        </p>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>API KEY</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Demo API Key: <code style={{ color: 'var(--accent-secondary)' }}>test-api-key-123</code>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login