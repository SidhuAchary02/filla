export default function SkillsStep({
  formData,
  tempSkill,
  setTempSkill,
  addSkill,
  removeSkill,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Technical Skills</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a skill (e.g., Python, React)"
          value={tempSkill}
          onChange={e => setTempSkill(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSkill()}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {formData.skills.map((skill, idx) => (
          <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            {skill}
            <button onClick={() => removeSkill(idx)} className="text-blue-600 hover:text-blue-800">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
