export default function SalaryExpectationStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Minimum Salary Expectation</h3>
      <input
        type="number"
        placeholder="Enter minimum salary"
        value={formData.min_salary}
        onChange={e => setFormData(prev => ({ ...prev, min_salary: e.target.value }))}
        className="w-full px-3 py-2 border rounded"
      />
      <p className="text-sm text-gray-500">Leave blank if you prefer not to specify</p>
    </div>
  )
}
