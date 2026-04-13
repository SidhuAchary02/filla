import { useState, useEffect } from 'react'
import { submitOnboarding, getUserProfile } from '../lib/authService'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

const STEPS = [
  { id: 1, title: 'Job Timeline' },
  { id: 2, title: 'Location' },
  { id: 3, title: 'Resume' },
  { id: 4, title: 'Experience Level' },
  { id: 5, title: 'Role Preference' },
  { id: 6, title: 'Work Experience' },
  { id: 7, title: 'Education' },
  { id: 8, title: 'Projects' },
  { id: 9, title: 'Links' },
  { id: 10, title: 'Skills' },
  { id: 11, title: 'Languages' },
  { id: 12, title: 'Salary Expectation' },
]

export default function OnboardingForm() {
  const { loading, getToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Location data states
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [pincodes, setPincodes] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingPincodes, setLoadingPincodes] = useState(false)

  const [formData, setFormData] = useState({
    job_search_timeline: '',
    location: { country: '', state: '', city: '', pincode: '' },
    resume_url: '',
    experience_level: '',
    role: '',
    work_experience: [],
    education: [],
    projects: [],
    links: { linkedin: '', github: '', portfolio: '' },
    skills: [],
    languages: [],
    min_salary: '',
  })

  const [tempWorkExp, setTempWorkExp] = useState({ title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' })
  const [tempEducation, setTempEducation] = useState({ school: '', degree: '', major: '', start_date: '', end_date: '' })
  const [tempProject, setTempProject] = useState({ name: '', role: '', description: '', link: '' })
  const [tempSkill, setTempSkill] = useState('')
  const [tempLanguage, setTempLanguage] = useState('')

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries()
  }, [])

  // Fetch states when country changes
  useEffect(() => {
    if (formData.location.country) {
      fetchStates(formData.location.country)
      setCities([])
      setPincodes([])
      setFormData(prev => ({ ...prev, location: { ...prev.location, state: '', city: '', pincode: '' } }))
    }
  }, [formData.location.country])

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.location.state && formData.location.country) {
      fetchCities(formData.location.country, formData.location.state)
      setPincodes([])
      setFormData(prev => ({ ...prev, location: { ...prev.location, city: '', pincode: '' } }))
    }
  }, [formData.location.state])

  // Fetch pincodes when city changes
  useEffect(() => {
    if (formData.location.city && formData.location.country) {
      fetchPincodes(formData.location.country, formData.location.state, formData.location.city)
    }
  }, [formData.location.city])

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true)
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      const data = await response.json()
      if (Array.isArray(data)) {
        const countryList = data.map(country => ({
          name: country?.name?.common,
          code: country?.cca2,
        })).sort((a, b) => a.name.localeCompare(b.name))
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

  const fetchStates = async (countryName) => {
    try {
      setLoadingStates(true)
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      })
      const data = await response.json()
      if (Array.isArray(data?.data?.states)) {
        const stateList = data.data.states.map(state => ({
          name: state.name,
          code: state.name,
        })).sort((a, b) => a.name.localeCompare(b.name))
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
        const cityList = data.data.map((city, index) => ({
          name: city,
          geonameId: `${city}-${index}`,
        })).sort((a, b) => a.name.localeCompare(b.name))
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateName)}&country=${encodeURIComponent(countryName)}&format=jsonv2&addressdetails=1&limit=25`)
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
      const isComplete = localStorage.getItem('onboarding_complete') === 'true'
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
            ...prev,
            job_search_timeline: profile.job_search_timeline || '',
            location: profile.location || { country: '', state: '', city: '', pincode: '' },
            resume_url: profile.resume_url || '',
            experience_level: profile.experience_level || '',
            role: profile.role || '',
            work_experience: profile.work_experience || [],
            education: profile.education || [],
            projects: profile.projects || [],
            links: profile.links || { linkedin: '', github: '', portfolio: '' },
            skills: profile.skills || [],
            languages: profile.languages || [],
            min_salary: profile.min_salary || '',
          }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      setError('')
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const addWorkExp = () => {
    if (tempWorkExp.title && tempWorkExp.company) {
      setFormData(prev => ({
        ...prev,
        work_experience: [...prev.work_experience, tempWorkExp]
      }))
      setTempWorkExp({ title: '', company: '', location: '', start_date: '', end_date: '', is_current: false, description: '' })
    }
  }

  const removeWorkExp = (index) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    if (tempEducation.school && tempEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, tempEducation]
      }))
      setTempEducation({ school: '', degree: '', major: '', start_date: '', end_date: '' })
    }
  }

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const addProject = () => {
    if (tempProject.name) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, tempProject]
      }))
      setTempProject({ name: '', role: '', description: '', link: '' })
    }
  }

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
  }

  const addSkill = () => {
    if (tempSkill.trim() && !formData.skills.includes(tempSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, tempSkill.trim()]
      }))
      setTempSkill('')
    }
  }

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const addLanguage = () => {
    if (tempLanguage.trim() && !formData.languages.includes(tempLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, tempLanguage.trim()]
      }))
      setTempLanguage('')
    }
  }

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const token = getToken()
      if (!token) throw new Error('No auth token')

      const sanitizedPayload = {
        ...formData,
        resume_url: formData.resume_url?.trim() || null,
        role: formData.role?.trim() || null,
        min_salary:
          formData.min_salary === '' || formData.min_salary === null
            ? null
            : Number(formData.min_salary),
        location: {
          country: formData.location.country || null,
          state: formData.location.state || null,
          city: formData.location.city || null,
          pincode: formData.location.pincode?.trim() || null,
        },
      }
      
      await submitOnboarding(sanitizedPayload, token)
      localStorage.setItem('onboarding_complete', 'true')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to submit onboarding')
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">When are you ready for a new job?</h3>
            <div className="space-y-2">
              {['ASAP', 'within_3_months', 'within_6_months', 'passive'].map(option => (
                <label key={option} className="flex items-center">
                  <input type="radio" name="job_search_timeline" value={option} checked={formData.job_search_timeline === option} onChange={e => setFormData(prev => ({ ...prev, job_search_timeline: e.target.value }))} className="mr-2" />
                  {option.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Where are you located?</h3>
            
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select value={formData.location.country} onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, country: e.target.value } }))} className="w-full px-3 py-2 border rounded" disabled={loadingCountries}>
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>{country.name}</option>
                ))}
              </select>
              {loadingCountries && <p className="text-xs text-gray-500 mt-1">Loading countries...</p>}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <select value={formData.location.state} onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))} className="w-full px-3 py-2 border rounded" disabled={!formData.location.country || loadingStates}>
                <option value="">Select State/Province</option>
                {states.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
              {loadingStates && <p className="text-xs text-gray-500 mt-1">Loading states...</p>}
              {!formData.location.country && <p className="text-xs text-gray-500 mt-1">Select a country first</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select value={formData.location.city} onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))} className="w-full px-3 py-2 border rounded" disabled={!formData.location.state || loadingCities}>
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.geonameId} value={city.name}>{city.name}</option>
                ))}
              </select>
              {loadingCities && <p className="text-xs text-gray-500 mt-1">Loading cities...</p>}
              {!formData.location.state && <p className="text-xs text-gray-500 mt-1">Select a state first</p>}
            </div>

            {/* Pin Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pin/Postal Code (Optional)</label>
              <select value={formData.location.pincode} onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, pincode: e.target.value } }))} className="w-full px-3 py-2 border rounded" disabled={!formData.location.city || loadingPincodes}>
                <option value="">Select or enter manually</option>
                {pincodes.map(pc => (
                  <option key={pc.code} value={pc.code}>{pc.code} - {pc.name}</option>
                ))}
              </select>
              {loadingPincodes && <p className="text-xs text-gray-500 mt-1">Loading postal codes...</p>}
              <input type="text" placeholder="Or enter manually" value={formData.location.pincode} onChange={e => setFormData(prev => ({ ...prev, location: { ...prev.location, pincode: e.target.value } }))} className="w-full px-3 py-2 border rounded mt-2" />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Upload Resume (Optional)</h3>
            <input type="text" placeholder="Resume URL" value={formData.resume_url} onChange={e => setFormData(prev => ({ ...prev, resume_url: e.target.value }))} className="w-full px-3 py-2 border rounded" />
            <p className="text-sm text-gray-500">You can skip this step or provide a URL to your resume</p>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">What's your experience level?</h3>
            <div className="space-y-2">
              {['internship', 'entry', 'junior', 'mid', 'senior', 'expert'].map(level => (
                <label key={level} className="flex items-center">
                  <input type="radio" name="experience_level" value={level} checked={formData.experience_level === level} onChange={e => setFormData(prev => ({ ...prev, experience_level: e.target.value }))} className="mr-2" />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">What role are you interested in?</h3>
            <input type="text" placeholder="e.g., Full-Stack Developer, Product Manager" value={formData.role} onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3 py-2 border rounded" />
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Work Experience</h3>
            <div className="border rounded p-3 space-y-2">
              <input type="text" placeholder="Job Title" value={tempWorkExp.title} onChange={e => setTempWorkExp(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Company" value={tempWorkExp.company} onChange={e => setTempWorkExp(prev => ({ ...prev, company: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Location" value={tempWorkExp.location} onChange={e => setTempWorkExp(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="date" value={tempWorkExp.start_date} onChange={e => setTempWorkExp(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" placeholder="Start Date" />
              <input type="date" value={tempWorkExp.end_date} onChange={e => setTempWorkExp(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" placeholder="End Date" disabled={tempWorkExp.is_current} />
              <label className="flex items-center text-sm">
                <input type="checkbox" checked={tempWorkExp.is_current} onChange={e => setTempWorkExp(prev => ({ ...prev, is_current: e.target.checked, end_date: e.target.checked ? '' : prev.end_date }))} className="mr-2" />
                Currently working here
              </label>
              <textarea placeholder="Description" value={tempWorkExp.description} onChange={e => setTempWorkExp(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
              <button onClick={addWorkExp} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Experience</button>
            </div>
            <div className="space-y-2">
              {formData.work_experience.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
                  <div>
                    <p className="font-medium">{exp.title} at {exp.company}</p>
                    <p className="text-xs text-gray-600">{exp.start_date} {!exp.is_current && `to ${exp.end_date}`}</p>
                  </div>
                  <button onClick={() => removeWorkExp(idx)} className="text-red-600 hover:text-red-800">✕</button>
                </div>
              ))}
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Education</h3>
            <div className="border rounded p-3 space-y-2">
              <input type="text" placeholder="School/University" value={tempEducation.school} onChange={e => setTempEducation(prev => ({ ...prev, school: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Degree" value={tempEducation.degree} onChange={e => setTempEducation(prev => ({ ...prev, degree: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Major/Field" value={tempEducation.major} onChange={e => setTempEducation(prev => ({ ...prev, major: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="date" value={tempEducation.start_date} onChange={e => setTempEducation(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="date" value={tempEducation.end_date} onChange={e => setTempEducation(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <button onClick={addEducation} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Education</button>
            </div>
            <div className="space-y-2">
              {formData.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
                  <div>
                    <p className="font-medium">{edu.degree} in {edu.major}</p>
                    <p className="text-xs text-gray-600">{edu.school}</p>
                  </div>
                  <button onClick={() => removeEducation(idx)} className="text-red-600 hover:text-red-800">✕</button>
                </div>
              ))}
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Projects</h3>
            <div className="border rounded p-3 space-y-2">
              <input type="text" placeholder="Project Name" value={tempProject.name} onChange={e => setTempProject(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Your Role" value={tempProject.role} onChange={e => setTempProject(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <textarea placeholder="Description" value={tempProject.description} onChange={e => setTempProject(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" rows="2" />
              <input type="text" placeholder="Project Link" value={tempProject.link} onChange={e => setTempProject(prev => ({ ...prev, link: e.target.value }))} className="w-full px-3 py-2 border rounded text-sm" />
              <button onClick={addProject} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700">Add Project</button>
            </div>
            <div className="space-y-2">
              {formData.projects.map((proj, idx) => (
                <div key={idx} className="flex justify-between items-start border rounded p-2 text-sm">
                  <div>
                    <p className="font-medium">{proj.name}</p>
                    <p className="text-xs text-gray-600">{proj.role}</p>
                  </div>
                  <button onClick={() => removeProject(idx)} className="text-red-600 hover:text-red-800">✕</button>
                </div>
              ))}
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Social & Portfolio Links</h3>
            <input type="text" placeholder="LinkedIn URL" value={formData.links.linkedin} onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, linkedin: e.target.value } }))} className="w-full px-3 py-2 border rounded" />
            <input type="text" placeholder="GitHub URL" value={formData.links.github} onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, github: e.target.value } }))} className="w-full px-3 py-2 border rounded" />
            <input type="text" placeholder="Portfolio URL" value={formData.links.portfolio} onChange={e => setFormData(prev => ({ ...prev, links: { ...prev.links, portfolio: e.target.value } }))} className="w-full px-3 py-2 border rounded" />
          </div>
        )

      case 10:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Technical Skills</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Add a skill (e.g., Python, React)" value={tempSkill} onChange={e => setTempSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} className="flex-1 px-3 py-2 border rounded" />
              <button onClick={addSkill} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {skill}
                  <button onClick={() => removeSkill(idx)} className="text-blue-600 hover:text-blue-800">✕</button>
                </div>
              ))}
            </div>
          </div>
        )

      case 11:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Languages</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Add a language (e.g., English, Spanish)" value={tempLanguage} onChange={e => setTempLanguage(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLanguage()} className="flex-1 px-3 py-2 border rounded" />
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

      case 12:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Minimum Salary Expectation</h3>
            <input type="number" placeholder="Enter minimum salary" value={formData.min_salary} onChange={e => setFormData(prev => ({ ...prev, min_salary: e.target.value }))} className="w-full px-3 py-2 border rounded" />
            <p className="text-sm text-gray-500">Leave blank if you prefer not to specify</p>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">Onboarding</h2>
            <span className="text-sm text-gray-600">Step {currentStep} of {STEPS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">{STEPS[currentStep - 1].title}</h3>
          {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm">{error}</div>}
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <button onClick={handlePrev} disabled={currentStep === 1} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          {currentStep < STEPS.length ? (
            <button onClick={handleNext} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
