from pydantic import BaseModel, EmailStr, Field
from typing import Dict, List, Optional
from datetime import datetime

# ============ AUTH MODELS ============

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Minimum 6 characters")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

# ============ ONBOARDING MODELS ============

class LocationModel(BaseModel):
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

class WorkExperienceModel(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None

class EducationModel(BaseModel):
    school: str
    degree: str
    major: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ProjectModel(BaseModel):
    name: str
    role: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None

class LinksModel(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class OnboardingRequest(BaseModel):
    job_search_timeline: Optional[str] = None
    location: Optional[LocationModel] = None
    resume_url: Optional[str] = None
    experience_level: Optional[str] = None
    role: Optional[str] = None
    work_experience: List[WorkExperienceModel] = Field(default=[])
    education: List[EducationModel] = Field(default=[])
    projects: List[ProjectModel] = Field(default=[])
    links: Optional[LinksModel] = None
    skills: List[str] = Field(default=[])
    languages: List[str] = Field(default=[])
    min_salary: Optional[float] = None

# ============ PERSONAL INFO MODELS ============
class PersonalInfoRequest(BaseModel):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    suffix_name: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[str] = None  # ISO format: YYYY-MM-DD
    address: Optional[str] = None
    address_2: Optional[str] = None
    address_3: Optional[str] = None
    job_search_timeline: Optional[str] = None
    location: Optional[LocationModel] = None
    resume_url: Optional[str] = None
    current_ctc: Optional[float] = None
    min_salary: Optional[float] = None
    notice_period: Optional[str] = None
    skills: Optional[List[str]] = None  # List of skill names
    languages: Optional[List[str]] = None  # List of language names
    education: Optional[List[dict]] = None  # List of education objects
    work_experience: Optional[List[dict]] = None  # List of work experience objects
    projects: Optional[List[dict]] = None  # List of project objects
    links: Optional[LinksModel] = None  # Social and portfolio links
    ethnicity: Optional[str] = None
    work_authorized_us: Optional[str] = None
    work_authorized_canada: Optional[str] = None
    work_authorized_uk: Optional[str] = None
    sponsorship_required: Optional[str] = None
    disability: Optional[str] = None
    lgbtq: Optional[str] = None
    gender: Optional[str] = None
    veteran: Optional[str] = None

class OnboardingResponse(BaseModel):
    id: str
    user_id: str
    job_search_timeline: Optional[str]
    location: Optional[dict]
    resume_url: Optional[str]
    current_ctc: Optional[float] = None
    min_salary: Optional[float] = None
    notice_period: Optional[str] = None
    # Personal Information
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    suffix_name: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[str] = None
    address: Optional[str] = None
    address_2: Optional[str] = None
    address_3: Optional[str] = None
    # Employment Information
    ethnicity: Optional[str] = None
    work_authorized_us: Optional[str] = None
    work_authorized_canada: Optional[str] = None
    work_authorized_uk: Optional[str] = None
    sponsorship_required: Optional[str] = None
    disability: Optional[str] = None
    lgbtq: Optional[str] = None
    gender: Optional[str] = None
    veteran: Optional[str] = None
    # Rest of profile info
    experience_level: Optional[str]
    role: Optional[str]
    work_experience: List[dict]
    education: List[dict]
    projects: List[dict]
    links: Optional[dict]
    skills: List[str]
    languages: List[str]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ============ USER PROFILE MODELS ============

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    job_search_timeline: Optional[str]
    location: Optional[dict]
    resume_url: Optional[str]
    current_ctc: Optional[float] = None
    min_salary: Optional[float] = None
    notice_period: Optional[str] = None
    # Personal Information
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_name: Optional[str] = None
    suffix_name: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[str] = None
    address: Optional[str] = None
    address_2: Optional[str] = None
    address_3: Optional[str] = None
    # Employment Information
    ethnicity: Optional[str] = None
    work_authorized_us: Optional[str] = None
    work_authorized_canada: Optional[str] = None
    work_authorized_uk: Optional[str] = None
    sponsorship_required: Optional[str] = None
    disability: Optional[str] = None
    lgbtq: Optional[str] = None
    gender: Optional[str] = None
    veteran: Optional[str] = None
    # Rest of profile
    experience_level: Optional[str]
    role: Optional[str]
    work_experience: List[dict]
    education: List[dict]
    projects: List[dict]
    links: Optional[dict]
    skills: List[str]
    languages: List[str]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class CurrentUserResponse(BaseModel):
    id: str
    email: str
    user_id: str
    profile: Optional[UserProfileResponse] = None
