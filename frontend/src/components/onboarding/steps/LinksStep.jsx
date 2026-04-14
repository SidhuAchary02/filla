export default function LinksStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Social & Portfolio Links</h3>
      <input
        type="text"
        placeholder="LinkedIn URL"
        value={formData.links.linkedin}
        onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, linkedin: e.target.value } }))}
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="text"
        placeholder="GitHub URL"
        value={formData.links.github}
        onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, github: e.target.value } }))}
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="text"
        placeholder="Portfolio URL"
        value={formData.links.portfolio}
        onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, portfolio: e.target.value } }))}
        className="w-full px-3 py-2 border rounded"
      />
    </div>
  )
}
