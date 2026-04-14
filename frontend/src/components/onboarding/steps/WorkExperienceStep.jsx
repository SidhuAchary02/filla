export default function WorkExperienceStep({
  formData,
  tempWorkExp,
  setTempWorkExp,
  addWorkExp,
  removeWorkExp,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Work Experience</h3>
      <div className="border rounded p-3 space-y-2">
        <input type="text" placeholder="Job Title" value={tempWorkExp.title} onChange={e => setTempWorkExp(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="text" placeholder="Company" value={tempWorkExp.company} onChange={e => setTempWorkExp(prev => ({ ...prev, company: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="text" placeholder="Location" value={tempWorkExp.location} onChange={e => setTempWorkExp(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="date" value={tempWorkExp.start_date} onChange={e => setTempWorkExp(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" placeholder="Start Date" />
        <input type="date" value={tempWorkExp.end_date} onChange={e => setTempWorkExp(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" placeholder="End Date" disabled={tempWorkExp.is_current} />
        <label className="flex items-center text-sm">
          <input type="checkbox" checked={tempWorkExp.is_current} onChange={e => setTempWorkExp(prev => ({ ...prev, is_current: e.target.checked, end_date: e.target.checked ? '' : prev.end_date }))} className="mr-2" />
          Currently working here
        </label>
        <textarea placeholder="Description" value={tempWorkExp.description} onChange={e => setTempWorkExp(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
        <button onClick={addWorkExp} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Experience</button>
      </div>
      <div className="space-y-2">
        {formData.work_experience.map((exp, idx) => (
          <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
            <div>
              <p className="font-medium">{exp.title} at {exp.company}</p>
              <p className="text-xs text-gray-600">{exp.start_date} {!exp.is_current && `to ${exp.end_date}`}</p>
            </div>
            <button onClick={() => removeWorkExp(idx)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
