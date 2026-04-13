from fastapi import APIRouter, HTTPException, status, Header
from models import OnboardingRequest, OnboardingResponse
from database import supabase_client
from datetime import datetime

router = APIRouter(prefix="/api", tags=["onboarding"])


def verify_token(authorization: str) -> str:
    """Verify JWT token and return user_id."""
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
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def _to_dict(model_obj):
    if model_obj is None:
        return None
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    return model_obj.dict()


def _serialize_profile(profile: dict) -> OnboardingResponse:
    return OnboardingResponse(
        id=profile["id"],
        user_id=profile["user_id"],
        job_search_timeline=profile.get("job_search_timeline"),
        location=profile.get("location"),
        resume_url=profile.get("resume_url"),
        experience_level=profile.get("experience_level"),
        role=profile.get("role"),
        work_experience=profile.get("work_experience") or [],
        education=profile.get("education") or [],
        projects=profile.get("projects") or [],
        links=profile.get("links"),
        skills=profile.get("skills") or [],
        languages=profile.get("languages") or [],
        min_salary=profile.get("min_salary"),
        onboarding_completed=profile.get("onboarding_completed", False),
        created_at=profile["created_at"],
        updated_at=profile["updated_at"]
    )


def _get_profile_by_user_id(user_id: str):
    response = supabase_client.table("user_profiles").select("*").eq("user_id", user_id).limit(1).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def _ensure_profile_exists(user_id: str):
    profile = _get_profile_by_user_id(user_id)
    if profile:
        return profile

    create_response = supabase_client.table("user_profiles").insert({
        "user_id": user_id,
        "onboarding_completed": False,
        "skills": [],
        "languages": [],
        "work_experience": [],
        "education": [],
        "projects": []
    }).execute()

    if create_response.data and len(create_response.data) > 0:
        return create_response.data[0]

    profile = _get_profile_by_user_id(user_id)
    if profile:
        return profile

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to initialize user profile"
    )


# ============ SUBMIT ONBOARDING ============
@router.post("/onboarding", response_model=OnboardingResponse)
async def submit_onboarding(
    request: OnboardingRequest,
    authorization: str = Header(None)
):
    """Submit complete onboarding form data."""
    user_id = verify_token(authorization)

    try:
        _ensure_profile_exists(user_id)

        payload = {
            "job_search_timeline": request.job_search_timeline,
            "location": _to_dict(request.location),
            "resume_url": request.resume_url,
            "experience_level": request.experience_level,
            "role": request.role,
            "work_experience": [_to_dict(exp) for exp in request.work_experience],
            "education": [_to_dict(edu) for edu in request.education],
            "projects": [_to_dict(proj) for proj in request.projects],
            "links": _to_dict(request.links),
            "skills": request.skills,
            "languages": request.languages,
            "min_salary": request.min_salary,
            "onboarding_completed": True,
            "updated_at": datetime.utcnow().isoformat()
        }

        supabase_client.table("user_profiles").update(payload).eq("user_id", user_id).execute()
        profile = _get_profile_by_user_id(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile update failed"
            )

        return _serialize_profile(profile)

    except HTTPException:
        raise
    except Exception as e:
        error_text = str(e)
        if "PGRST204" in error_text and "Could not find" in error_text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Database schema is outdated. Run server/DATABASE_SCHEMA.sql in Supabase SQL Editor "
                    "to add missing columns (e.g. education, projects, links, work_experience)."
                )
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save onboarding data: {error_text}"
        )


# ============ GET ONBOARDING STATUS ============
@router.get("/onboarding/status")
async def get_onboarding_status(authorization: str = Header(None)):
    """Check if user has completed onboarding."""
    user_id = verify_token(authorization)

    try:
        profile = _ensure_profile_exists(user_id)
        return {
            "user_id": user_id,
            "onboarding_completed": profile.get("onboarding_completed", False)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch onboarding status: {str(e)}"
        )


# ============ GET USER PROFILE ============
@router.get("/profile", response_model=OnboardingResponse)
async def get_user_profile(authorization: str = Header(None)):
    """Get user's complete profile data."""
    user_id = verify_token(authorization)

    try:
        profile = _ensure_profile_exists(user_id)
        return _serialize_profile(profile)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )


# ============ GET AUTOFILL DATA (FOR EXTENSION) ============
@router.get("/extension/autofill-data")
async def get_autofill_data(authorization: str = Header(None)):
    """Get profile data formatted for extension autofill."""
    user_id = verify_token(authorization)

    try:
        profile = _ensure_profile_exists(user_id)

        autofill_data = {
            "role": profile.get("role"),
            "job_search_timeline": profile.get("job_search_timeline"),
            "experience_level": profile.get("experience_level"),
            "skills": profile.get("skills") or [],
            "languages": profile.get("languages") or [],
            "work_experience": profile.get("work_experience") or [],
            "education": profile.get("education") or [],
            "projects": profile.get("projects") or [],
            "links": profile.get("links") or {},
            "location": profile.get("location") or {},
            "resume_url": profile.get("resume_url"),
            "min_salary": profile.get("min_salary"),
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
            detail=f"Failed to fetch autofill data: {str(e)}"
        )
