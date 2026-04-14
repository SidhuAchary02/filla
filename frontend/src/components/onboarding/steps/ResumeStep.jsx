export default function ResumeStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Upload Resume (Optional)</h3>
      <input
        type="text"
        placeholder="Resume URL"
        value={formData.resume_url}
        onChange={e => setFormData(prev => ({ ...prev, resume_url: e.target.value }))}
        className="w-full px-3 py-2 border rounded"
      />
      <p className="text-sm text-gray-500">You can skip this step or provide a URL to your resume</p>
    </div>
  )
}
