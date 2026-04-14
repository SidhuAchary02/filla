import SkillsInput from '../../SkillsInput'

export default function SkillsStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Technical Skills</h3>
      <SkillsInput
        value={formData.skills}
        onChange={skills => setFormData(prev => ({ ...prev, skills }))}
        placeholder="Search skills or add your own"
      />
    </div>
  )
}