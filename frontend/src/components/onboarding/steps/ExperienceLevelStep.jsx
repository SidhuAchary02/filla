export default function ExperienceLevelStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">What's your experience level?</h3>
      <div className="space-y-2">
        {['internship', 'entry', 'junior', 'mid', 'senior', 'expert'].map(level => (
          <label key={level} className="flex items-center">
            <input
              type="radio"
              name="experience_level"
              value={level}
              checked={formData.experience_level === level}
              onChange={e => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
              className="mr-2"
            />
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </label>
        ))}
      </div>
    </div>
  )
}
