import { useEffect, useState } from 'react'
import api from '../api'

function Exports() {
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState('idle') // idle, processing, completed, error
  const [downloadUrl, setDownloadUrl] = useState('')

  const pollStatus = async (id) => {
    try {
      const res = await api.get(`/export/${id}`)
      if (res.data.state === 'completed') {
        setStatus('completed')
        setDownloadUrl(res.data.downloadUrl)
        setLoading(false)
      } else if (res.data.state === 'failed') {
        setStatus('error')
        setLoading(false)
      } else {
        // Continue polling
        setTimeout(() => pollStatus(id), 2000)
      }
    } catch (err) {
      console.error('Polling error:', err)
      setStatus('error')
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setJobId(null)
    setStatus('processing')
    setDownloadUrl('')
    
    try {
      const res = await api.post('/export', { filters: {} })
      setJobId(res.data.jobId)
      pollStatus(res.data.jobId)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setLoading(false)
      alert('Failed to queue export')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Data Exports</h2>
        <p style={{ color: 'var(--text-muted)' }}>Generate secure CSV reports of your audit history.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ marginBottom: '1rem' }}>Full History Export</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Generate a complete report of all events associated with your tenant. This includes metadata and security hashes for verification.
          </p>
          
          {status === 'idle' && (
            <button className="primary" onClick={handleExport} disabled={loading} style={{ width: '100%' }}>
              Request Export (CSV)
            </button>
          )}

          {status === 'processing' && (
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div className="spinner" style={{ marginBottom: '1rem' }}></div>
              <p style={{ fontSize: '0.9rem' }}>Generating report... (Job #{jobId})</p>
            </div>
          )}

          {status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a 
                href={downloadUrl} 
                className="button primary" 
                style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: '0.8rem' }}
                download
              >
                Download Ready (CSV)
              </a>
              <button onClick={() => setStatus('idle')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Start New Export
              </button>
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: '#ff4d4d', textAlign: 'center' }}>
              <p>Export failed. Please try again.</p>
              <button onClick={() => setStatus('idle')} className="primary" style={{ marginTop: '1rem' }}>Retry</button>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ opacity: 0.6, pointerEvents: 'none' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ marginBottom: '1rem' }}>Scheduled Reports</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Set up automatic daily or weekly exports to your secure S3 bucket or email. (Enterprise Feature)
          </p>
          <button style={{ width: '100%', background: 'var(--glass-border)', color: 'var(--text-muted)' }}>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  )
}

export default Exports