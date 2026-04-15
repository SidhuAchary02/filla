import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'
import { ExternalLink } from 'lucide-react'

function CompensationDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [formData, setFormData] = useState({
    current_ctc: '',
    min_salary: '',
    notice_period: '',
    resume_url: '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      console.log('Fetching fresh profile for compensation drawer...')
      getUserProfile(token)
        .then(freshProfile => {
          console.log('✓ Fresh profile fetched for compensation:', freshProfile)
          console.log('  - current_ctc:', freshProfile?.current_ctc)
          console.log('  - min_salary:', freshProfile?.min_salary)
          console.log('  - notice_period:', freshProfile?.notice_period)
          console.log('  - resume_url:', freshProfile?.resume_url)
          populateForm(freshProfile)
        })
        .catch(err => {
          console.error('✗ Error fetching profile:', err)
          if (profile) {
            console.log('Falling back to prop profile:', profile)
            populateForm(profile)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const populateForm = (profileData) => {
    if (!profileData) return

    // Handle both direct profile and nested profile.data structure
    const profile = profileData?.profile || profileData
    
    // Convert numeric values to strings for form display, handle null/undefined
    const formatValue = (val) => {
      if (val === null || val === undefined) return ''
      return String(val).trim()
    }

    const formDataToSet = {
      current_ctc: formatValue(profile?.current_ctc || profileData?.current_ctc),
      min_salary: formatValue(profile?.min_salary || profileData?.min_salary),
      notice_period: formatValue(profile?.notice_period || profileData?.notice_period),
      resume_url: formatValue(profile?.resume_url || profileData?.resume_url),
    }

    console.log('Profile data received:', profileData)
    console.log('Populating compensation form with:', formDataToSet)
    setFormData(formDataToSet)
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    if (isOpen) {
      populateForm(profile)
    }
  }, [isOpen, profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Structure data to match API schema
      const updateData = {
        current_ctc: formData.current_ctc ? Number(formData.current_ctc) : null,
        min_salary: formData.min_salary ? Number(formData.min_salary) : null,
        notice_period: formData.notice_period || null,
        resume_url: formData.resume_url || null,
      }

      console.log('Saving compensation data:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('✓ Profile updated successfully:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Compensation info updated successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('✗ Error saving compensation info:', error)
      setError(error.message || 'Failed to save compensation info')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    return Number(value).toLocaleString('en-IN')
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Compensation & Resume">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your information...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current CTC</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-slate-500">₹</span>
              <input
                type="number"
                name="current_ctc"
                value={formData.current_ctc}
                onChange={handleChange}
                disabled={isLoading || isSaving}
                className="block w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., 1500000"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Annual salary in your current role</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Expected Minimum Salary</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-slate-500">₹</span>
              <input
                type="number"
                name="min_salary"
                value={formData.min_salary}
                onChange={handleChange}
                disabled={isLoading || isSaving}
                className="block w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., 1500000"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Minimum salary you expect in your next role</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Notice Period</label>
            <select
              name="notice_period"
              value={formData.notice_period}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Select notice period</option>
              <option value="immediate">Immediate</option>
              <option value="2-weeks">2 Weeks</option>
              <option value="1-month">1 Month</option>
              <option value="2-months">2 Months</option>
              <option value="3-months">3 Months</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">How soon can you join a new company</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Resume URL</label>
            <input
              type="url"
              name="resume_url"
              value={formData.resume_url}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="https://example.com/resume.pdf"
            />
            <p className="mt-1 text-xs text-slate-500">Link to your resume (Google Drive, Dropbox, etc.)</p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-4">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isLoading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  )
}

export default CompensationDrawer
