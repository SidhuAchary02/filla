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

class OnboardingResponse(BaseModel):
    id: str
    user_id: str
    job_search_timeline: Optional[str]
    location: Optional[dict]
    resume_url: Optional[str]
    experience_level: Optional[str]
    role: Optional[str]
    work_experience: List[dict]
    education: List[dict]
    projects: List[dict]
    links: Optional[dict]
    skills: List[str]
    languages: List[str]
    min_salary: Optional[float]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

# ============ USER PROFILE MODELS ============

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    job_search_timeline: Optional[str]
    location: Optional[dict]
    resume_url: Optional[str]
    experience_level: Optional[str]
    role: Optional[str]
    work_experience: List[dict]
    education: List[dict]
    projects: List[dict]
    links: Optional[dict]
    skills: List[str]
    languages: List[str]
    min_salary: Optional[float]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

class CurrentUserResponse(BaseModel):
    id: str
    email: str
    user_id: str
    profile: Optional[UserProfileResponse] = None
