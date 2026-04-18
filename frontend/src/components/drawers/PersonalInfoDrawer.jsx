import { useState, useEffect } from 'react'
import Drawer from '../Drawer'
import { updateUserProfile, getUserProfile } from '../../lib/authService'

function PersonalInfoDrawer({ isOpen, onClose, profile, user, onSave, token }) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    preferred_name: '',
    suffix_name: '',
    phone: '',
    birthday: '',
    address: '',
    nationality: '',
    preferred_location: '',
    preferred_job_type: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  })
  
  const [nationalitySearch, setNationalitySearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  
  // Common nationalities list
  const nationalities = [
    'Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 
    'Japanese', 'Chinese', 'Spanish', 'Italian', 'Dutch', 'Swedish', 'Norwegian',
    'Danish', 'Finnish', 'Polish', 'Portuguese', 'Greek', 'Turkish', 'Brazilian',
    'Mexican', 'Russian', 'Ukrainian', 'Romanian', 'Hungarian', 'Czech', 'Austrian',
  ].sort()

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
          // Use freshProfile instead of the prop profile
          populateForm(freshProfile)
        })
        .catch(err => {
          console.error('Error fetching profile:', err)
          // Fall back to prop profile if fetch fails
          if (profile) {
            populateForm(profile)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, token])

  const populateForm = (profileData) => {
    if (!profileData && !user) return
    
    // Extract name parts from user or profile
    let firstName = ''
    let middleName = ''
    let lastName = ''
    
    // Try to get from profile first, then user
    const fullName = profileData?.full_name || profileData?.first_name || user?.name || user?.email?.split('@')[0] || ''
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/)
      firstName = nameParts[0] || ''
      if (nameParts.length === 2) {
        lastName = nameParts[1] || ''
      } else if (nameParts.length > 2) {
        middleName = nameParts.slice(1, -1).join(' ') || ''
        lastName = nameParts[nameParts.length - 1] || ''
      }
    }

    const formDataToSet = {
      first_name: firstName || profileData?.first_name || '',
      middle_name: middleName || profileData?.middle_name || '',
      last_name: lastName || profileData?.last_name || '',
      preferred_name: profileData?.preferred_name || '',
      suffix_name: profileData?.suffix_name || '',
      phone: profileData?.phone || '',
      birthday: profileData?.birthday || '',
      address: profileData?.address || '',
      nationality: profileData?.nationality || '',
      preferred_location: profileData?.preferred_location || '',
      preferred_job_type: profileData?.preferred_job_type || '',
      city: profileData?.location?.city || profileData?.city || '',
      state: profileData?.location?.state || profileData?.state || '',
      country: profileData?.location?.country || profileData?.country || '',
      pincode: profileData?.location?.pincode || profileData?.pincode || '',
    }
    
    console.log('Populating form with:', formDataToSet)
    setFormData(formDataToSet)
    setNationalitySearch(formDataToSet.nationality || '')
    setLocationSearch(formDataToSet.preferred_location || '')
    setError('')
    setSuccess('')
  }

  // Sync profile data whenever it changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      // Debug: Log what's available
      console.log('User data:', user)
      console.log('Profile data:', profile)
      populateForm(profile)
    }
  }, [isOpen, profile, user])

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
      // Validate required fields
      if (!formData.nationality?.trim()) {
        setError('Nationality is required')
        setIsSaving(false)
        return
      }
      if (!formData.preferred_location?.trim()) {
        setError('Preferred location is required')
        setIsSaving(false)
        return
      }
      if (!formData.preferred_job_type?.trim()) {
        setError('Preferred job type is required')
        setIsSaving(false)
        return
      }

      // Structure data to match API schema
      const updateData = {
        first_name: formData.first_name || undefined,
        middle_name: formData.middle_name || undefined,
        last_name: formData.last_name || undefined,
        preferred_name: formData.preferred_name || undefined,
        suffix_name: formData.suffix_name || undefined,
        phone: formData.phone || undefined,
        birthday: formData.birthday || undefined,
        address: formData.address || undefined,
        nationality: formData.nationality || undefined,
        preferred_location: formData.preferred_location || undefined,
        preferred_job_type: formData.preferred_job_type || undefined,
        location: {
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          pincode: formData.pincode || undefined,
        },
      }

      // Call API
      if (token) {
        await updateUserProfile(updateData, token)
      }

      // Call parent onSave callback if provided
      if (onSave) {
        await onSave(updateData)
      }

      setSuccess('Personal info updated successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving personal info:', error)
      setError(error.message || 'Failed to save personal info')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Personal Info">
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

        {/* Info Message */}
        {!formData.first_name && !formData.phone && !formData.birthday && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            💡 You can fill in your personal information here. Nationality, Preferred Location, and Job Type are required.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Middle name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={isLoading || isSaving}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Preferred Name</label>
            <input
              type="text"
              name="preferred_name"
              value={formData.preferred_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Preferred name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Suffix</label>
            <input
              type="text"
              name="suffix_name"
              value={formData.suffix_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="e.g. Jr., Sr."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Birthday</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Street address"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="State"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Postal Code</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Postal code"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-700">Nationality <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={nationalitySearch || formData.nationality}
            onChange={(e) => {
              setNationalitySearch(e.target.value)
              setFormData(prev => ({ ...prev, nationality: e.target.value }))
              setShowNationalityDropdown(true)
            }}
            onFocus={() => setShowNationalityDropdown(true)}
            onBlur={() => setTimeout(() => setShowNationalityDropdown(false), 200)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Search and select nationality"
          />
          {showNationalityDropdown && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-300 bg-white shadow-lg max-h-48 overflow-y-auto">
              {nationalities
                .filter(n => n.toLowerCase().includes(nationalitySearch.toLowerCase()))
                .map((nation) => (
                  <div
                    key={nation}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, nationality: nation }))
                      setNationalitySearch(nation)
                      setShowNationalityDropdown(false)
                    }}
                    className="px-3 py-2 hover:bg-cyan-50 cursor-pointer text-sm"
                  >
                    {nation}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-slate-700">Preferred Location <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={locationSearch || formData.preferred_location}
            onChange={(e) => {
              setLocationSearch(e.target.value)
              setFormData(prev => ({ ...prev, preferred_location: e.target.value }))
              setShowLocationDropdown(true)
            }}
            onFocus={() => setShowLocationDropdown(true)}
            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Search and select preferred location"
          />
          {showLocationDropdown && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-300 bg-white shadow-lg max-h-48 overflow-y-auto">
              {['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore']
                .filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
                .map((loc) => (
                  <div
                    key={loc}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, preferred_location: loc }))
                      setLocationSearch(loc)
                      setShowLocationDropdown(false)
                    }}
                    className="px-3 py-2 hover:bg-cyan-50 cursor-pointer text-sm"
                  >
                    {loc}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Preferred Job Type <span className="text-red-500">*</span></label>
          <select
            name="preferred_job_type"
            value={formData.preferred_job_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">Select job type</option>
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
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

export default PersonalInfoDrawer
