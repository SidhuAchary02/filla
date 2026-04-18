import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import OnboardingForm from './components/OnboardingForm'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />

        {/* Protected Routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/:stepSlug"
          element={
            <ProtectedRoute>
              <OnboardingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
