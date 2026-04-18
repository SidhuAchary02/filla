import { useState } from 'react'

export default function LocationStep({
  formData,
  setFormData,
  countries,
  states,
  cities,
  pincodes,
  loadingCountries,
  loadingStates,
  loadingCities,
  loadingPincodes,
}) {
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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Where are you located?</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select
          value={formData.location.country}
          onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))}
          className="w-full px-3 py-2 border rounded"
          disabled={loadingCountries}
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country.code} value={country.name}>{country.name}</option>
          ))}
        </select>
        {loadingCountries && <p className="text-xs text-gray-500 mt-1">Loading countries...</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
        <select
          value={formData.location.state}
          onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
          className="w-full px-3 py-2 border rounded"
          disabled={!formData.location.country || loadingStates}
        >
          <option value="">Select State/Province</option>
          {states.map(state => (
            <option key={state.code} value={state.code}>{state.name}</option>
          ))}
        </select>
        {loadingStates && <p className="text-xs text-gray-500 mt-1">Loading states...</p>}
        {!formData.location.country && <p className="text-xs text-gray-500 mt-1">Select a country first</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <select
          value={formData.location.city}
          onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
          className="w-full px-3 py-2 border rounded"
          disabled={!formData.location.state || loadingCities}
        >
          <option value="">Select City</option>
          {cities.map(city => (
            <option key={city.geonameId} value={city.name}>{city.name}</option>
          ))}
        </select>
        {loadingCities && <p className="text-xs text-gray-500 mt-1">Loading cities...</p>}
        {!formData.location.state && <p className="text-xs text-gray-500 mt-1">Select a state first</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pin/Postal Code (Optional)</label>
        <select
          value={formData.location.pincode}
          onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, pincode: e.target.value } }))}
          className="w-full px-3 py-2 border rounded"
          disabled={!formData.location.city || loadingPincodes}
        >
          <option value="">Select or enter manually</option>
          {pincodes.map(pc => (
            <option key={pc.code} value={pc.code}>{pc.code} - {pc.name}</option>
          ))}
        </select>
        {loadingPincodes && <p className="text-xs text-gray-500 mt-1">Loading postal codes...</p>}
        <input
          type="text"
          placeholder="Or enter manually"
          value={formData.location.pincode}
          onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, pincode: e.target.value } }))}
          className="w-full px-3 py-2 border rounded mt-2"
        />
      </div>

      <hr className="my-4" />

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={nationalitySearch || formData.nationality || ''}
          onChange={(e) => {
            setNationalitySearch(e.target.value)
            setFormData(prev => ({ ...prev, nationality: e.target.value }))
            setShowNationalityDropdown(true)
          }}
          onFocus={() => setShowNationalityDropdown(true)}
          onBlur={() => setTimeout(() => setShowNationalityDropdown(false), 200)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Search and select nationality"
        />
        {showNationalityDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg max-h-48 overflow-y-auto">
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
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {nation}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={locationSearch || formData.preferred_location || ''}
          onChange={(e) => {
            setLocationSearch(e.target.value)
            setFormData(prev => ({ ...prev, preferred_location: e.target.value }))
            setShowLocationDropdown(true)
          }}
          onFocus={() => setShowLocationDropdown(true)}
          onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Search and select preferred location"
        />
        {showLocationDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg max-h-48 overflow-y-auto">
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
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {loc}
                </div>
              ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Job Type <span className="text-red-500">*</span></label>
        <select
          value={formData.preferred_job_type || ''}
          onChange={e => setFormData(prev => ({ ...prev, preferred_job_type: e.target.value }))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Select job type</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
    </div>
  )
}
