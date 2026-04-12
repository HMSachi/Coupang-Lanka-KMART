import React, { useState } from 'react'

export default function LoginForm({ onLogin, validUsers }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    
    const userKey = username.trim().toLowerCase();
    const account = validUsers[userKey];

    if (account && password === account.password) {
      onLogin(account.role);
      setError('');
      return;
    }

    setError('Invalid credentials. Use admin@g.com or cashier@g.com w/ 1234ab');
  }

  return (
    <section className="pos-form-shell" aria-label="POS login form">
      <div className="pos-form-card">
        <h2 className="form-heading">Sign in to POS Console</h2>
        <p className="form-help">
          Enter your staff credentials to continue billing, stock, and counter operations.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-wrap">
            <label htmlFor="staff-id">Email ID</label>
            <input 
              id="staff-id" 
              name="staffId" 
              type="text" 
              placeholder="admin@g.com" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="input-wrap">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && <p style={{color: '#ef4444', fontSize: '0.85rem', marginTop: '4px'}}>{error}</p>}

          <div className="form-row">
            <label className="remember-control" htmlFor="remember-me">
              <input id="remember-me" type="checkbox" name="remember" />
              <span>Keep me signed in</span>
            </label>
            <a className="forgot-link" href="#">Forgot password?</a>
          </div>

          <button className="submit-btn" type="submit">Sign In Securely</button>
        </form>

        <p className="support-line">Need access help? </p>
        <p className="status-badge">System Status: Operational</p>
      </div>
    </section>
  )
}
