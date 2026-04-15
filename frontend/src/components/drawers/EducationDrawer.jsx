import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function EducationDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [education, setEducation] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tempEducation, setTempEducation] = useState({
    school: '',
    degree: '',
    major: '',
    start_date: '',
    end_date: '',
  })

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      getUserProfile(token)
        .then(freshProfile => {
          console.log('Fresh profile fetched for education:', freshProfile)
          const currentEducation = Array.isArray(freshProfile?.education) ? freshProfile.education : []
          setEducation(currentEducation)
          setError('')
          setSuccess('')
          setTempEducation({
            school: '',
            degree: '',
            major: '',
            start_date: '',
            end_date: '',
          })
        })
        .catch(err => {
          console.error('Error fetching profile for education:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.education) {
            setEducation(Array.isArray(profile.education) ? profile.education : [])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const addEducation = () => {
    if (!tempEducation.school || !tempEducation.degree || !tempEducation.major) {
      setError('Please fill in school, degree, and major fields')
      return
    }

    const newEducation = [...education, { ...tempEducation }]
    setEducation(newEducation)
    setTempEducation({
      school: '',
      degree: '',
      major: '',
      start_date: '',
      end_date: '',
    })
    setError('')
  }

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Structure data to match API schema
      const updateData = {
        education: education || [],
      }

      console.log('🎓 Saving education:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('🎓 Education update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Education updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('🎓 Fresh profile after save:', freshProfile)
            const currentEducation = Array.isArray(freshProfile?.education) ? freshProfile.education : []
            setEducation(currentEducation)
            
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
      console.error('Error saving education:', error)
      setError(error.message || 'Failed to save education')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Education">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your education...
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
        {education.length === 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            💡 Add your education history. Fill in all required fields to add an entry.
          </div>
        )}

        {/* Add Education Form */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Add Education Entry</h4>
          
          <input
            type="text"
            placeholder="School/University"
            value={tempEducation.school}
            onChange={(e) => setTempEducation(prev => ({ ...prev, school: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <input
            type="text"
            placeholder="Degree (e.g., Bachelor's, Master's)"
            value={tempEducation.degree}
            onChange={(e) => setTempEducation(prev => ({ ...prev, degree: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <input
            type="text"
            placeholder="Major/Field of Study"
            value={tempEducation.major}
            onChange={(e) => setTempEducation(prev => ({ ...prev, major: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              placeholder="Start Date"
              value={tempEducation.start_date}
              onChange={(e) => setTempEducation(prev => ({ ...prev, start_date: e.target.value }))}
              disabled={isLoading || isSaving}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
            />
            <input
              type="date"
              placeholder="End Date"
              value={tempEducation.end_date}
              onChange={(e) => setTempEducation(prev => ({ ...prev, end_date: e.target.value }))}
              disabled={isLoading || isSaving}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={addEducation}
            disabled={isLoading || isSaving}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Education
          </button>
        </div>

        {/* Current Education Display */}
        {education.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Your Education ({education.length})</h4>
            {education.map((edu, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{edu.degree} in {edu.major}</p>
                    <p className="text-sm text-slate-600">{edu.school}</p>
                    {(edu.start_date || edu.end_date) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {edu.start_date ? new Date(edu.start_date).getFullYear() : 'N/A'} 
                        {' - '}
                        {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    disabled={isSaving}
                    className="text-red-600 hover:text-red-800 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove education entry ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
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

export default EducationDrawer
