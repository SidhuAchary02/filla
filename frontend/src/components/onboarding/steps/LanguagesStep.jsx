import LanguagesInput from '../../LanguagesInput'

export default function LanguagesStep({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Languages</h3>
      <LanguagesInput
        value={formData.languages}
        onChange={languages => setFormData(prev => ({ ...prev, languages }))}
        placeholder="Search languages or add your own"
      />
    </div>
  )
}