import { useState } from 'react'

const ALLOWED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_RESUME_EXTENSIONS = new Set(['pdf', 'doc', 'docx'])

const getFileExtension = name => (name?.split('.').pop() || '').toLowerCase()

const isAllowedResumeFile = file => {
  if (!file) return false
  if (ALLOWED_RESUME_MIME_TYPES.has(file.type)) return true
  return ALLOWED_RESUME_EXTENSIONS.has(getFileExtension(file.name))
}

export default function ResumeStep({ formData, setFormData }) {
  const [fileError, setFileError] = useState('')

  const handleFileChange = e => {
    const file = e.target.files?.[0] || null

    if (!file) {
      setFileError('')
      setFormData(prev => ({ ...prev, resume_file: null }))
      return
    }

    if (!isAllowedResumeFile(file)) {
      setFileError('Only PDF, DOC, or DOCX files are allowed')
      e.target.value = ''
      return
    }

    setFileError('')
    setFormData(prev => ({ ...prev, resume_file: file }))
  }

  const clearResume = () => {
    setFileError('')
    setFormData(prev => ({ ...prev, resume_file: null, resume_url: '' }))
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Upload Resume (Optional)</h3>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="w-full px-3 py-2 border rounded"
      />

      {formData.resume_file && <p className="text-sm text-green-700">Selected file: {formData.resume_file.name}</p>}

      {!formData.resume_file && formData.resume_url && (
        <p className="text-sm text-gray-600">Existing resume is already saved. Upload a new file only if you want to replace it.</p>
      )}

      {fileError && <p className="text-sm text-red-600">{fileError}</p>}

      {(formData.resume_file || formData.resume_url) && (
        <button type="button" onClick={clearResume} className="text-sm text-red-700 hover:text-red-800 underline">
          Remove resume
        </button>
      )}

      <p className="text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX</p>
    </div>
  )
}
