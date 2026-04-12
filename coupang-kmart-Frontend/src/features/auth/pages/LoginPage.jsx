import React, { useEffect, useRef, useState } from 'react'
import logo from '../../../assets/logo.jpeg'
import '../styles/auth.css'
import AdminDashboard from '../../admin/pages/AdminDashboard'
import CashierDashboard from '../../cashier/pages/CashierDashboard'

const HARDCODED_USERS = {
  'admin@g.com': {
    password: '1234ab',
    role: 'superAdmin'
  },
  'cashier@g.com': {
    password: '1234ab',
    role: 'cashier'
  }
}

export default function LoginPage() {
  const pageRef = useRef(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeRole, setActiveRole] = useState('')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('posTheme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    }

    const el = pageRef.current
    if (!el) return

    function handlePointer(e) {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) - rect.width / 2
      const y = (e.clientY - rect.top) - rect.height / 2
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    }

    window.addEventListener('pointermove', handlePointer)
    return () => window.removeEventListener('pointermove', handlePointer)
  }, [])

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem('posTheme', next)
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()

    const userKey = username.trim().toLowerCase()
    const account = HARDCODED_USERS[userKey]

    if (account && password === account.password) {
      setActiveRole(account.role)
      setError('')
      return
    }

    setError('Invalid login credentials. Use admin@g.com or cashier@g.com with password 1234ab.')
  }

  function handleLogout() {
    setActiveRole('')
    setUsername('')
    setPassword('')
    setError('')
  }

  if (activeRole === 'superAdmin') {
    return <AdminDashboard onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
  }

  if (activeRole === 'cashier') {
    return <CashierDashboard onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className={`login-page ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`} ref={pageRef}>
      <div className="login-card" role="main" aria-label="POS login">
        <div className="logo-shell" aria-hidden>
          <img src={logo} alt="Coupang Kmart logo" className="logo-img" />
        </div>
        <h1 className="login-welcome">Welcome Back</h1>
        <p className="login-sub">Sign in to your POS account to continue billing and operations.</p>

        <form className="card-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="input-with-icon">
            <span className="input-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 8.5l-9 6-9-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Email ID"
              aria-label="Email ID"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-with-icon">
            <span className="input-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="form-row">
            <label className="remember-control" htmlFor="remember-me">
              <input id="remember-me" name="remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <a className="forgot-link" href="#">Forgot Password?</a>
          </div>

          <div className="btn-row">
            <button className="btn-primary" type="submit">LOGIN</button>
          </div>
        </form>
      </div>
    </div>
  )
}
