export default function JobTimelineStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">When are you ready for a new job?</h3>
      <div className="space-y-2">
        {['ASAP', 'within_3_months', 'within_6_months', 'passive'].map(option => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="job_search_timeline"
              value={option}
              checked={formData.job_search_timeline === option}
              onChange={e => setFormData(prev => ({ ...prev, job_search_timeline: e.target.value }))}
              className="mr-2"
            />
            {option.replace(/_/g, ' ')}
          </label>
        ))}
      </div>
    </div>
  )
}
