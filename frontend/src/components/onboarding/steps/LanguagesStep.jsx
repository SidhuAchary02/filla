export default function LanguagesStep({
  formData,
  tempLanguage,
  setTempLanguage,
  addLanguage,
  removeLanguage,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Languages</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a language (e.g., English, Spanish)"
          value={tempLanguage}
          onChange={e => setTempLanguage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addLanguage()}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={addLanguage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {formData.languages.map((lang, idx) => (
          <div key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            {lang}
            <button onClick={() => removeLanguage(idx)} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
