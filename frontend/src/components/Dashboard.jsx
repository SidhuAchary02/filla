import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import { useNavigate } from 'react-router-dom'
import { Gem, Pencil, ExternalLink } from 'lucide-react'
import { logout as logoutService, getUserProfile } from '../lib/authService'
import PersonalInfoDrawer from './drawers/PersonalInfoDrawer'
import EmploymentInfoDrawer from './drawers/EmploymentInfoDrawer'
import SummaryDrawer from './drawers/SummaryDrawer'
import JobSearchStatusDrawer from './drawers/JobSearchStatusDrawer'
import SkillsDrawer from './drawers/SkillsDrawer'
import LanguagesDrawer from './drawers/LanguagesDrawer'
import EducationDrawer from './drawers/EducationDrawer'
import WorkExperienceDrawer from './drawers/WorkExperienceDrawer'
import ProjectsDrawer from './drawers/ProjectsDrawer'
import LinksDrawer from './drawers/LinksDrawer'
import CompensationDrawer from './drawers/CompensationDrawer'

const menuItems = [
  { label: 'Profile', subtitle: 'Edit autofill information', emoji: '✏️' },
  { label: 'Personal Info', subtitle: 'Edit demographic data', emoji: '📊', active: true },
  { label: 'Job Preferences', subtitle: 'Refine your job search', emoji: '💼' },
]

const checklistItems = [
  'Add your contact info',
  'Add your education journey',
  'Add your work experience',
  'Add your resume',
  'Add your personal links',
  'Add your skills',
  'Fill out your job preferences',
  'Fill out your employment info',
]

const floatingSections = [
  { label: 'Home', active: true },
  { label: 'Matches' },
  { label: 'Jobs' },
  { label: 'Job Tracker' },
  { label: 'Documents' },
]

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'U'

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function getDisplayName(profile, email) {
  // Try to construct from first_name, middle_name, last_name
  const parts = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')

  // Fallback to legacy fields
  if (profile?.full_name) return profile.full_name
  if (profile?.name) return profile.name
  if (email) {
    const localPart = email.split('@')[0] || 'user'
    return `${localPart.charAt(0).toUpperCase()}${localPart.slice(1)} User`
  }
  return 'User'
}

function formatSalary(profile) {
  if (!profile?.min_salary) return '-'
  return `₹${Number(profile.min_salary).toLocaleString()}`
}

function InfoItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value || '-'}</p>
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profile = user?.profile || {}
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const workExperience = Array.isArray(profile.work_experience) ? profile.work_experience : []
  const education = Array.isArray(profile.education) ? profile.education : []
  const projects = Array.isArray(profile.projects) ? profile.projects : []
  const languages = Array.isArray(profile.languages) ? profile.languages : []
  const location = profile.location || {}
  const links = profile.links || {}

  // Get auth token
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

  // Drawer state
  const [openDrawer, setOpenDrawer] = useState(null)
  const [refreshedProfile, setRefreshedProfile] = useState(null)

  // Use refreshed profile if available, otherwise use user profile
  const displayProfile = refreshedProfile || profile

  const handleDrawerOpen = (drawerName) => {
    setOpenDrawer(drawerName)

    // Refetch fresh profile data when drawer opens
    if (token) {
      getUserProfile(token)
        .then(freshProfile => {
          setRefreshedProfile(freshProfile)
        })
        .catch(err => console.error('Error fetching profile:', err))
    }
  }

  const handleDrawerClose = () => {
    setOpenDrawer(null)
  }

  // Refetch profile after drawer closes with a small delay
  useEffect(() => {
    if (!openDrawer && token && refreshedProfile) {
      // Drawer just closed, refetch to get any updates
      const timer = setTimeout(() => {
        getUserProfile(token)
          .then(freshProfile => {
            setRefreshedProfile(freshProfile)
          })
          .catch(err => console.error('Error refetching profile:', err))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [openDrawer, token])

  const handleSavePersonalInfo = async (formData) => {
    // Profile will be updated via API in PersonalInfoDrawer
    console.log('Personal info saved successfully')
  }

  const handleSaveEmploymentInfo = async (formData) => {
    // Profile will be updated via API in EmploymentInfoDrawer
    console.log('Employment info saved successfully')
  }

  const handleSaveSummary = async (formData) => {
    // Profile will be updated via API in SummaryDrawer
    console.log('Summary saved successfully')
  }

  const handleSaveJobSearchStatus = async (formData) => {
    // Profile will be updated via API in JobSearchStatusDrawer
    console.log('Job search status saved successfully')
  }

  const handleSaveSkills = async (formData) => {
    // Profile will be updated via API in SkillsDrawer
    console.log('Skills saved successfully')
  }

  const handleSaveLanguages = async (formData) => {
    // Profile will be updated via API in LanguagesDrawer
    console.log('Languages saved successfully')
  }

  const handleSaveEducation = async (formData) => {
    // Profile will be updated via API in EducationDrawer
    console.log('Education saved successfully')
  }

  const handleSaveWorkExperience = async (formData) => {
    // Profile will be updated via API in WorkExperienceDrawer
    console.log('Work experience saved successfully')
  }

  const handleSaveProjects = async (formData) => {
    // Profile will be updated via API in ProjectsDrawer
    console.log('Projects saved successfully')
  }

  const handleSaveLinks = async (formData) => {
    // Profile will be updated via API in LinksDrawer
    console.log('Links saved successfully')
  }

  const handleSaveCompensation = async (formData) => {
    // Profile will be updated via API in CompensationDrawer
    console.log('Compensation info saved successfully')
  }

  console.log('first', user)

  const displayName = getDisplayName(profile, user?.email)
  const statusLabel = profile.job_search_timeline || 'Actively looking'
  const completionPercent = Math.min(
    100,
    [user?.email, profile.role, profile.experience_level, skills.length, education.length, workExperience.length, links.linkedin, profile.resume_url]
      .filter(Boolean)
      .length * 12
  )

  const handleLogout = () => {
    logoutService()
    logout()
    navigate('/login')
  }

  const handleEditProfile = () => {
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-370 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <a href="/">
                <img src="./logo.png" width={45} alt="Filla Logo" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white">
              {getInitials(displayName)}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-370 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDrawerOpen('jobSearch')}
                  className="rounded-md p-1 text-cyan-600 transition hover:bg-cyan-50 cursor-pointer"
                  aria-label="Edit job search status"
                >
                  <Pencil size={16} />

                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-cyan-500 text-2xl font-semibold text-white shadow-sm">
                  {getInitials(displayName)}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{displayName}</h2>
                <p className="mt-1 text-sm text-slate-500">{user?.email || 'No email provided'}</p>

                <div className="mt-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Job Search Status</p>
                  <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 ring-1 ring-cyan-100">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </section>

            {/* <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="px-1 pb-3 text-sm font-semibold text-slate-900">My Career Hub</p>
              <div className="space-y-3">
                {menuItems.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.label === 'Profile' ? handleEditProfile : undefined}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      item.active
                        ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-base ${item.active ? 'text-white' : 'text-slate-500'}`}>{item.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className={`text-xs ${item.active ? 'text-cyan-50' : 'text-slate-500'}`}>{item.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-sm ${item.active ? 'text-white' : 'text-slate-400'}`}>→</span>
                  </button>
                ))}
              </div>
            </section> */}

            {/* <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">My Profile Strength</p>
                <p className="mt-1 text-sm text-slate-500">Career Newbie</p>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${completionPercent}%` }} />
              </div>

              <div className="space-y-2">
                {checklistItems.map((item, index) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${index < 1 ? 'bg-slate-400 text-white' : 'border border-slate-300 text-slate-400'}`}>
                      {index < 1 ? '✓' : '○'}
                    </span>
                    <span>{item}</span>
                    <span className="ml-auto text-xs text-cyan-600">+10%</span>
                  </div>
                ))}
              </div>
            </section> */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Compensation & Resume</h3>
                <button
                  type="button"
                  onClick={() => handleDrawerOpen('compensation')}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  aria-label="Edit compensation and resume"
                >
                  <Pencil size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Current CTC</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {displayProfile.current_ctc
                      ? `₹${Number(displayProfile.current_ctc).toLocaleString('en-IN')}`
                      : <span className="text-slate-400">-</span>
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Expected Min Salary</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {displayProfile.min_salary
                      ? `₹${Number(displayProfile.min_salary).toLocaleString('en-IN')}`
                      : <span className="text-slate-400">-</span>
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Notice Period</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {displayProfile.notice_period
                      ? displayProfile.notice_period
                      : <span className="text-slate-400">-</span>
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Resume</p>
                  {displayProfile.resume_url ? (
                    <a
                      href={displayProfile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
                    >
                      View Resume
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">No resume added</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-cyan-100 bg-linear-to-b from-cyan-50 to-sky-100 p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Upgrade to Premium</p>
                  <h4 className="mt-1 text-lg font-bold text-slate-900">filla+ <span className="text-xs font-medium text-slate-500">Beta</span></h4>
                </div>
                <Gem size={16} />
              </div>

              <p className="text-sm text-slate-700">Supercharge your job search with filla&apos;s AI features.</p>

              <div className="my-4 space-y-2 border-y border-cyan-100 py-4 text-sm text-slate-700">
                <p>✍️ AI Response Writer</p>
                <p>⚡ Smart Resume Optimizer</p>
                <p>📄 Resume Manager</p>
                <p>✉️ Cover Letter Generator</p>
              </div>

              <button
                type="button"
                className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Subscribe to filla+
              </button>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600">Dashboard</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Personal Info</h1>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                Logout
              </button>
            </div>

            <SectionCard
              title="Personal Info"
              action={
                <button
                  type="button"
                  onClick={() => handleDrawerOpen('personal')}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  aria-label="Edit personal info"
                >
                  <Pencil size={16} />

                </button>
              }
            >
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <InfoItem label="First Name" value={displayProfile.first_name || '-'} />
                <InfoItem label="Middle Name" value={displayProfile.middle_name || '-'} />
                <InfoItem label="Last Name" value={displayProfile.last_name || '-'} />
                <InfoItem label="Preferred Name" value={displayProfile.preferred_name || '-'} />
                <InfoItem label="Suffix Name" value={displayProfile.suffix_name || '-'} />
                <InfoItem label="Email Address" value={user?.email || 'Not provided'} />
                <InfoItem label="Phone Number" value={displayProfile.phone || '-'} />
                <InfoItem label="Birthday" value={displayProfile.birthday || '-'} />
                <InfoItem label="Location" value={[location.city, location.state, location.country].filter(Boolean).join(', ') || '-'} />
                <InfoItem label="Address" value={displayProfile.address || '-'} />
                <InfoItem label="Address 2" value={displayProfile.address_2 || '-'} />
                <InfoItem label="Address 3" value={displayProfile.address_3 || '-'} />
                <InfoItem label="Postal Code" value={location.pincode || '-'} />
              </div>
            </SectionCard>
            <SectionCard
              title="Employment Information"
              action={
                <button
                  type="button"
                  onClick={() => handleDrawerOpen('employment')}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Edit employment info"
                >
                  <Pencil size={16} />
                </button>
              }
            >
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <InfoItem label="What is your ethnicity?" value={displayProfile.ethnicity || '-'} />
                <InfoItem label="Are you authorized to work in the US?" value={displayProfile.work_authorized_us || '-'} />
                <InfoItem label="Are you authorized to work in Canada?" value={displayProfile.work_authorized_canada || '-'} />
                <InfoItem label="Are you authorized to work in the United Kingdom?" value={displayProfile.work_authorized_uk || '-'} />
                <InfoItem label="Will you now or in the future require sponsorship for employment visa status?" value={displayProfile.sponsorship_required || '-'} />
                <InfoItem label="Do you have a disability?" value={displayProfile.disability || '-'} />
                <InfoItem label="Do you identify as LGBTQ+?" value={displayProfile.lgbtq || '-'} />
                <InfoItem label="What is your gender?" value={displayProfile.gender || '-'} />
                <InfoItem label="Are you a veteran?" value={displayProfile.veteran || '-'} />
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Skills"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('skills')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit skills"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <span
                        key={`${typeof skill === 'string' ? skill : skill?.normalized || 'skill'}-${index}`}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
                      >
                        {typeof skill === 'string' ? skill : skill?.name || 'Skill'}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No skills added</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Languages"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('languages')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit languages"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {languages.length > 0 ? (
                    languages.map((language, index) => (
                      <span
                        key={`${typeof language === 'string' ? language : language?.normalized || 'language'}-${index}`}
                        className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {typeof language === 'string' ? language : language?.name || 'Language'}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No languages added</p>
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Education"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('education')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit education"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="space-y-3">
                  {education.length > 0 ? (
                    education.map((item, index) => (
                      <div key={`${item.school || 'edu'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{item.school || 'Unknown school'}</p>
                        <p className="text-sm text-slate-600">{item.degree || 'Degree not provided'}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.major || 'Field not provided'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No education added</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Work Experience"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('workExperience')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit work experience"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="space-y-3">
                  {workExperience.length > 0 ? (
                    workExperience.map((item, index) => (
                      <div key={`${item.title || 'exp'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{item.title || 'Untitled role'}</p>
                        <p className="text-sm text-slate-600">{item.company || 'Unknown company'}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.location || 'Location not provided'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No work experience added</p>
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                title="Projects"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('projects')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit projects"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="space-y-3">
                  {projects.length > 0 ? (
                    projects.map((item, index) => (
                      <div key={`${item.name || 'project'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{item.name || 'Untitled project'}</p>
                        <p className="text-sm text-slate-600">{item.role || 'Role not provided'}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.description || 'No description provided'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No projects added</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Links"
                action={
                  <button
                    type="button"
                    onClick={() => handleDrawerOpen('links')}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    aria-label="Edit links"
                  >
                    <Pencil size={16} />
                  </button>
                }
              >
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-1 font-medium text-slate-900">
                      <img src="./linkedin.png" alt="linkedin" width={16} />
                      LinkedIn
                    </p>
                    {links.linkedin ? (
                      <a
                        href={links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {links.linkedin}
                      </a>
                    ) : (
                      <p className="break-all text-slate-600">Not provided</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-1 font-medium text-slate-900">
                      <img src="./github.png" alt="github" width={16} />
                      GitHub
                    </p>
                    {links.github ? (
                      <a
                        href={links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {links.github}
                      </a>
                    ) : (
                      <p className="break-all text-slate-600">Not provided</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-1 font-medium text-slate-900">
                      <img src="./globe.png" alt="portfolio" width={16} />
                      Portfolio
                    </p>
                    {links.portfolio ? (
                      <a
                        href={links.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {links.portfolio}
                      </a>
                    ) : (
                      <p className="break-all text-slate-600">Not provided</p>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>
          </section>
        </div>
      </main>

      {/* Drawer Components */}
      <PersonalInfoDrawer
        isOpen={openDrawer === 'personal'}
        onClose={handleDrawerClose}
        profile={profile}
        user={user}
        onSave={handleSavePersonalInfo}
        token={token}
      />

      <EmploymentInfoDrawer
        isOpen={openDrawer === 'employment'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveEmploymentInfo}
        token={token}
      />

      <SummaryDrawer
        isOpen={openDrawer === 'summary'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveSummary}
        token={token}
      />

      <JobSearchStatusDrawer
        isOpen={openDrawer === 'jobSearch'}
        onClose={handleDrawerClose}
        profile={profile}
        user={user}
        onSave={handleSaveJobSearchStatus}
        token={token}
      />

      <SkillsDrawer
        isOpen={openDrawer === 'skills'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveSkills}
        token={token}
      />

      <LanguagesDrawer
        isOpen={openDrawer === 'languages'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveLanguages}
        token={token}
      />

      <EducationDrawer
        isOpen={openDrawer === 'education'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveEducation}
        token={token}
      />

      <WorkExperienceDrawer
        isOpen={openDrawer === 'workExperience'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveWorkExperience}
        token={token}
      />

      <ProjectsDrawer
        isOpen={openDrawer === 'projects'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveProjects}
        token={token}
      />

      <LinksDrawer
        isOpen={openDrawer === 'links'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveLinks}
        token={token}
      />

      <CompensationDrawer
        isOpen={openDrawer === 'compensation'}
        onClose={handleDrawerClose}
        profile={profile}
        onSave={handleSaveCompensation}
        token={token}
      />
    </div>
  )
}

export default Dashboard