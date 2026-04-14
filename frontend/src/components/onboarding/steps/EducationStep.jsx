export default function EducationStep({
  formData,
  tempEducation,
  setTempEducation,
  addEducation,
  removeEducation,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Education</h3>
      <div className="border rounded p-3 space-y-2">
        <input type="text" placeholder="School/University" value={tempEducation.school} onChange={e => setTempEducation(prev => ({ ...prev, school: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="text" placeholder="Degree" value={tempEducation.degree} onChange={e => setTempEducation(prev => ({ ...prev, degree: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="text" placeholder="Major/Field" value={tempEducation.major} onChange={e => setTempEducation(prev => ({ ...prev, major: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="date" value={tempEducation.start_date} onChange={e => setTempEducation(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="date" value={tempEducation.end_date} onChange={e => setTempEducation(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <button onClick={addEducation} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Education</button>
      </div>
      <div className="space-y-2">
        {formData.education.map((edu, idx) => (
          <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
            <div>
              <p className="font-medium">{edu.degree} in {edu.major}</p>
              <p className="text-xs text-gray-600">{edu.school}</p>
            </div>
            <button onClick={() => removeEducation(idx)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
