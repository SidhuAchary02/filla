import { useState } from 'react'
import { login } from '../lib/authService'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { updateUser, getToken } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setLoading(true)

    try {
      const response = await login(email, password, rememberMe)
      
      // Fetch user data to update state
      const token = getToken()
      if (token) {
        // Update user in auth context if needed
        updateUser({ email, user_id: response.user_id })
      }

      // Redirect to onboarding to check status
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_90%_10%,#ffceb8_0%,#f7f4ee_42%),radial-gradient(circle_at_10%_80%,#ffd56f_0%,#f7f4ee_32%)] px-4 py-10 text-[#1f1c17] font-[monospace] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full bg-[#ff8d62] opacity-35 blur-xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#ffc93e] opacity-35 blur-xl" />

      <div className="relative z-1 mx-auto w-full max-w-md">
        <div className="mb-6 inline-flex items-center gap-2.5 text-[1.1rem] font-extrabold tracking-[0.02em]">
          <Link to="/" className="flex items-center gap-1">
            <img src="./logo-2.png" width={38} alt="Filla Logo" />
            <span>Filla</span>
          </Link>
        </div>

        <div className="rounded-[22px] border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-6 shadow-[0_20px_45px_rgba(115,83,45,0.1)] backdrop-blur-md sm:p-7">
          <div>
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[-0.01em] text-[#9e2f09]">Welcome back</p>
            <h2 className="mt-2 text-[clamp(1.6rem,5vw,2.2rem)] font-extrabold leading-[1.08] tracking-[-0.05em]">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-[#635a4b]">
              Or{' '}
              <Link to="/signup" className="font-semibold text-[#9e2f09] hover:text-[#da5a2a]">
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-[#e7b1a0] bg-[#fff1ec] p-3">
              <p className="text-sm font-medium text-[#9e2f09]">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.03em] text-[#635a4b]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-xl border border-[#d9cebc] bg-[#fffdf8] px-3.5 py-2.5 text-[#1f1c17] outline-none transition placeholder:text-[#9b8f7f] focus:border-[#da5a2a] focus:ring-2 focus:ring-[#f6c9b9]"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.03em] text-[#635a4b]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-xl border border-[#d9cebc] bg-[#fffdf8] px-3.5 py-2.5 text-[#1f1c17] outline-none transition placeholder:text-[#9b8f7f] focus:border-[#da5a2a] focus:ring-2 focus:ring-[#f6c9b9]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#635a4b]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#d9cebc] text-[#da5a2a] focus:ring-[#f6c9b9]"
            />
            Remember me
          </label>
          </form>
        </div>
      </div>
    </div>
  )
}
