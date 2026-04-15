import { useEffect, useMemo, useRef, useState } from 'react'
import skillsData from '../data/skills'

const normalizeText = value => value.trim().toLowerCase().replace(/\s+/g, ' ')

const toSkillObject = skill => {
  if (!skill) return null

  if (typeof skill === 'string') {
    const name = skill.trim()
    if (!name) return null
    return {
      name,
      normalized: normalizeText(name),
    }
  }

  const name = String(skill.name || '').trim()
  if (!name) return null

  return {
    name,
    normalized: String(skill.normalized || normalizeText(name)).trim().toLowerCase(),
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

  const addSkill = skill => {
    const skillObject = toSkillObject(skill)
    if (!skillObject || selectedNormalized.has(skillObject.normalized)) return

    updateSkills([...selectedSkills, skillObject])
    setQuery('')
    setOpen(false)
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-12 flex-wrap gap-2 px-3 py-2">
          {selectedSkills.map(skill => (
            <span
              key={skill.normalized}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.normalized)}
                disabled={disabled}
                className="rounded-full text-blue-500 transition hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${skill.name}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            type="text"
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedSkills.length ? '' : placeholder}
            disabled={disabled}
            className="min-w-[180px] flex-1 border-0 p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

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
                <span>
                  Add &quot;{query.trim()}&quot;
                </span>
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
    </div>
  )
}
