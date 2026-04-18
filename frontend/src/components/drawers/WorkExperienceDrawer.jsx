import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'
import { Pencil, X } from 'lucide-react'

function WorkExperienceDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [workExperience, setWorkExperience] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tempWorkExp, setTempWorkExp] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  })

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      getUserProfile(token)
        .then(freshProfile => {
          console.log('Fresh profile fetched for work experience:', freshProfile)
          const currentWorkExp = Array.isArray(freshProfile?.work_experience) ? freshProfile.work_experience : []
          setWorkExperience(currentWorkExp)
          setError('')
          setSuccess('')
          setTempWorkExp({
            title: '',
            company: '',
            location: '',
            start_date: '',
            end_date: '',
            is_current: false,
            description: '',
          })
          setEditingIndex(null)
        })
        .catch(err => {
          console.error('Error fetching profile for work experience:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.work_experience) {
            setWorkExperience(Array.isArray(profile.work_experience) ? profile.work_experience : [])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const addWorkExp = () => {
    if (!tempWorkExp.title || !tempWorkExp.company) {
      setError('Please fill in job title and company fields')
      return
    }

    let newWorkExp = []
    if (editingIndex !== null) {
      newWorkExp = workExperience.map((exp, index) =>
        index === editingIndex ? { ...tempWorkExp } : exp
      )
      setEditingIndex(null)
    } else {
      newWorkExp = [...workExperience, { ...tempWorkExp }]
    }

    setWorkExperience(newWorkExp)
    setTempWorkExp({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    })
    setError('')
  }

  const editWorkExp = (index) => {
    const exp = workExperience[index]
    if (!exp) return

    setTempWorkExp({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      start_date: exp.start_date || '',
      end_date: exp.end_date || '',
      is_current: Boolean(exp.is_current),
      description: exp.description || '',
    })
    setEditingIndex(index)
    setError('')
    setSuccess('')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setTempWorkExp({
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    })
  }

  const removeWorkExp = (index) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Structure data to match API schema
      const updateData = {
        work_experience: workExperience || [],
      }

      console.log('💼 Saving work experience:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('💼 Work experience update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Work experience updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('💼 Fresh profile after save:', freshProfile)
            const currentWorkExp = Array.isArray(freshProfile?.work_experience) ? freshProfile.work_experience : []
            setWorkExperience(currentWorkExp)
            
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
      console.error('Error saving work experience:', error)
      setError(error.message || 'Failed to save work experience')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Work Experience">
      <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your work experience...
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
        {workExperience.length === 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            💡 Add your work experience. Fill in job title and company to add an entry.
          </div>
        )}

        {/* Add Work Experience Form */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 sticky top-0">
          <h4 className="text-sm font-semibold text-slate-900">
            {editingIndex !== null ? 'Edit Work Experience' : 'Add Work Experience'}
          </h4>
          
          <input
            type="text"
            placeholder="Job Title"
            value={tempWorkExp.title}
            onChange={(e) => setTempWorkExp(prev => ({ ...prev, title: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <input
            type="text"
            placeholder="Company"
            value={tempWorkExp.company}
            onChange={(e) => setTempWorkExp(prev => ({ ...prev, company: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <input
            type="text"
            placeholder="Location"
            value={tempWorkExp.location}
            onChange={(e) => setTempWorkExp(prev => ({ ...prev, location: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              placeholder="Start Date"
              value={tempWorkExp.start_date}
              onChange={(e) => setTempWorkExp(prev => ({ ...prev, start_date: e.target.value }))}
              disabled={isLoading || isSaving}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
            />
            <input
              type="date"
              placeholder="End Date"
              value={tempWorkExp.end_date}
              onChange={(e) => setTempWorkExp(prev => ({ ...prev, end_date: e.target.value }))}
              disabled={isLoading || isSaving || tempWorkExp.is_current}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={tempWorkExp.is_current}
              onChange={(e) => setTempWorkExp(prev => ({
                ...prev,
                is_current: e.target.checked,
                end_date: e.target.checked ? '' : prev.end_date
              }))}
              disabled={isLoading || isSaving}
              className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-slate-700">Currently working here</span>
          </label>

          <textarea
            placeholder="Description (Optional)"
            value={tempWorkExp.description}
            onChange={(e) => setTempWorkExp(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading || isSaving}
            rows="2"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={addWorkExp}
              disabled={isLoading || isSaving}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {editingIndex !== null ? 'Update Experience' : 'Add Experience'}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isLoading || isSaving}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Current Work Experience Display */}
        {workExperience.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Your Work Experience ({workExperience.length})</h4>
            {workExperience.map((exp, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{exp.title}</p>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                    {exp.location && (
                      <p className="text-xs text-slate-500">{exp.location}</p>
                    )}
                    {(exp.start_date || exp.end_date) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {exp.start_date ? new Date(exp.start_date).getFullYear() : 'N/A'} 
                        {' - '}
                        {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).getFullYear() : 'N/A'}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{exp.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => editWorkExp(index)}
                    disabled={isSaving}
                    className="mr-2 border border-white hover:border-blue-100 rounded-md px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Edit work experience entry ${index + 1}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWorkExp(index)}
                    disabled={isSaving}
                    className="mr-2 border border-white hover:border-red-100 rounded-md px-2 py-1 font-bold hover:text-red-800 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Remove work experience entry ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-200">
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

export default WorkExperienceDrawer
