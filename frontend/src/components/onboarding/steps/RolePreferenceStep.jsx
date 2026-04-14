export default function RolePreferenceStep({ formData, setFormData }) {
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
    </div>
  )
}
