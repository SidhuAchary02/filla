import { useAuth } from '../lib/useAuth'
import { useNavigate } from 'react-router-dom'
import { logout as logoutService } from '../lib/authService'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutService()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Filla</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome!</h2>
            <p className="mt-2 text-lg text-gray-600">
              You have successfully completed the onboarding process.
            </p>
          </div>

          {/* Profile Card */}
          {user?.profile && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-medium text-gray-900">
                    {user.profile.full_name || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-medium text-gray-900">
                    {user.profile.phone || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.profile.skills.length > 0 ? (
                      user.profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No skills added</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Notice Period</p>
                  <p className="text-lg font-medium text-gray-900">
                    {user.profile.notice_period || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Current CTC</p>
                  <p className="text-lg font-medium text-gray-900">
                    {user.profile.current_ctc
                      ? `₹${user.profile.current_ctc.toLocaleString()}`
                      : 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <div className="mt-2 space-y-1">
                    {Object.keys(user.profile.experience).length > 0 ? (
                      Object.entries(user.profile.experience).map(([skill, years]) => (
                        <p key={skill} className="text-sm text-gray-700">
                          {skill}: {years} years
                        </p>
                      ))
                    ) : (
                      <span className="text-gray-500">No experience added</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/onboarding')}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          )}

          {!user?.profile && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 mb-4">You haven't completed your profile yet.</p>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
