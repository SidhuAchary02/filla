import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import SkillsInput from '../SkillsInput'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function SkillsDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [skills, setSkills] = useState([])
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
          console.log('Fresh profile fetched for skills:', freshProfile)
          const currentSkills = Array.isArray(freshProfile?.skills) ? freshProfile.skills : []
          setSkills(currentSkills)
          setError('')
          setSuccess('')
        })
        .catch(err => {
          console.error('Error fetching profile for skills:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.skills) {
            setSkills(Array.isArray(profile.skills) ? profile.skills : [])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const handleSkillsChange = (newSkills) => {
    setSkills(newSkills)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Transform skills from objects to just names
      const skillNames = skills.map(skill => 
        typeof skill === 'string' ? skill : skill.name
      )

      // Structure data to match API schema
      const updateData = {
        skills: skillNames || [],
      }

      console.log('📌 Saving skills:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('📌 Skills update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Skills updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('📌 Fresh profile after save:', freshProfile)
            const currentSkills = Array.isArray(freshProfile?.skills) ? freshProfile.skills : []
            setSkills(currentSkills)
            
            setTimeout(() => {
              onClose()
            }, 500)
          } catch (err) {
            console.error('Error refetching profile:', err)
            setTimeout(() => {
              onClose()
            }, 1500)
          }
        }, 500)
      } else {
        setTimeout(() => {
          onClose()
        }, 1500)
      }
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
            Loading your skills...
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

        {/* Info Message */}
        {skills.length === 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            💡 Start adding skills to your profile. Search from our database or add custom skills.
          </div>
        )}

        {/* Skills Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Your Skills ({skills.length})
          </label>
          <SkillsInput
            value={skills}
            onChange={handleSkillsChange}
            placeholder="Search or add a skill"
            disabled={isLoading || isSaving}
          />
          <p className="mt-2 text-xs text-slate-500">
            Type to search skills or press Enter to add a custom skill
          </p>
        </div>

        {/* Current Skills Display */}
        {skills.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Current Skills:</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill.name
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
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  )
}

export default SkillsDrawer
