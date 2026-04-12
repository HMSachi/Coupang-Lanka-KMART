import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck } from 'lucide-react'
import Button from '../../../components/shared/Button'
import Input from '../../../components/shared/Input'
import Card from '../../../components/shared/Card'
import logo from '../../../assets/logo.jpeg'
import '../styles/auth.css'

import { DUMMY_USERS } from '../../../services/dummyData';

const HARDCODED_USERS = DUMMY_USERS;

export default function LoginPage() {
  const pageRef = useRef(null)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState('light')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      if (user.role === 'superAdmin') navigate('/admin')
      else if (user.role === 'cashier') navigate('/pos')
    }

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
  }, [navigate])

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Artificial delay for premium feel
    setTimeout(() => {
      const userKey = username.trim().toLowerCase()
      const account = HARDCODED_USERS[userKey]

      if (account && password === account.password) {
        const userData = { email: userKey, role: account.role }
        localStorage.setItem('user', JSON.stringify(userData))

        if (account.role === 'cashier') {
          localStorage.setItem('shift_status', 'open')
          navigate('/pos')
        } else if (account.role === 'superAdmin') {
          navigate('/admin')
        }
        return
      }

      setError('Invalid credentials. Hint: use admin@g.com or cashier@g.com')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className={`login-container-new ${theme}`} ref={pageRef}>
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <div className="login-content">
        <div className="brand-section">
          <div className="brand-badge">
            <ShieldCheck size={20} />
            <span>Secure POS Entry</span>
          </div>
          <h1>Coupang <span>Kmart</span></h1>
          <p>Streamlined Retail Management & High-Speed POS Solutions</p>
        </div>

        <Card glass className="login-form-card" padding="none">
          <div className="form-inner">
            <div className="form-header-premium">
              <h2>Welcome Back</h2>
              <p>Please enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                label="Email Address"
                placeholder="name@company.com"
                icon={Mail}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <div style={{ marginTop: '1.25rem' }}>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="login-error-premium">
                  {error}
                </div>
              )}

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </div>
          <div className="form-footer">
            <p>Protected by Coupang Enterprise Security</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
