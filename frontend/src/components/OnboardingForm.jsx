import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { submitOnboarding, getUserProfile } from '../lib/authService'
import { useAuth } from '../lib/useAuth'
import { getCookie, setCookie } from '../lib/cookieUtils'
import { createSupabaseClientWithToken } from '../lib/supabaseClient'
import { detectLocaleCurrency } from './SalaryInput'
import JobTimelineStep from './onboarding/steps/JobTimelineStep'
import LocationStep from './onboarding/steps/LocationStep'
import ResumeStep from './onboarding/steps/ResumeStep'
import ExperienceLevelStep from './onboarding/steps/ExperienceLevelStep'
import RolePreferenceStep from './onboarding/steps/RolePreferenceStep'
import WorkExperienceStep from './onboarding/steps/WorkExperienceStep'
import EducationStep from './onboarding/steps/EducationStep'
import ProjectsStep from './onboarding/steps/ProjectsStep'
import LinksStep from './onboarding/steps/LinksStep'
import SkillsStep from './onboarding/steps/SkillsStep'
import LanguagesStep from './onboarding/steps/LanguagesStep'
import SalaryExpectationStep from './onboarding/steps/SalaryExpectationStep'

const STEPS = [
  { id: 1, slug: 'job-timeline', title: 'Job Timeline', Component: JobTimelineStep },
  { id: 2, slug: 'location', title: 'Location', Component: LocationStep },
  { id: 3, slug: 'resume', title: 'Resume', Component: ResumeStep },
  { id: 4, slug: 'experience-level', title: 'Experience Level', Component: ExperienceLevelStep },
  { id: 5, slug: 'role-preference', title: 'Role Preference', Component: RolePreferenceStep },
  { id: 6, slug: 'work-experience', title: 'Work Experience', Component: WorkExperienceStep },
  { id: 7, slug: 'education', title: 'Education', Component: EducationStep },
  { id: 8, slug: 'projects', title: 'Projects', Component: ProjectsStep },
  { id: 9, slug: 'links', title: 'Links', Component: LinksStep },
  { id: 10, slug: 'skills', title: 'Skills', Component: SkillsStep },
  { id: 11, slug: 'languages', title: 'Languages', Component: LanguagesStep },
  { id: 12, slug: 'salary-expectation', title: 'Salary Expectation', Component: SalaryExpectationStep },
]

const RESUME_BUCKET = 'resumes'
const ALLOWED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_RESUME_EXTENSIONS = new Set(['pdf', 'doc', 'docx'])
const normalizeSkillText = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const toSkillObject = skill => {
  if (!skill) return null

  if (typeof skill === 'string') {
    const name = skill.trim()
    if (!name) return null
    return { name, normalized: normalizeSkillText(name) }
  }

  const name = String(skill.name || '').trim()
  if (!name) return null

  return {
    name,
    normalized: String(skill.normalized || normalizeSkillText(name)).trim().toLowerCase(),
  }
}

const normalizeSkills = skills => {
  if (!Array.isArray(skills)) return []
  const seen = new Set()

  return skills.reduce((accumulator, skill) => {
    const normalizedSkill = toSkillObject(skill)
    if (!normalizedSkill || seen.has(normalizedSkill.normalized)) return accumulator
    seen.add(normalizedSkill.normalized)
    accumulator.push(normalizedSkill)
    return accumulator
  }, [])
}

const normalizeLanguageText = value => String(value || '').trim().toLowerCase().replace(/\s+/g, '_')

const toLanguageObject = language => {
  if (!language) return null

  if (typeof language === 'string') {
    const name = language.trim()
    if (!name) return null
    return { name, normalized: normalizeLanguageText(name) }
  }

  const name = String(language.name || '').trim()
  if (!name) return null

  return {
    name,
    normalized: String(language.normalized || normalizeLanguageText(name)).trim().toLowerCase(),
  }
}

const normalizeLanguages = languages => {
  if (!Array.isArray(languages)) return []
  const seen = new Set()

  return languages.reduce((accumulator, language) => {
    const normalizedLanguage = toLanguageObject(language)
    if (!normalizedLanguage || seen.has(normalizedLanguage.normalized)) return accumulator
    seen.add(normalizedLanguage.normalized)
    accumulator.push(normalizedLanguage)
    return accumulator
  }, [])
}

const getFileExtension = name => (name?.split('.').pop() || '').toLowerCase()

const sanitizeFileName = name => name.replace(/[^a-zA-Z0-9._-]/g, '_')

const isAllowedResumeFile = file => {
  if (!file) return false
  if (ALLOWED_RESUME_MIME_TYPES.has(file.type)) return true
  return ALLOWED_RESUME_EXTENSIONS.has(getFileExtension(file.name))
}

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const ONBOARDING_DRAFT_KEY = 'onboarding_form_draft_v1'

