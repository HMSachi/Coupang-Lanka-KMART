import React from 'react'

export default function BrandPanel() {
  return (
    <section className="pos-brand-panel" aria-label="Brand information">
      <div>
        <div className="brand-top">
          <div className="brand-logo" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'}}>✨</div>
          <div>
            <p className="brand-kicker">BEAUTY POS</p>
            <h1 className="brand-title">Luxe Cosmetics</h1>
          </div>
        </div>

        <p className="brand-subtitle">
          Unified checkout, inventory, and shift operations from one secure point of sale platform for our beauty bar.
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
