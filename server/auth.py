from fastapi import APIRouter, HTTPException, status, Header
from models import SignupRequest, LoginRequest, AuthResponse, CurrentUserResponse, UserProfileResponse
from database import supabase_client
import json

router = APIRouter(prefix="/api/auth", tags=["auth"])


def ensure_profile_exists(user_id: str):
    # Explicitly select all columns including personal info fields and compensation fields
    response = supabase_client.table("user_profiles").select(
        "id,user_id,job_search_timeline,location,resume_url,"
        "current_ctc,min_salary,notice_period,"
        "first_name,middle_name,last_name,preferred_name,suffix_name,"
        "phone,birthday,address,address_2,address_3,"
        "experience_level,role,work_experience,education,projects,"
        "links,skills,languages,onboarding_completed,"
        "ethnicity,work_authorized_us,work_authorized_canada,work_authorized_uk,"
        "sponsorship_required,disability,lgbtq,gender,veteran,"
        "created_at,updated_at"
    ).eq("user_id", user_id).limit(1).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]

    insert_response = supabase_client.table("user_profiles").insert({
        "user_id": user_id,
        "job_search_timeline": None,
        "location": None,
        "resume_url": None,
        "current_ctc": None,
        "min_salary": None,
        "notice_period": None,
        "experience_level": None,
        "role": None,
        "work_experience": [],
        "education": [],
        "projects": [],
        "links": None,
        "skills": [],
        "languages": [],
        "onboarding_completed": False,
    }).execute()

    if insert_response.data and len(insert_response.data) > 0:
        return insert_response.data[0]

    response = supabase_client.table("user_profiles").select(
        "id,user_id,job_search_timeline,location,resume_url,"
        "current_ctc,min_salary,notice_period,"
        "first_name,middle_name,last_name,preferred_name,suffix_name,"
        "phone,birthday,address,address_2,address_3,"
        "experience_level,role,work_experience,education,projects,"
        "links,skills,languages,onboarding_completed,"
        "ethnicity,work_authorized_us,work_authorized_canada,work_authorized_uk,"
        "sponsorship_required,disability,lgbtq,gender,veteran,"
        "created_at,updated_at"
    ).eq("user_id", user_id).limit(1).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to initialize user profile"
    )

# ============ SIGNUP ============
@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Create new user with Supabase Auth
    Returns JWT token
    """
    try:
        # Create user in Supabase Auth
        # skips email confirmation for development (auto-confirm)
        response = supabase_client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {},
            }
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Auto-confirm user for development (use admin/service role)
        try:
            supabase_client.auth.admin.update_user_by_id(
                response.user.id,
                {"email_confirm": True}
            )
        except Exception as e:
            print(f"Warning: Could not auto-confirm user: {e}")
            # Not critical, continue
        
        # Create empty profile entry
        try:
            supabase_client.table("user_profiles").insert({
                "user_id": response.user.id,
                "job_search_timeline": None,
                "location": None,
                "resume_url": None,
                "experience_level": None,
                "role": None,
                "work_experience": [],
                "education": [],
                "projects": [],
                "links": None,
                "skills": [],
                "languages": [],
                "min_salary": None,
                "onboarding_completed": False
            }).execute()
        except Exception as e:
            print(f"Warning: Could not create profile: {e}")
            # Profile creation is not critical, continue
        
        return AuthResponse(
            access_token=response.session.access_token if response.session else "",
            token_type="bearer",
            user_id=response.user.id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ============ LOGIN ============
@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login user with email and password
    Returns JWT token
    """
    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            user_id=response.user.id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

# ============ GET CURRENT USER ============
@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(authorization: str = Header(None)):
    """
    Get current user info from JWT token
    Header: Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify token with Supabase
        user = supabase_client.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        profile_data = ensure_profile_exists(user.user.id)
        profile = UserProfileResponse(
            id=profile_data["id"],
            user_id=profile_data["user_id"],
            job_search_timeline=profile_data.get("job_search_timeline"),
            location=profile_data.get("location"),
            resume_url=profile_data.get("resume_url"),
            current_ctc=profile_data.get("current_ctc"),
            min_salary=profile_data.get("min_salary"),
            notice_period=profile_data.get("notice_period"),
            first_name=profile_data.get("first_name"),
            middle_name=profile_data.get("middle_name"),
            last_name=profile_data.get("last_name"),
            preferred_name=profile_data.get("preferred_name"),
            suffix_name=profile_data.get("suffix_name"),
            phone=profile_data.get("phone"),
            birthday=profile_data.get("birthday"),
            address=profile_data.get("address"),
            address_2=profile_data.get("address_2"),
            address_3=profile_data.get("address_3"),
            ethnicity=profile_data.get("ethnicity"),
            work_authorized_us=profile_data.get("work_authorized_us"),
            work_authorized_canada=profile_data.get("work_authorized_canada"),
            work_authorized_uk=profile_data.get("work_authorized_uk"),
            sponsorship_required=profile_data.get("sponsorship_required"),
            disability=profile_data.get("disability"),
            lgbtq=profile_data.get("lgbtq"),
            gender=profile_data.get("gender"),
            veteran=profile_data.get("veteran"),
            experience_level=profile_data.get("experience_level"),
            role=profile_data.get("role"),
            work_experience=profile_data.get("work_experience") or [],
            education=profile_data.get("education") or [],
            projects=profile_data.get("projects") or [],
            links=profile_data.get("links"),
            skills=profile_data.get("skills") or [],
            languages=profile_data.get("languages") or [],
            onboarding_completed=profile_data.get("onboarding_completed", False),
            created_at=profile_data["created_at"],
            updated_at=profile_data["updated_at"],
        )
        
        return CurrentUserResponse(
            id=user.user.id,
            email=user.user.email,
            user_id=user.user.id,
            profile=profile
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# ============ LOGOUT ============
@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """
    Logout user (token invalidation on frontend)
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        supabase_client.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        return {"message": "Logout completed"}