const getDefaultFormData = () => ({
  job_search_timeline: '',
  location: { country: '', state: '', city: '', pincode: '' },
  resume_url: '',
  resume_file: null,
  experience_level: '',
  role: '',
  work_experience: [],
  education: [],
  projects: [],
  links: { linkedin: '', github: '', portfolio: '' },
  skills: [],
  languages: [],
  current_salary: {
    amount: null,
    currency: detectLocaleCurrency(),
    period: 'yearly',
  },
  salary_expectation: {
    amount: null,
    currency: detectLocaleCurrency(),
    period: 'yearly',
  },
})

const getInitialFormData = () => {
  const defaults = getDefaultFormData()
  if (typeof window === 'undefined') return defaults

  try {
    const rawDraft = window.sessionStorage.getItem(ONBOARDING_DRAFT_KEY)
    if (!rawDraft) return defaults

    const draft = JSON.parse(rawDraft)
    return {
      ...defaults,
      ...draft,
      location: { ...defaults.location, ...(draft?.location || {}) },
      links: { ...defaults.links, ...(draft?.links || {}) },
      current_salary: { ...defaults.current_salary, ...(draft?.current_salary || {}) },
      salary_expectation: { ...defaults.salary_expectation, ...(draft?.salary_expectation || {}) },
    }
  } catch {
    return defaults
  }
}

