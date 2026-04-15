import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

const jobSearchOptions = [
  { value: 'ASAP', label: 'ASAP' },
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: 'within_6_months', label: 'Within 6 months' },
  { value: 'passive', label: 'Passive (Open to opportunities)' },
]

function JobSearchStatusDrawer({ isOpen, onClose, profile, user, onSave, token }) {
  const [formData, setFormData] = useState({
    job_search_timeline: '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      getUserProfile(token)
        .then(freshProfile => {
          console.log('Fresh profile fetched from server:', freshProfile)
          populateForm(freshProfile)
        })
        .catch(err => {
          console.error('Error fetching profile:', err)
          if (profile) {
            populateForm(profile)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const populateForm = (profileData) => {
    if (!profileData) return

    const formDataToSet = {
      job_search_timeline: profileData?.job_search_timeline || '',
    }

    console.log('Populating form with:', formDataToSet)
    setFormData(formDataToSet)
    setError('')
    setSuccess('')
  }

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
      const updateData = {
        job_search_timeline: formData.job_search_timeline || undefined,
      }

      console.log('Saving job search status:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('API Response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Job search status updated successfully!')
      
      // Refetch profile to get updated data
      setTimeout(async () => {
        try {
          const freshProfile = await getUserProfile(token)
          console.log('Fresh profile after save:', freshProfile)
          populateForm(freshProfile)
        } catch (err) {
          console.error('Error refetching profile:', err)
        }
        
        // Close drawer after a short delay
        setTimeout(() => {
          onClose()
        }, 500)
      }, 1000)
    } catch (error) {
      console.error('Error saving job search status:', error)
      setError(error.message || 'Failed to save job search status')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusLabel = (value) => {
    const option = jobSearchOptions.find(opt => opt.value === value)
    return option?.label || value
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Job Search Status">
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

        {/* Current Status Display */}
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Current Status</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{user?.profile?.first_name} {user?.profile?.last_name}</p>
            <p className="text-xs text-slate-600">{user?.email}</p>
            <p className="mt-2 text-sm text-cyan-600 font-semibold">{getStatusLabel(formData.job_search_timeline)}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Search Timeline</label>
          <select
            name="job_search_timeline"
            value={formData.job_search_timeline}
            onChange={handleChange}
            disabled={isLoading || isSaving}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">-- Select status --</option>
            {jobSearchOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3">Status Options:</p>
          <div className="space-y-2">
            {jobSearchOptions.map(option => (
              <div
                key={option.value}
                onClick={() => setFormData({ job_search_timeline: option.value })}
                className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                  formData.job_search_timeline === option.value
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{option.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-cyan-400"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  )
}

export default JobSearchStatusDrawer
