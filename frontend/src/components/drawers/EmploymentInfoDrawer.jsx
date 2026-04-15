import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile } from '../../lib/authService'

function EmploymentInfoDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [formData, setFormData] = useState({
    ethnicity: '',
    work_authorized_us: '',
    work_authorized_canada: '',
    work_authorized_uk: '',
    sponsorship_required: '',
    disability: '',
    lgbtq: '',
    gender: '',
    veteran: '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sync profile data whenever it changes or drawer opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        ethnicity: profile?.ethnicity || '',
        work_authorized_us: profile?.work_authorized_us || '',
        work_authorized_canada: profile?.work_authorized_canada || '',
        work_authorized_uk: profile?.work_authorized_uk || '',
        sponsorship_required: profile?.sponsorship_required || '',
        disability: profile?.disability || '',
        lgbtq: profile?.lgbtq || '',
        gender: profile?.gender || '',
        veteran: profile?.veteran || '',
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
        ethnicity: formData.ethnicity,
        work_authorized_us: formData.work_authorized_us,
        work_authorized_canada: formData.work_authorized_canada,
        work_authorized_uk: formData.work_authorized_uk,
        sponsorship_required: formData.sponsorship_required,
        disability: formData.disability,
        lgbtq: formData.lgbtq,
        gender: formData.gender,
        veteran: formData.veteran,
      }

      // Call API
      if (token) {
        await updateUserProfile(updateData, token)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Employment info updated successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving employment info:', error)
      setError(error.message || 'Failed to save employment info')
    } finally {
      setIsSaving(false)
    }
  }

  const selectOptions = ['', 'Yes', 'No', 'Prefer not to answer']

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Employment Information">
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
          <label className="block text-sm font-medium text-slate-700">Ethnicity</label>
          <input
            type="text"
            name="ethnicity"
            value={formData.ethnicity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Your ethnicity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Are you authorized to work in the US?</label>
          <select
            name="work_authorized_us"
            value={formData.work_authorized_us}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Are you authorized to work in Canada?</label>
          <select
            name="work_authorized_canada"
            value={formData.work_authorized_canada}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Are you authorized to work in the United Kingdom?</label>
          <select
            name="work_authorized_uk"
            value={formData.work_authorized_uk}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Will you now or in the future require sponsorship for employment visa status?</label>
          <select
            name="sponsorship_required"
            value={formData.sponsorship_required}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Do you have a disability?</label>
          <select
            name="disability"
            value={formData.disability}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Do you identify as LGBTQ+?</label>
          <select
            name="lgbtq"
            value={formData.lgbtq}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">What is your gender?</label>
          <input
            type="text"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Your gender"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Are you a veteran?</label>
          <select
            name="veteran"
            value={formData.veteran}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {selectOptions.map(option => (
              <option key={option} value={option}>
                {option || 'Select...'}
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

export default EmploymentInfoDrawer
