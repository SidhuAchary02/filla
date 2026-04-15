import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function LinksDrawer({ isOpen, onClose, profile, onSave, token }) {
  const [links, setLinks] = useState({
    linkedin: '',
    github: '',
    portfolio: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Fetch fresh profile data when drawer opens
  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true)
      getUserProfile(token)
        .then(freshProfile => {
          console.log('Fresh profile fetched for links:', freshProfile)
          const currentLinks = freshProfile?.links || {}
          setLinks({
            linkedin: currentLinks.linkedin || '',
            github: currentLinks.github || '',
            portfolio: currentLinks.portfolio || '',
          })
          setError('')
          setSuccess('')
          setValidationErrors({})
        })
        .catch(err => {
          console.error('Error fetching profile for links:', err)
          // Fall back to prop profile if fetch fails
          if (profile?.links) {
            setLinks({
              linkedin: profile.links.linkedin || '',
              github: profile.links.github || '',
              portfolio: profile.links.portfolio || '',
            })
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const validateLink = (url, field) => {
    if (!url) return true // Empty is okay
    return isValidUrl(url)
  }

  const handleLinkChange = (field, value) => {
    setLinks(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field if it becomes valid
    if (value && isValidUrl(value)) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Validate all links
    const errors = {}
    if (links.linkedin && !validateLink(links.linkedin, 'linkedin')) {
      errors.linkedin = 'Invalid LinkedIn URL'
    }
    if (links.github && !validateLink(links.github, 'github')) {
      errors.github = 'Invalid GitHub URL'
    }
    if (links.portfolio && !validateLink(links.portfolio, 'portfolio')) {
      errors.portfolio = 'Invalid Portfolio URL'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setError('Please fix invalid URLs')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      // Only include links that have values
      const linksToSave = {}
      if (links.linkedin) linksToSave.linkedin = links.linkedin
      if (links.github) linksToSave.github = links.github
      if (links.portfolio) linksToSave.portfolio = links.portfolio

      // Structure data to match API schema
      const updateData = {
        links: Object.keys(linksToSave).length > 0 ? linksToSave : null,
      }

      console.log('🔗 Saving links:', updateData)

      // Call API
      if (token) {
        const response = await updateUserProfile(updateData, token)
        console.log('🔗 Links update response:', response)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Links updated successfully!')
      
      // Refetch profile to verify update
      if (token) {
        setTimeout(async () => {
          try {
            const freshProfile = await getUserProfile(token)
            console.log('🔗 Fresh profile after save:', freshProfile)
            const currentLinks = freshProfile?.links || {}
            setLinks({
              linkedin: currentLinks.linkedin || '',
              github: currentLinks.github || '',
              portfolio: currentLinks.portfolio || '',
            })
            
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
      console.error('Error saving links:', error)
      setError(error.message || 'Failed to save links')
    } finally {
      setIsSaving(false)
    }
  }

  const linkTypes = [
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile', icon: '💼' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourprofile', icon: '🐙' },
    { key: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.com', icon: '🌐' },
  ]

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Links">
      <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Loading Message */}
        {isLoading && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
            Loading your links...
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
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
          💡 Add your social and portfolio links. Valid URLs required (e.g., https://...)
        </div>

        {/* Links Form */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4 sticky top-0">
          <h4 className="text-sm font-semibold text-slate-900">Your Links</h4>
          
          {linkTypes.map(link => (
            <div key={link.key} className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </label>
              <input
                type="url"
                placeholder={link.placeholder}
                value={links[link.key]}
                onChange={(e) => handleLinkChange(link.key, e.target.value)}
                disabled={isLoading || isSaving}
                className={`w-full px-3 py-2 rounded-lg border text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 transition ${
                  validationErrors[link.key]
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:border-cyan-500 focus:ring-cyan-500'
                } disabled:bg-slate-200 disabled:text-slate-500`}
              />
              {validationErrors[link.key] && (
                <p className="text-xs text-red-600 mt-1">❌ {validationErrors[link.key]}</p>
              )}
              {links[link.key] && isValidUrl(links[link.key]) && (
                <p className="text-xs text-green-600 mt-1">✅ Valid URL</p>
              )}
            </div>
          ))}
        </div>

        {/* Current Links Display */}
        {(links.linkedin || links.github || links.portfolio) && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Preview</h4>
            {linkTypes.map(link => {
              if (!links[link.key]) return null
              
              return (
                <div key={link.key} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <span>{link.icon}</span>
                        {link.label}
                      </p>
                      {isValidUrl(links[link.key]) ? (
                        <a
                          href={links[link.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline break-all"
                        >
                          {links[link.key]}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-600 break-all">{links[link.key]}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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

export default LinksDrawer
