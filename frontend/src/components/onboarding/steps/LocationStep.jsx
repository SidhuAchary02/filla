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
    </div>
  )
}
