import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import LanguagesInput from '../LanguagesInput'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function LanguagesDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [languages, setLanguages] = useState([])
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
          console.log('Fresh profile fetched for languages:', freshProfile)
          const currentLanguages = Array.isArray(freshProfile?.languages) ? freshProfile.languages : []
          setLanguages(currentLanguages)
          setError('')
          setSuccess('')
        })
        .catch(err => {
          console.error('Error fetching profile for languages:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.languages) {
            setLanguages(Array.isArray(profile.languages) ? profile.languages : [])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const handleLanguagesChange = (newLanguages) => {
    setLanguages(newLanguages)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Transform languages from objects to just names
      const languageNames = languages.map(language => 
        typeof language === 'string' ? language : language.name
      )

      // Structure data to match API schema
      const updateData = {
        languages: languageNames || [],
      }

      console.log('🌍 Saving languages:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('🌍 Languages update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Languages updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('🌍 Fresh profile after save:', freshProfile)
            const currentLanguages = Array.isArray(freshProfile?.languages) ? freshProfile.languages : []
            setLanguages(currentLanguages)
            
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
      console.error('Error saving languages:', error)
      setError(error.message || 'Failed to save languages')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Languages">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your languages...
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
        {languages.length === 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            💡 Add languages you speak. Search from our database or add custom languages.
          </div>
        )}

        {/* Languages Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Your Languages ({languages.length})
          </label>
          <LanguagesInput
            value={languages}
            onChange={handleLanguagesChange}
            placeholder="Search or add a language"
            disabled={isLoading || isSaving}
          />
          <p className="mt-2 text-xs text-slate-500">
            Type to search languages or press Enter to add a custom language
          </p>
        </div>

        {/* Current Languages Display */}
        {languages.length > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">Current Languages:</p>
            <div className="flex flex-wrap gap-2">
              {languages.map((language, index) => {
                const languageName = typeof language === 'string' ? language : language.name
                return (
                  <span
                    key={`${languageName}-${index}`}
                    className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {languageName}
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
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  )
}

export default LanguagesDrawer
