import React from 'react'
import logo from '../../../assets/logo.jpeg'

export default function BrandPanel() {
  return (
    <section className="pos-brand-panel" aria-label="Brand information">
      <div>
        <div className="brand-top">
          <img className="brand-logo" src={logo} alt="Coupang Kmart logo" />
          <div>
            <p className="brand-kicker">POS MANAGEMENT</p>
            <h1 className="brand-title">Coupang Kmart</h1>
          </div>
        </div>

        <p className="brand-subtitle">
          Unified checkout, inventory, and shift operations from one secure point of sale platform.
        </p>
      </div>

      <div className="brand-metrics" aria-label="System status metrics">
        <article className="metric-card">
          <p className="metric-value">99.9%</p>
          <p className="metric-label">Uptime</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">24/7</p>
          <p className="metric-label">Support</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">256-bit</p>
          <p className="metric-label">Encryption</p>
        </article>
      </div>
    </section>
  )
}
