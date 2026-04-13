import { useState, useEffect } from 'react'
import { submitOnboarding, getUserProfile, getOnboardingStatus } from '../lib/authService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function OnboardingForm() {
  const { user, loading, getToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    skills: [],
    experience: {},
    notice_period: '',
    current_ctc: '',
  })

  const [skillInput, setSkillInput] = useState('')
  const [experienceSkill, setExperienceSkill] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [loadingForm, setLoadingForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if not authenticated (but only after loading finishes)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  // Redirect if onboarding is already completed
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const isOnboardingComplete = localStorage.getItem('onboarding_complete') === 'true'
      if (isOnboardingComplete) {
        navigate('/dashboard')
      }
    }
  }, [isAuthenticated, loading, navigate])

  // Fetch existing profile data if available
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken()
        if (token) {
          const profile = await getUserProfile(token)
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            skills: profile.skills || [],
            experience: profile.experience || {},
            notice_period: profile.notice_period || '',
            current_ctc: profile.current_ctc || '',
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      }
    }

    if (isAuthenticated) {
      fetchProfile()
    }
  }, [isAuthenticated, getToken])

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Add skill to list
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  // Remove skill from list
  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
      experience: (() => {
        const newExp = { ...prev.experience }
        delete newExp[skillToRemove]
        return newExp
      })(),
    }))
  }

  // Add experience entry
  const addExperience = () => {
    if (experienceSkill.trim() && experienceYears) {
      setFormData((prev) => ({
        ...prev,
        experience: {
          ...prev.experience,
          [experienceSkill.trim()]: parseInt(experienceYears, 10),
        },
      }))
      setExperienceSkill('')
      setExperienceYears('')
    }
  }

  // Remove experience entry
  const removeExperience = (skillKey) => {
    setFormData((prev) => {
      const newExp = { ...prev.experience }
      delete newExp[skillKey]
      return {
        ...prev,
        experience: newExp,
      }
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }

    setLoadingForm(true)

    try {
      const token = getToken()
      if (!token) {
        setError('Not authenticated')
        navigate('/login')
        return
      }

      await submitOnboarding(formData, token)
      setSuccess(true)

      // Mark onboarding as complete in localStorage
      localStorage.setItem('onboarding_complete', 'true')

      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingForm(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-gray-600">Help us get to know you better</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Profile updated successfully! Redirecting...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* FULL NAME */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          {/* PHONE */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* SKILLS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Python"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* EXPERIENCE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience (by skill)
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={experienceSkill}
                onChange={(e) => setExperienceSkill(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Skill name"
              />
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Years"
                min="0"
                max="60"
              />
              <button
                type="button"
                onClick={addExperience}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(formData.experience).map(([skill, years]) => (
                <div
                  key={skill}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <span className="text-sm font-medium">
                    {skill}: <span className="text-gray-600">{years} years</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(skill)}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* NOTICE PERIOD */}
          <div>
            <label htmlFor="notice_period" className="block text-sm font-medium text-gray-700">
              Notice Period
            </label>
            <select
              id="notice_period"
              name="notice_period"
              value={formData.notice_period}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select notice period</option>
              <option value="immediate">Immediate</option>
              <option value="1 week">1 Week</option>
              <option value="2 weeks">2 Weeks</option>
              <option value="1 month">1 Month</option>
              <option value="2 months">2 Months</option>
              <option value="3 months">3 Months</option>
            </select>
          </div>

          {/* CURRENT CTC */}
          <div>
            <label htmlFor="current_ctc" className="block text-sm font-medium text-gray-700">
              Current CTC (Cost to Company)
            </label>
            <input
              type="number"
              id="current_ctc"
              name="current_ctc"
              value={formData.current_ctc}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 500000"
              min="0"
              step="10000"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loadingForm}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
            >
              {loadingForm ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
            >
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
