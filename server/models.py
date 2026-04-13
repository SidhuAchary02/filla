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

class OnboardingRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    skills: List[str] = Field(default=[], description="e.g. ['Python', 'React', 'FastAPI']")
    experience: Dict[str, int] = Field(default={}, description="e.g. {'Python': 3, 'React': 2}")
    notice_period: Optional[str] = Field(None, description="e.g. 'immediate', '1 month', '2 months'")
    current_ctc: Optional[float] = Field(None, description="Current cost to company in currency units")

class OnboardingResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: Optional[str]
    skills: List[str]
    experience: Dict[str, int]
    notice_period: Optional[str]
    current_ctc: Optional[float]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

# ============ USER PROFILE MODELS ============

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience: Dict[str, int]
    notice_period: Optional[str]
    current_ctc: Optional[float]
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

class CurrentUserResponse(BaseModel):
    id: str
    email: str
    user_id: str
    profile: Optional[UserProfileResponse] = None
