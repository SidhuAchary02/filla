import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import SkillsInput from '../SkillsInput'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function SkillsDrawer({ isOpen, onClose, profile, user, onSave, token }) {
  const [formData, setFormData] = useState({
    skills: [],
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
      skills: Array.isArray(profileData?.skills) ? profileData.skills : [],
    }

    console.log('Populating form with:', formDataToSet)
    setFormData(formDataToSet)
    setError('')
    setSuccess('')
  }

  const handleSkillsChange = (skills) => {
    setFormData(prev => ({
      ...prev,
      skills: skills || [],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updateData = {
        skills: formData.skills || [],
      }

      console.log('Saving skills:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('API Response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Skills updated successfully!')

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
      console.error('Error saving skills:', error)
      setError(error.message || 'Failed to save skills')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Skills">
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

        {/* Current Profile Display */}
        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-3">Your Profile</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {user?.profile?.first_name} {user?.profile?.last_name}
            </p>
            <p className="text-xs text-slate-600">{user?.email}</p>
          </div>
        </div>

        {/* Skills Input Section */}
        <div className="space-y-2">
          <label htmlFor="skills" className="block text-sm font-medium text-slate-700">
            Technical Skills
          </label>
          <SkillsInput
            value={formData.skills}
            onChange={handleSkillsChange}
            placeholder="Search skills or add your own"
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Search from our curated list or add custom skills
          </p>
        </div>

        {/* Current Skills Display */}
        {formData.skills && formData.skills.length > 0 && (
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-xs uppercase tracking-wide text-blue-600 font-medium mb-2">
              {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill?.name || skill
                return (
                  <span
                    key={`${skillName}-${index}`}
                    className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
                  >
                    {skillName}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  )
}

export default SkillsDrawer
