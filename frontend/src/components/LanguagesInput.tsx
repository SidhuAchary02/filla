import { useEffect, useMemo, useRef, useState } from 'react'
import fallbackLanguages from '../data/languages.js'

export type LanguageOption = {
  name: string
  normalized: string
}

type LanguagesInputProps = {
  value: LanguageOption[]
  onChange: (languages: LanguageOption[]) => void
  placeholder?: string
  className?: string
  apiBaseUrl?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const normalizeLanguage = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_')

const toLanguageOption = (language: unknown): LanguageOption | null => {
  if (!language) return null

  if (typeof language === 'string') {
    const name = language.trim()
    if (!name) return null
    return {
      name,
      normalized: normalizeLanguage(name),
    }
  }

  if (typeof language === 'object' && language !== null) {
    const candidate = language as Partial<LanguageOption>
    const name = String(candidate.name || '').trim()
    if (!name) return null

    return {
      name,
      normalized: String(candidate.normalized || normalizeLanguage(name)).trim().toLowerCase(),
    }
  }

  return null
}

const dedupeLanguages = (languages: LanguageOption[]) => {
  const seen = new Set<string>()
  return languages.reduce<LanguageOption[]>((accumulator, language) => {
    if (!language || seen.has(language.normalized)) return accumulator
    seen.add(language.normalized)
    accumulator.push(language)
    return accumulator
  }, [])
}

const filterByQuery = (languages: LanguageOption[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return languages

  return languages.filter(language => {
    return (
      language.name.toLowerCase().includes(normalizedQuery) ||
      language.normalized.includes(normalizedQuery.replace(/\s+/g, '_'))
    )
  })
}

const Badge = ({ children, onRemove, label }: { children: React.ReactNode; onRemove?: () => void; label?: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
    {children}
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        aria-label={label || 'Remove language'}
        className="rounded-full text-emerald-500 transition hover:text-emerald-700"
      >
        ×
      </button>
    ) : null}
  </span>
)

export default function LanguagesInput({
  value,
  onChange,
  placeholder = 'Search or add a language',
  className = '',
  apiBaseUrl = API_BASE_URL,
}: LanguagesInputProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiResults, setApiResults] = useState<LanguageOption[]>([])
  const [showFallback, setShowFallback] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const selectedLanguages = useMemo(
    () => dedupeLanguages((Array.isArray(value) ? value : []).map(toLanguageOption).filter(Boolean) as LanguageOption[]),
    [value]
  )
  const selectedNormalized = useMemo(
    () => new Set(selectedLanguages.map(language => language.normalized)),
    [selectedLanguages]
  )

  const fallbackOptions = useMemo(
    () => dedupeLanguages((Array.isArray(fallbackLanguages) ? fallbackLanguages : []).map(toLanguageOption).filter(Boolean) as LanguageOption[]),
    []
  )

  const visibleOptions = useMemo(() => {
    const source = showFallback ? fallbackOptions : apiResults
    return filterByQuery(source, query).filter(language => !selectedNormalized.has(language.normalized))
  }, [apiResults, fallbackOptions, query, selectedNormalized, showFallback])

  const normalizedQuery = normalizeLanguage(query)
  const hasInput = query.trim().length > 0
  const canCreate = hasInput && !selectedNormalized.has(normalizedQuery) && visibleOptions.length === 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return

    const trimmedQuery = query.trim()
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/api/languages?search=${encodeURIComponent(trimmedQuery)}`)
        if (!response.ok) {
          throw new Error('Language search failed')
        }

        const data = await response.json()
        const apiLanguages = dedupeLanguages(
          (Array.isArray(data) ? data : [])
            .map(toLanguageOption)
            .filter(Boolean) as LanguageOption[]
        )

        if (apiLanguages.length > 0) {
          setApiResults(apiLanguages)
          setShowFallback(false)
        } else {
          setApiResults(fallbackOptions)
          setShowFallback(true)
        }
      } catch (fetchError) {
        setApiResults(fallbackOptions)
        setShowFallback(true)
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load languages')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [apiBaseUrl, fallbackOptions, open, query])

  const updateLanguages = (nextLanguages: LanguageOption[]) => {
    onChange(dedupeLanguages(nextLanguages))
  }

  const addLanguage = (language: LanguageOption) => {
    if (selectedNormalized.has(language.normalized)) return
    updateLanguages([...selectedLanguages, language])
    setQuery('')
    setOpen(false)
  }

  const removeLanguage = (normalized: string) => {
    updateLanguages(selectedLanguages.filter(language => language.normalized !== normalized))
  }

  const createLanguage = async () => {
    const name = query.trim()
    if (!name) return

    const normalized = normalizeLanguage(name)
    if (selectedNormalized.has(normalized)) return

    setCreating(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, normalized }),
      })

      if (!response.ok) {
        throw new Error('Failed to create language')
      }

      const createdLanguage = toLanguageOption(await response.json())
      if (!createdLanguage) {
        throw new Error('Invalid language response')
      }

      addLanguage(createdLanguage)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create language')
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (visibleOptions[0]) {
        addLanguage(visibleOptions[0])
        return
      }
      if (canCreate) {
        void createLanguage()
      }
    }

    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-12 flex-wrap gap-2 px-3 py-2">
          {selectedLanguages.map(language => (
            <Badge key={language.normalized} onRemove={() => removeLanguage(language.normalized)} label={`Remove ${language.name}`}>
              {language.name}
            </Badge>
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
            placeholder={selectedLanguages.length ? '' : placeholder}
            className="min-w-55 flex-1 border-0 p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-out">
          <div className="max-h-64 overflow-auto p-2">
            {loading ? (
              <div className="px-3 py-4 text-sm text-slate-500">Loading languages...</div>
            ) : null}

            {!loading && visibleOptions.length > 0 ? (
              <div className="space-y-1">
                {visibleOptions.map(language => (
                  <button
                    key={language.normalized}
                    type="button"
                    onClick={() => addLanguage(language)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <span>{language.name}</span>
                    <span className="text-xs text-slate-400">Add</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!loading && canCreate ? (
              <button
                type="button"
                onClick={() => void createLanguage()}
                disabled={creating}
                className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>Add &quot;{query.trim()}&quot;</span>
                <span className="text-xs text-blue-500">New</span>
              </button>
            ) : null}

            {!loading && !visibleOptions.length && !canCreate ? (
              <div className="px-3 py-4 text-sm text-slate-500">No results found</div>
            ) : null}

            {error ? <div className="px-3 pb-2 pt-1 text-xs text-rose-600">{error}</div> : null}
          </div>
        </div>
      )}
    </div>
  )
}