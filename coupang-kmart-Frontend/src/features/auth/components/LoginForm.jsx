import React from 'react'

export default function LoginForm() {
  function handleSubmit(event) {
    event.preventDefault()
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
            <label htmlFor="staff-id">Staff ID</label>
            <input id="staff-id" name="staffId" type="text" placeholder="e.g. POS-1024" required />
          </div>

          <div className="input-wrap">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Enter your password" required />
          </div>

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
