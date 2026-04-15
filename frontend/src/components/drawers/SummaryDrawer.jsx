import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile } from '../../lib/authService'

function SummaryDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [formData, setFormData] = useState({
    role: '',
    experience_level: '',
    min_salary: '',
    job_search_timeline: 'Actively looking',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sync profile data whenever it changes or drawer opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        role: profile?.role || '',
        experience_level: profile?.experience_level || '',
        min_salary: profile?.min_salary || '',
        job_search_timeline: profile?.job_search_timeline || 'Actively looking',
      })
      setError('')
      setSuccess('')
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
      // Prepare data for API
      const updateData = {
        role: formData.role,
        experience_level: formData.experience_level,
        min_salary: formData.min_salary ? Number(formData.min_salary) : null,
        job_search_timeline: formData.job_search_timeline,
      }

      // Call API
      if (token) {
        await updateUserProfile(updateData, token)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Summary updated successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving summary:', error)
      setError(error.message || 'Failed to save summary')
    } finally {
      setIsSaving(false)
    }
  }

  const experienceLevels = ['', 'Entry', 'Mid-level', 'Senior', 'Lead', 'Executive']
  const timelineOptions = ['', 'Actively looking', 'Open to opportunities', 'Not looking', 'Will relocate']

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Summary">
      <form onSubmit={handleSave} className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="e.g. Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Experience Level</label>
          <select
            name="experience_level"
            value={formData.experience_level}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {experienceLevels.map(level => (
              <option key={level} value={level}>
                {level || 'Select experience level'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Minimum Salary (₹)</label>
          <input
            type="number"
            name="min_salary"
            value={formData.min_salary}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Job Search Timeline</label>
          <select
            name="job_search_timeline"
            value={formData.job_search_timeline}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {timelineOptions.map(timeline => (
              <option key={timeline} value={timeline}>
                {timeline || 'Select timeline'}
              </option>
            ))}
          </select>
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

export default SummaryDrawer
