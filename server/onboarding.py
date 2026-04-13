from fastapi import APIRouter, HTTPException, status, Header
from models import OnboardingRequest, OnboardingResponse
from database import supabase_client
from datetime import datetime

router = APIRouter(prefix="/api", tags=["onboarding"])

def verify_token(authorization: str) -> str:
    """Verify JWT token and return user_id"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = supabase_client.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# ============ SUBMIT ONBOARDING ============
@router.post("/onboarding", response_model=OnboardingResponse)
async def submit_onboarding(
    request: OnboardingRequest,
    authorization: str = Header(None)
):
    """
    Submit onboarding form data
    Stores user profile in PostgreSQL
    """
    # Verify token
    user_id = verify_token(authorization)
    
    try:
        # Update user profile
        response = supabase_client.table("user_profiles").update({
            "full_name": request.full_name,
            "phone": request.phone,
            "skills": request.skills,
            "experience": request.experience,
            "notice_period": request.notice_period,
            "current_ctc": request.current_ctc,
            "onboarding_completed": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile = response.data[0]
        
        return OnboardingResponse(
            id=profile["id"],
            user_id=profile["user_id"],
            full_name=profile["full_name"],
            phone=profile["phone"],
            skills=profile["skills"] or [],
            experience=profile["experience"] or {},
            notice_period=profile["notice_period"],
            current_ctc=profile["current_ctc"],
            onboarding_completed=profile["onboarding_completed"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save onboarding data: {str(e)}"
        )

# ============ GET ONBOARDING STATUS ============
@router.get("/onboarding/status")
async def get_onboarding_status(authorization: str = Header(None)):
    """
    Check if user has completed onboarding
    """
    user_id = verify_token(authorization)
    
    try:
        response = supabase_client.table("user_profiles").select("onboarding_completed").eq("user_id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "user_id": user_id,
            "onboarding_completed": response.data[0]["onboarding_completed"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch onboarding status"
        )

# ============ GET USER PROFILE ============
@router.get("/profile", response_model=OnboardingResponse)
async def get_user_profile(authorization: str = Header(None)):
    """
    Get user's profile data
    """
    user_id = verify_token(authorization)
    
    try:
        response = supabase_client.table("user_profiles").select("*").eq("user_id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile = response.data[0]
        
        return OnboardingResponse(
            id=profile["id"],
            user_id=profile["user_id"],
            full_name=profile["full_name"],
            phone=profile["phone"],
            skills=profile["skills"] or [],
            experience=profile["experience"] or {},
            notice_period=profile["notice_period"],
            current_ctc=profile["current_ctc"],
            onboarding_completed=profile["onboarding_completed"],
            created_at=profile["created_at"],
            updated_at=profile["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )

# ============ GET AUTOFILL DATA (FOR EXTENSION) ============
@router.get("/extension/autofill-data")
async def get_autofill_data(authorization: str = Header(None)):
    """
    Get profile data formatted for extension autofill
    Used by Chrome extension to populate forms
    
    Returns flat key-value pairs for easy matching
    """
    user_id = verify_token(authorization)
    
    try:
        response = supabase_client.table("user_profiles").select("*").eq("user_id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile = response.data[0]
        
        # Format data for autofill (flat key-value structure)
        autofill_data = {
            "full_name": profile["full_name"],
            "first_name": (profile["full_name"] or "").split()[0] if profile["full_name"] else "",
            "last_name": " ".join((profile["full_name"] or "").split()[1:]) if profile["full_name"] and len((profile["full_name"] or "").split()) > 1 else "",
            "phone": profile["phone"],
            "email": profile["user_id"],  # Note: fetch actual email from auth.users if needed
            "skills": profile["skills"] or [],
            "experience": profile["experience"] or {},
            "notice_period": profile["notice_period"],
            "current_ctc": profile["current_ctc"],
        }
        
        return {
            "user_id": user_id,
            "profile": autofill_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch autofill data"
        )
