import React from 'react'
import BrandPanel from '../components/BrandPanel'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  return (
    <main className="pos-login">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}
