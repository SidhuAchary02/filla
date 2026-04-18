import { useEffect, useMemo, useRef, useState } from 'react'
import skillsData from '../data/skills'
import { X, ChevronDown, Pencil, Plus } from 'lucide-react'

const normalizeText = value => value.trim().toLowerCase().replace(/\s+/g, ' ')

const toSkillObject = skill => {
  if (!skill) return null

  if (typeof skill === 'string') {
    const name = skill.trim()
    if (!name) return null
    return {
      name,
      normalized: normalizeText(name),
      experience: null,
    }
  }

  const name = String(skill.name || '').trim()
  if (!name) return null

  return {
    name,
    normalized: String(skill.normalized || normalizeText(name)).trim().toLowerCase(),
    experience: skill.experience || null,
  }
}

const dedupeSkills = skills => {
  const seen = new Set()
  return skills.reduce((accumulator, skill) => {
    if (!skill || seen.has(skill.normalized)) return accumulator
    seen.add(skill.normalized)
    accumulator.push(skill)
    return accumulator
  }, [])
}

export default function SkillsInput({
  value = [],
  onChange,
  placeholder = 'Search or add a skill',
  className = '',
  disabled = false,
}) {
  const wrapperRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)  // {normalized, experience}
  const [editingExperience, setEditingExperience] = useState('')

  const selectedSkills = useMemo(() => dedupeSkills((Array.isArray(value) ? value : []).map(toSkillObject).filter(Boolean)), [value])
  const selectedNormalized = useMemo(() => new Set(selectedSkills.map(skill => skill.normalized)), [selectedSkills])

  const availableSkills = useMemo(() => {
    const source = Array.isArray(skillsData) ? skillsData : []
    return dedupeSkills(source.map(toSkillObject).filter(Boolean)).filter(skill => !selectedNormalized.has(skill.normalized))
  }, [selectedNormalized])

  const filteredSkills = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    if (!normalizedQuery) return availableSkills.slice(0, 10)

    return availableSkills.filter(skill => skill.name.toLowerCase().includes(normalizedQuery)).slice(0, 10)
  }, [availableSkills, query])

  const normalizedQuery = normalizeText(query)
  const canCreateCustomSkill = normalizedQuery.length > 0 && !selectedNormalized.has(normalizedQuery) && filteredSkills.length === 0

  useEffect(() => {
    const handleOutsideClick = event => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const updateSkills = nextSkills => {
    onChange(dedupeSkills(nextSkills))
  }

  const addSkill = (skill) => {
    const skillObject = toSkillObject(skill)
    if (!skillObject || selectedNormalized.has(skillObject.normalized)) return

    // Show experience input modal
    setEditingSkill({ normalized: skillObject.normalized, name: skillObject.name, new: true, skillObj: skillObject })
    setEditingExperience('')
    setQuery('')
    setOpen(false)
  }

  const saveExperience = () => {
    if (!editingSkill) return

    const experience = editingExperience ? parseFloat(editingExperience) : null
    
    if (editingSkill.new) {
      // Adding new skill with experience
      const newSkill = { ...editingSkill.skillObj, experience }
      updateSkills([...selectedSkills, newSkill])
    } else {
      // Editing existing skill experience
      const updated = selectedSkills.map(s => 
        s.normalized === editingSkill.normalized 
          ? { ...s, experience }
          : s
      )
      updateSkills(updated)
    }

    setEditingSkill(null)
    setEditingExperience('')
  }

  const removeSkill = normalized => {
    updateSkills(selectedSkills.filter(skill => skill.normalized !== normalized))
  }

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredSkills[0]) {
        addSkill(filteredSkills[0])
        return
      }
      if (canCreateCustomSkill) {
        addSkill({ name: query.trim(), normalized: normalizedQuery })
      }
    }

    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Skills Display */}
      <div className="space-y-3">
        {selectedSkills.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedSkills.map(skill => (
              <div
                key={skill.normalized}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                  <p className="text-xs text-slate-500">
                    {skill.experience ? `${skill.experience} year${skill.experience !== 1 ? 's' : ''}` : 'No experience set'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSkill({ normalized: skill.normalized, name: skill.name, new: false })
                      setEditingExperience(skill.experience ? String(skill.experience) : '')
                    }}
                    disabled={disabled}
                    className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Edit experience"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.normalized)}
                    disabled={disabled}
                    className="rounded p-1 text-slate-400 transition hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Skill Input */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <input
            type="text"
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full border-0 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Dropdown for skill selection */}
      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-auto p-2">
            {filteredSkills.length > 0 && (
              <div className="space-y-1">
                {filteredSkills.map(skill => (
                  <button
                    key={skill.normalized}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{skill.name}</span>
                    <span className="text-xs text-slate-400">Add</span>
                  </button>
                ))}
              </div>
            )}

            {canCreateCustomSkill && (
              <button
                type="button"
                onClick={() => addSkill({ name: query.trim(), normalized: normalizedQuery })}
                className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-blue-700 transition hover:bg-blue-50"
              >
                <span>Add &quot;{query.trim()}&quot;</span>
                <span className="text-xs text-blue-500">New</span>
              </button>
            )}

            {!filteredSkills.length && !canCreateCustomSkill && (
              <div className="px-3 py-4 text-sm text-slate-500">
                No matching skills found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experience Input Modal */}
      {editingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {editingSkill.new ? 'Add' : 'Edit'} Experience for {editingSkill.name}
            </h3>
            
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Years of Experience
              </label>
              <input
                type="number"
                value={editingExperience}
                onChange={e => setEditingExperience(e.target.value)}
                placeholder="e.g., 3.5"
                min="0"
                step="0.5"
                max="60"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-slate-500">Leave empty if you don't want to specify</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingSkill(null)
                  setEditingExperience('')
                }}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveExperience}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
              >
                {editingSkill.new ? <Plus /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
