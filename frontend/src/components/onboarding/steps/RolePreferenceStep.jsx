const ROLE_EXAMPLES = [
  'Software Engineer',
  'AI Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Frontend Developer',
  'Backend Developer',
  'Data Engineer',
]

export default function RolePreferenceStep({ formData, setFormData }) {
  const selectRole = role => {
    setFormData(prev => ({ ...prev, role }))
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">What role are you interested in?</h3>
      <input
        type="text"
        placeholder="e.g., Full-Stack Developer, Product Manager"
        value={formData.role}
        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
        className="w-full px-3 py-2 border rounded"
      />
      <div className="flex flex-wrap gap-2">
        {ROLE_EXAMPLES.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => selectRole(role)}
            className={`px-3 py-1.5 text-sm border rounded-full transition-colors cursor-pointer ${
              formData.role === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  )
}
