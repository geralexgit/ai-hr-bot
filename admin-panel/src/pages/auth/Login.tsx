import { h } from 'preact'
import { useState } from 'preact/hooks'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    // TODO: Implement authentication logic
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            Sign in to AI HR Bot Admin
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input"
                  placeholder="admin@example.com"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" className="btn-primary w-full">
                Sign in
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
