import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'
import { Lightbulb, Pencil, X } from 'lucide-react'

function ProjectsDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [projects, setProjects] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tempProject, setTempProject] = useState({
    name: '',
    role: '',
    description: '',
    link: '',
  })

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      getUserProfile(token)
        .then(freshProfile => {
          console.log('Fresh profile fetched for projects:', freshProfile)
          const currentProjects = Array.isArray(freshProfile?.projects) ? freshProfile.projects : []
          setProjects(currentProjects)
          setError('')
          setSuccess('')
          setTempProject({
            name: '',
            role: '',
            description: '',
            link: '',
          })
          setEditingIndex(null)
        })
        .catch(err => {
          console.error('Error fetching profile for projects:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.projects) {
            setProjects(Array.isArray(profile.projects) ? profile.projects : [])
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const addProject = () => {
    if (!tempProject.name) {
      setError('Please fill in project name field')
      return
    }

    let newProject = []
    if (editingIndex !== null) {
      newProject = projects.map((proj, index) =>
        index === editingIndex ? { ...tempProject } : proj
      )
      setEditingIndex(null)
    } else {
      newProject = [...projects, { ...tempProject }]
    }

    setProjects(newProject)
    setTempProject({
      name: '',
      role: '',
      description: '',
      link: '',
    })
    setError('')
  }

  const editProject = (index) => {
    const proj = projects[index]
    if (!proj) return

    setTempProject({
      name: proj.name || '',
      role: proj.role || '',
      description: proj.description || '',
      link: proj.link || '',
    })
    setEditingIndex(index)
    setError('')
    setSuccess('')
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setTempProject({
      name: '',
      role: '',
      description: '',
      link: '',
    })
  }

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Structure data to match API schema
      const updateData = {
        projects: projects || [],
      }

      console.log('🎯 Saving projects:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('🎯 Projects update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Projects updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('🎯 Fresh profile after save:', freshProfile)
            const currentProjects = Array.isArray(freshProfile?.projects) ? freshProfile.projects : []
            setProjects(currentProjects)
            
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
      console.error('Error saving projects:', error)
      setError(error.message || 'Failed to save projects')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Projects">
      <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your projects...
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
        {projects.length === 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            <Lightbulb size={16}/> Add your projects. Fill in project name to add an entry.
          </div>
        )}

        {/* Add Project Form */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 sticky top-0">
          <h4 className="text-sm font-semibold text-slate-900">
            {editingIndex !== null ? 'Edit Project' : 'Add Project'}
          </h4>
          
          <input
            type="text"
            placeholder="Project Name"
            value={tempProject.name}
            onChange={(e) => setTempProject(prev => ({ ...prev, name: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <input
            type="text"
            placeholder="Your Role"
            value={tempProject.role}
            onChange={(e) => setTempProject(prev => ({ ...prev, role: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <textarea
            placeholder="Description (Optional)"
            value={tempProject.description}
            onChange={(e) => setTempProject(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading || isSaving}
            rows="2"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500 resize-none"
          />

          <input
            type="url"
            placeholder="Project Link (Optional)"
            value={tempProject.link}
            onChange={(e) => setTempProject(prev => ({ ...prev, link: e.target.value }))}
            disabled={isLoading || isSaving}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={addProject}
              disabled={isLoading || isSaving}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {editingIndex !== null ? 'Update Project' : 'Add Project'}
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

        {/* Current Projects Display */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900">Your Projects ({projects.length})</h4>
            {projects.map((proj, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{proj.name}</p>
                    {proj.role && (
                      <p className="text-sm text-slate-600">{proj.role}</p>
                    )}
                    {proj.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{proj.description}</p>
                    )}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-600 hover:text-cyan-700 mt-2 break-all"
                      >
                        {proj.link}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => editProject(index)}
                    disabled={isSaving}
                    className="mr-2 border border-white hover:border-blue-100 rounded-md px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Edit project entry ${index + 1}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProject(index)}
                    disabled={isSaving}
                    className="mr-2 border border-white hover:border-red-100 rounded-md px-2 py-1 font-bold hover:text-red-800 text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Remove project entry ${index + 1}`}
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

export default ProjectsDrawer
