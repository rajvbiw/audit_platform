import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Events from './pages/Events'
import Exports from './pages/Exports'

function Navbar() {
  const isAuthenticated = !!localStorage.getItem('apiKey')
  const location = useLocation()
  
  if (!isAuthenticated) return null

  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 700 }}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', borderRadius: '6px' }}></div>
          <span style={{ letterSpacing: '0.05em' }}>SECURE<span style={{ color: '#6366f1' }}>AUDIT</span></span>
        </h1>
      </div>
      <div className="nav-links">
        <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>Events</Link>
        <Link to="/exports" className={location.pathname === '/exports' ? 'active' : ''}>Exports</Link>
        <button 
          onClick={() => { localStorage.removeItem('apiKey'); window.location.href = '/' }}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '0.4rem 1rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

function App() {
  const isAuthenticated = !!localStorage.getItem('apiKey')

  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={isAuthenticated ? <Events /> : <Navigate to="/login" />} />
          <Route path="/exports" element={isAuthenticated ? <Exports /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/events" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App