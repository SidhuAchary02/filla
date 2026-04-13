from fastapi import APIRouter, HTTPException, status, Header
from models import SignupRequest, LoginRequest, AuthResponse, CurrentUserResponse, UserProfileResponse
from database import supabase_client
import json

router = APIRouter(prefix="/api/auth", tags=["auth"])

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
                "full_name": "",
                "phone": None,
                "skills": [],
                "experience": {},
                "notice_period": None,
                "current_ctc": None,
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
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Fetch profile
        profile_response = supabase_client.table("user_profiles").select("*").eq("user_id", user.user.id).execute()
        
        profile = None
        if profile_response.data and len(profile_response.data) > 0:
            profile_data = profile_response.data[0]
            profile = UserProfileResponse(
                id=profile_data["id"],
                user_id=profile_data["user_id"],
                full_name=profile_data["full_name"],
                phone=profile_data["phone"],
                skills=profile_data["skills"] or [],
                experience=profile_data["experience"] or {},
                notice_period=profile_data["notice_period"],
                current_ctc=profile_data["current_ctc"],
                onboarding_completed=profile_data["onboarding_completed"],
                created_at=profile_data["created_at"],
                updated_at=profile_data["updated_at"]
            )
        
        return CurrentUserResponse(
            id=user.user.id,
            email=user.user.email,
            user_id=user.user.id,
            profile=profile
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
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
