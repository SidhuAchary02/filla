export default function ProjectsStep({
  formData,
  tempProject,
  setTempProject,
  addProject,
  removeProject,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Projects</h3>
      <div className="border rounded p-3 space-y-2">
        <input type="text" placeholder="Project Name" value={tempProject.name} onChange={e => setTempProject(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <input type="text" placeholder="Your Role" value={tempProject.role} onChange={e => setTempProject(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <textarea placeholder="Description" value={tempProject.description} onChange={e => setTempProject(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
        <input type="text" placeholder="Project Link" value={tempProject.link} onChange={e => setTempProject(prev => ({ ...prev, link: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
        <button onClick={addProject} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Project</button>
      </div>
      <div className="space-y-2">
        {formData.projects.map((proj, idx) => (
          <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
            <div>
              <p className="font-medium">{proj.name}</p>
              <p className="text-xs text-gray-600">{proj.role}</p>
            </div>
            <button onClick={() => removeProject(idx)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
