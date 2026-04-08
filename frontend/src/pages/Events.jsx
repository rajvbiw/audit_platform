import { useEffect, useState } from 'react'
import api from '../api'

function Events() {
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState({ user: '', action: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState(false)

  const searchEvents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/events', { params: filters })
      setEvents(res.data)
    } catch (err) {
      console.error(err)
      if (err.response && err.response.status === 403) {
        localStorage.removeItem('apiKey')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const simulateActivity = async () => {
    const users = ['user_101', 'user_102', 'admin_x', 'guest_2']
    const actions = ['login', 'view_resource', 'delete_item', 'update_profile', 'download']
    const resources = ['dashboard', 'api/users', 'config.yaml', 'reports/annual.pdf']
    
    setLoading(true)
    try {
      await api.post('/events', {
        userId: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        metadata: { source: 'browser_simulator' }
      })
      await searchEvents()
    } catch (err) {
      console.error(err)
      alert('Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({ user: '', action: '', startDate: '', endDate: '' })
    // We can't immediately call searchEvents because state update is async,
    // so we pass the defaults directly to the search.
    api.get('/events', { params: { user: '', action: '', startDate: '', endDate: '' } })
       .then(res => setEvents(res.data))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchEvents()
    }
  }

  useEffect(() => {
    searchEvents()
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Audit Logs</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor system activities and resource access in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={simulateActivity} 
            className="secondary" 
            disabled={loading}
            style={{ 
              padding: '0.6rem 2rem', 
              background: 'transparent', 
              border: '1px solid var(--accent-secondary)', 
              color: 'var(--accent-secondary)' 
            }}
          >
            {loading ? 'Processing...' : 'Simulate Activity'}
          </button>
          <button 
            onClick={searchEvents} 
            className="primary" 
            disabled={loading}
            style={{ padding: '0.6rem 2rem' }}
          >
            {loading ? 'Searching...' : 'Search Logs'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>USER ID</label>
            <input 
              placeholder="e.g. john" 
              value={filters.user} 
              onChange={e => setFilters({...filters, user: e.target.value})}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>ACTION</label>
            <input 
              placeholder="e.g. login" 
              value={filters.action} 
              onChange={e => setFilters({...filters, action: e.target.value})}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>FROM</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>UNTIL</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
          </div>
          <div>
            <button 
              onClick={clearFilters}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', width: '100%', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      {loading && events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Fetching secure audit feed...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>OPERATOR</th>
                <th>ACTION</th>
                <th>RESOURCE</th>
                <th>SECURITY HASH</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{ev.user_id}</td>
                  <td>
                    <span className="badge" style={{ 
                      background: 'rgba(99, 102, 241, 0.1)', 
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      {ev.action}
                    </span>
                  </td>
                  <td><code>{ev.resource}</code></td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)', fontSize: '0.8rem' }} title={ev.hash}>
                      {ev.hash.slice(0, 12)}...
                    </span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    No audit events match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Events