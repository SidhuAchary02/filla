import { useAuth } from '../lib/useAuth'
import { useNavigate } from 'react-router-dom'
import { logout as logoutService } from '../lib/authService'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile || {}
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const workExperience = Array.isArray(profile.work_experience) ? profile.work_experience : []
  const education = Array.isArray(profile.education) ? profile.education : []
  const projects = Array.isArray(profile.projects) ? profile.projects : []
  const languages = Array.isArray(profile.languages) ? profile.languages : []
  const location = profile.location || {}
  const links = profile.links || {}

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
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-lg font-medium text-gray-900">
                    {profile.role || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Experience Level</p>
                  <p className="text-lg font-medium text-gray-900">
                    {profile.experience_level || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-lg font-medium text-gray-900">
                    {[location.city, location.state, location.country].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Minimum Salary</p>
                  <p className="text-lg font-medium text-gray-900">
                    {profile.min_salary ? `₹${Number(profile.min_salary).toLocaleString()}` : 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
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
                  <p className="text-sm text-gray-600">Languages</p>
                  <p className="text-lg font-medium text-gray-900">
                    {languages.length > 0 ? languages.join(', ') : 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Resume</p>
                  <p className="text-lg font-medium text-gray-900">
                    {profile.resume_url || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Job Timeline</p>
                  <p className="text-lg font-medium text-gray-900">
                    {profile.job_search_timeline || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Work Experience</p>
                  {workExperience.length > 0 ? (
                    <div className="space-y-2">
                      {workExperience.map((item, index) => (
                        <div key={`${item.title || 'exp'}-${index}`} className="rounded border p-3">
                          <p className="font-medium text-gray-900">{item.title || 'Untitled role'}</p>
                          <p className="text-sm text-gray-600">{item.company || 'Unknown company'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No work experience added</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Education</p>
                  {education.length > 0 ? (
                    <div className="space-y-2">
                      {education.map((item, index) => (
                        <div key={`${item.school || 'edu'}-${index}`} className="rounded border p-3">
                          <p className="font-medium text-gray-900">{item.school || 'Unknown school'}</p>
                          <p className="text-sm text-gray-600">{item.degree || 'Degree not provided'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No education added</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Projects</p>
                  {projects.length > 0 ? (
                    <div className="space-y-2">
                      {projects.map((item, index) => (
                        <div key={`${item.name || 'project'}-${index}`} className="rounded border p-3">
                          <p className="font-medium text-gray-900">{item.name || 'Untitled project'}</p>
                          <p className="text-sm text-gray-600">{item.role || 'Role not provided'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No projects added</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Links</p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>LinkedIn: {links.linkedin || 'Not provided'}</p>
                    <p>GitHub: {links.github || 'Not provided'}</p>
                    <p>Portfolio: {links.portfolio || 'Not provided'}</p>
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