export default function OnboardingForm() {
  const { loading, getToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { stepSlug } = useParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [pincodes, setPincodes] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingPincodes, setLoadingPincodes] = useState(false)

  const [formData, setFormData] = useState(getInitialFormData)

  const [tempWorkExp, setTempWorkExp] = useState({ title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' })
  const [tempEducation, setTempEducation] = useState({ school: '', degree: '', major: '', start_date: '', end_date: '' })
  const [tempProject, setTempProject] = useState({ name: '', role: '', description: '', link: '' })

  const currentStepIndex = STEPS.findIndex(step => step.slug === stepSlug)
  const isValidStep = currentStepIndex >= 0
  const safeStepIndex = isValidStep ? currentStepIndex : 0
  const currentStep = STEPS[safeStepIndex]

  const validateCurrentStep = () => {
    const stepSlug = currentStep?.slug

    const fullName = (formData.fullName || formData.full_name || '').trim()
    const email = (formData.email || '').trim()
    const phone = (formData.phone || '').trim()
    const hasBasicInfoFields = 'fullName' in formData || 'full_name' in formData || 'email' in formData || 'phone' in formData

    if (stepSlug === 'basic-info' || (safeStepIndex === 0 && hasBasicInfoFields)) {
      if (!fullName || !email || !phone) {
        return 'Please fill all required fields'
      }
      if (!isValidEmail(email)) {
        return 'Please enter a valid email address'
      }
    }

    if (stepSlug === 'education') {
      if (!Array.isArray(formData.education) || formData.education.length === 0) {
        return 'Add at least 1 education to continue'
      }
    }

    if (stepSlug === 'skills') {
      if (!Array.isArray(formData.skills) || formData.skills.length === 0) {
        return 'Add at least 1 skill to continue'
      }
    }

    return ''
  }

  useEffect(() => {
    if (!stepSlug || !isValidStep) {
      navigate(`/onboarding/${STEPS[0].slug}`, { replace: true })
    }
  }, [stepSlug, isValidStep, navigate])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const draftToPersist = {
      ...formData,
      resume_file: null,
    }

    window.sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draftToPersist))
  }, [formData])

  useEffect(() => {
    if (!error) return
    const validationError = validateCurrentStep()
    if (!validationError) {
      setError('')
    }
  }, [
    error,
    safeStepIndex,
    currentStep?.slug,
    formData.fullName,
    formData.full_name,
    formData.email,
    formData.phone,
    formData.education,
    formData.skills,
  ])

  useEffect(() => {
    fetchCountries()
  }, [])

  useEffect(() => {
    if (formData.location.country) {
      fetchStates(formData.location.country)
      setCities([])
      setPincodes([])
      setFormData(prev => ({ ...prev, location: { ...prev.location, state: '', city: '', pincode: '' } }))
    }
  }, [formData.location.country])

  useEffect(() => {
    if (formData.location.state && formData.location.country) {
      fetchCities(formData.location.country, formData.location.state)
      setPincodes([])
      setFormData(prev => ({ ...prev, location: { ...prev.location, city: '', pincode: '' } }))
    }
  }, [formData.location.state, formData.location.country])

  useEffect(() => {
    if (formData.location.city && formData.location.country) {
      fetchPincodes(formData.location.country, formData.location.state, formData.location.city)
    }
  }, [formData.location.city, formData.location.country, formData.location.state])

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true)
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      const data = await response.json()
      if (Array.isArray(data)) {
        const countryList = data
          .map(country => ({
            name: country?.name?.common,
            code: country?.cca2,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setCountries(countryList)
      } else {
        setCountries([])
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err)
      setCountries([])
    } finally {
      setLoadingCountries(false)
    }
  }

  const fetchStates = async countryName => {
    try {
      setLoadingStates(true)
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      })
      const data = await response.json()
      if (Array.isArray(data?.data?.states)) {
        const stateList = data.data.states
          .map(state => ({
            name: state.name,
            code: state.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setStates(stateList)
      } else {
        setStates([])
      }
    } catch (err) {
      console.error('Failed to fetch states:', err)
      setStates([])
    } finally {
      setLoadingStates(false)
    }
  }

  const fetchCities = async (countryName, stateName) => {
    try {
      setLoadingCities(true)
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      })
      const data = await response.json()
      if (Array.isArray(data?.data)) {
        const cityList = data.data
          .map((city, index) => ({
            name: city,
            geonameId: `${city}-${index}`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setCities(cityList)
      } else {
        setCities([])
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const fetchPincodes = async (countryName, stateName, cityName) => {
    try {
      setLoadingPincodes(true)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateName)}&country=${encodeURIComponent(countryName)}&format=jsonv2&addressdetails=1&limit=25`
      )
      const data = await response.json()
      if (Array.isArray(data)) {
        const seen = new Set()
        const pincodeList = data
          .map(item => ({
            code: item?.address?.postcode,
            name: item?.display_name || cityName,
          }))
          .filter(item => item.code && !seen.has(item.code) && seen.add(item.code))
          .sort((a, b) => a.code.localeCompare(b.code))
        setPincodes(pincodeList)
      } else {
        setPincodes([])
      }
    } catch (err) {
      console.error('Failed to fetch pincodes:', err)
      setPincodes([])
    } finally {
      setLoadingPincodes(false)
    }
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login')
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated && !loading) {
      const isComplete = getCookie('onboarding_complete') === 'true'
      if (isComplete) navigate('/dashboard')
      else fetchProfile()
    }
  }, [isAuthenticated, loading, navigate])

  const fetchProfile = async () => {
    try {
      const token = getToken()
      if (token) {
        const profile = await getUserProfile(token)
        if (profile?.onboarding_completed) {
          navigate('/dashboard')
        } else if (profile) {
          setFormData(prev => ({
            ...getDefaultFormData(),
            ...prev,
            job_search_timeline: prev.job_search_timeline || profile.job_search_timeline || '',
            location: {
              ...getDefaultFormData().location,
              ...(profile.location || {}),
              ...(prev.location || {}),
            },
            resume_url: prev.resume_url || profile.resume_url || '',
            experience_level: prev.experience_level || profile.experience_level || '',
            role: prev.role || profile.role || '',
            work_experience: Array.isArray(prev.work_experience) && prev.work_experience.length > 0 ? prev.work_experience : (profile.work_experience || []),
            education: Array.isArray(prev.education) && prev.education.length > 0 ? prev.education : (profile.education || []),
            projects: Array.isArray(prev.projects) && prev.projects.length > 0 ? prev.projects : (profile.projects || []),
            links: {
              ...getDefaultFormData().links,
              ...(profile.links || {}),
              ...(prev.links || {}),
            },
            skills: Array.isArray(prev.skills) && prev.skills.length > 0 ? prev.skills : normalizeSkills(profile.skills),
            languages: Array.isArray(prev.languages) && prev.languages.length > 0 ? prev.languages : normalizeLanguages(profile.languages),
            current_salary: {
              amount:
                prev.current_salary?.amount !== null && prev.current_salary?.amount !== undefined
                  ? prev.current_salary.amount
                  : (typeof profile.current_ctc === 'number' ? profile.current_ctc : null),
              currency: prev.current_salary?.currency || detectLocaleCurrency(),
              period: prev.current_salary?.period || 'yearly',
            },
            salary_expectation: {
              amount:
                prev.salary_expectation?.amount !== null && prev.salary_expectation?.amount !== undefined
                  ? prev.salary_expectation.amount
                  : (typeof profile.min_salary === 'number' ? profile.min_salary : null),
              currency: prev.salary_expectation?.currency || detectLocaleCurrency(),
              period: prev.salary_expectation?.period || 'yearly',
            },
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleNext = () => {
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }

    if (safeStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[safeStepIndex + 1]
      setError('')
      navigate(`/onboarding/${nextStep.slug}`)
    }
  }

  const handlePrev = () => {
    if (safeStepIndex > 0) {
      const prevStep = STEPS[safeStepIndex - 1]
      setError('')
      navigate(`/onboarding/${prevStep.slug}`)
    }
  }

  const addWorkExp = () => {
    if (tempWorkExp.title && tempWorkExp.company) {
      setFormData(prev => ({
        ...prev,
        work_experience: [...prev.work_experience, tempWorkExp],
      }))
      setTempWorkExp({ title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' })
    }
  }

  const removeWorkExp = index => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index),
    }))
  }

  const addEducation = () => {
    if (tempEducation.school && tempEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, tempEducation],
      }))
      setTempEducation({ school: '', degree: '', major: '', start_date: '', end_date: '' })
    }
  }

  const removeEducation = index => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const addProject = () => {
    if (tempProject.name) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, tempProject],
      }))
      setTempProject({ name: '', role: '', description: '', link: '' })
    }
  }

  const removeProject = index => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const token = getToken()
      if (!token) throw new Error('No auth token')

      let resolvedResumePath = formData.resume_url?.trim() || null

      if (formData.resume_file) {
        const userId = getCookie('user_id')
        if (!userId) {
          throw new Error('Missing user id for resume upload')
        }
        if (!isAllowedResumeFile(formData.resume_file)) {
          throw new Error('Only PDF, DOC, or DOCX files are allowed for resume upload')
        }

        const supabaseAuthedClient = createSupabaseClientWithToken(token)
        const fileName = sanitizeFileName(formData.resume_file.name || 'resume')
        const filePath = `${userId}/${Date.now()}-${fileName}`

        const { error: uploadError } = await supabaseAuthedClient.storage
          .from(RESUME_BUCKET)
          .upload(filePath, formData.resume_file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Resume upload failed: ${uploadError.message}`)
        }

        resolvedResumePath = filePath
      }

      const formDataForApi = { ...formData }
      delete formDataForApi.resume_file
      delete formDataForApi.current_salary
      delete formDataForApi.salary_expectation

      const rawCurrentSalaryAmount = formData.current_salary?.amount
      const currentSalaryAmount = typeof rawCurrentSalaryAmount === 'number' && Number.isFinite(rawCurrentSalaryAmount) ? rawCurrentSalaryAmount : null

      const rawSalaryAmount = formData.salary_expectation?.amount
      const salaryAmount = typeof rawSalaryAmount === 'number' && Number.isFinite(rawSalaryAmount) ? rawSalaryAmount : null

      const sanitizedPayload = {
        ...formDataForApi,
        resume_url: resolvedResumePath,
        role: formData.role?.trim() || null,
        current_ctc: currentSalaryAmount,
        min_salary: salaryAmount,
        skills: normalizeSkills(formData.skills),
        languages: normalizeLanguages(formData.languages).map(language => language.normalized),
        location: {
          country: formData.location.country || null,
          state: formData.location.state || null,
          city: formData.location.city || null,
          pincode: formData.location.pincode?.trim() || null,
        },
      }

      await submitOnboarding(sanitizedPayload, token)
      setCookie('onboarding_complete', 'true', { maxAge: 4 * 24 * 60 * 60 })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to submit onboarding')
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!currentStep) return null

  const ActiveStepComponent = currentStep.Component
  const isLastStep = safeStepIndex === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">Onboarding</h2>
            <span className="text-sm text-gray-600">Step {safeStepIndex + 1} of {STEPS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((safeStepIndex + 1) / STEPS.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-2">{currentStep.title}</h3>
          <p className="text-xs text-gray-500 mb-4">URL: /onboarding/{currentStep.slug}</p>
          {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm">{error}</div>}

          <ActiveStepComponent
            formData={formData}
            setFormData={setFormData}
            countries={countries}
            states={states}
            cities={cities}
            pincodes={pincodes}
            loadingCountries={loadingCountries}
            loadingStates={loadingStates}
            loadingCities={loadingCities}
            loadingPincodes={loadingPincodes}
            tempWorkExp={tempWorkExp}
            setTempWorkExp={setTempWorkExp}
            addWorkExp={addWorkExp}
            removeWorkExp={removeWorkExp}
            tempEducation={tempEducation}
            setTempEducation={setTempEducation}
            addEducation={addEducation}
            removeEducation={removeEducation}
            tempProject={tempProject}
            setTempProject={setTempProject}
            addProject={addProject}
            removeProject={removeProject}
          />
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={safeStepIndex === 0}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {!isLastStep ? (
            <button onClick={handleNext} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
