from fastapi import APIRouter, HTTPException, status, Header, Query, Response
from models import OnboardingRequest, OnboardingResponse, PersonalInfoRequest
from database import supabase_client
from datetime import datetime
from normalizer import normalize_profile
import json
import mimetypes
import httpx

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
        current_ctc=profile.get("current_ctc"),
        min_salary=profile.get("min_salary"),
        notice_period=profile.get("notice_period"),
        first_name=profile.get("first_name"),
        middle_name=profile.get("middle_name"),
        last_name=profile.get("last_name"),
        preferred_name=profile.get("preferred_name"),
        suffix_name=profile.get("suffix_name"),
        phone=profile.get("phone"),
        phone_country_iso=profile.get("phone_country_iso"),
        phone_country_code=profile.get("phone_country_code"),
        phone_number=profile.get("phone_number"),
        birthday=profile.get("birthday"),
        address=profile.get("address"),
        nationality=profile.get("nationality"),
        preferred_location=profile.get("preferred_location"),
        preferred_job_type=profile.get("preferred_job_type"),
        ethnicity=profile.get("ethnicity"),
        work_authorized_us=profile.get("work_authorized_us"),
        work_authorized_canada=profile.get("work_authorized_canada"),
        work_authorized_uk=profile.get("work_authorized_uk"),
        sponsorship_required=profile.get("sponsorship_required"),
        disability=profile.get("disability"),
        lgbtq=profile.get("lgbtq"),
        gender=profile.get("gender"),
        veteran=profile.get("veteran"),
        experience_level=profile.get("experience_level"),
        role=profile.get("role"),
        work_experience=profile.get("work_experience") or [],
        education=profile.get("education") or [],
        projects=profile.get("projects") or [],
        links=profile.get("links"),
        skills=profile.get("skills") or [],
        languages=profile.get("languages") or [],
        onboarding_completed=profile.get("onboarding_completed", False),
        created_at=profile["created_at"],
        updated_at=profile["updated_at"]
    )


def _get_profile_by_user_id(user_id: str):
    # Explicitly select all columns including personal info and employment info fields
    response = supabase_client.table("user_profiles").select(
        "id,user_id,job_search_timeline,location,resume_url,"
        "current_ctc,min_salary,notice_period,"
        "first_name,middle_name,last_name,preferred_name,suffix_name,"
        "phone,phone_country_iso,phone_country_code,phone_number,birthday,address,nationality,preferred_location,preferred_job_type,"
        "experience_level,role,work_experience,education,projects,"
        "links,skills,languages,onboarding_completed,"
        "ethnicity,work_authorized_us,work_authorized_canada,work_authorized_uk,"
        "sponsorship_required,disability,lgbtq,gender,veteran,"
        "created_at,updated_at"
    ).eq("user_id", user_id).limit(1).execute()
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


def _compute_normalized_profile(profile: dict) -> dict:
    """
    Compute normalized_profile from work_experience and skills.
    
    This creates experience_years breakdown like:
    {
      "notice_period": "immediate",
      "experience_years": {
        "gen_ai": 0,
        "mlops": 0,
        "aws": 3,
        "backend": 2,
        ...
      }
    }
    """
    raw_skills = profile.get("skills") or []
    skills = []
    for s in raw_skills:
        if isinstance(s, dict):
            name = s.get("name") or s.get("normalized") or ""
            if name:
                skills.append(str(name))
        elif s is not None:
            skills.append(str(s))

    work_experience = profile.get("work_experience") or []
    notice_period = profile.get("notice_period") or "immediate"

    normalized = normalize_profile(skills, work_experience)
    normalized["notice_period"] = notice_period
    return normalized


def _infer_media_type_from_name(file_name: str) -> str:
    guessed, _ = mimetypes.guess_type(file_name or "")
    return guessed or "application/octet-stream"


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
            "skills": [_to_dict(skill) for skill in request.skills] if request.skills else [],
            "languages": request.languages,
            "current_ctc": request.current_ctc,
            "min_salary": request.min_salary,
            "onboarding_completed": True,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Compute normalized_profile from work_experience + skills
        # Extract skill names for normalization
        skills_for_normalization = [
            skill.get("name") if isinstance(skill, dict) else skill.name 
            for skill in request.skills
        ] if request.skills else []
        
        profile_for_normalization = {
            "skills": skills_for_normalization,
            "work_experience": payload["work_experience"],
            "notice_period": request.notice_period if hasattr(request, 'notice_period') and request.notice_period else "immediate"
        }
        payload["normalized_profile"] = _compute_normalized_profile(profile_for_normalization)

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


# ============ UPDATE PERSONAL INFO ============
@router.post("/personal-info", response_model=OnboardingResponse)
async def update_personal_info(
    request: PersonalInfoRequest,
    authorization: str = Header(None)
):
    """Update user's personal information."""
    user_id = verify_token(authorization)

    try:
        _ensure_profile_exists(user_id)

        # Build payload with only provided fields
        payload = {
            "updated_at": datetime.utcnow().isoformat()
        }

        # Add fields that were provided (not None)
        if request.first_name is not None:
            payload["first_name"] = request.first_name
        if request.middle_name is not None:
            payload["middle_name"] = request.middle_name
        if request.last_name is not None:
            payload["last_name"] = request.last_name
        if request.preferred_name is not None:
            payload["preferred_name"] = request.preferred_name
        if request.suffix_name is not None:
            payload["suffix_name"] = request.suffix_name
        if request.phone is not None:
            payload["phone"] = request.phone
        if request.phone_country_iso is not None:
            payload["phone_country_iso"] = request.phone_country_iso
        if request.phone_country_code is not None:
            payload["phone_country_code"] = request.phone_country_code
        if request.phone_number is not None:
            payload["phone_number"] = request.phone_number
        if request.birthday is not None:
            payload["birthday"] = request.birthday
        if request.address is not None:
            payload["address"] = request.address
        if request.nationality is not None:
            payload["nationality"] = request.nationality
        if request.preferred_location is not None:
            payload["preferred_location"] = request.preferred_location
        if request.preferred_job_type is not None:
            payload["preferred_job_type"] = request.preferred_job_type
        if request.job_search_timeline is not None:
            payload["job_search_timeline"] = request.job_search_timeline
        if request.location is not None:
            payload["location"] = _to_dict(request.location)
        if request.skills is not None:
            # Convert skill objects to dicts for storage
            payload["skills"] = [_to_dict(skill) if hasattr(skill, 'model_dump') or hasattr(skill, 'dict') else skill for skill in request.skills]
        if request.languages is not None:
            payload["languages"] = request.languages
        if request.education is not None:
            payload["education"] = request.education
        if request.work_experience is not None:
            payload["work_experience"] = request.work_experience
        if request.projects is not None:
            payload["projects"] = request.projects
        if request.links is not None:
            payload["links"] = _to_dict(request.links)
        if request.ethnicity is not None:
            payload["ethnicity"] = request.ethnicity
        if request.work_authorized_us is not None:
            payload["work_authorized_us"] = request.work_authorized_us
        if request.work_authorized_canada is not None:
            payload["work_authorized_canada"] = request.work_authorized_canada
        if request.work_authorized_uk is not None:
            payload["work_authorized_uk"] = request.work_authorized_uk
        if request.sponsorship_required is not None:
            payload["sponsorship_required"] = request.sponsorship_required
        if request.disability is not None:
            payload["disability"] = request.disability
        if request.lgbtq is not None:
            payload["lgbtq"] = request.lgbtq
        if request.gender is not None:
            payload["gender"] = request.gender
        if request.veteran is not None:
            payload["veteran"] = request.veteran
        if request.resume_url is not None:
            payload["resume_url"] = request.resume_url
        if request.current_ctc is not None:
            payload["current_ctc"] = request.current_ctc
        if request.min_salary is not None:
            payload["min_salary"] = request.min_salary
        if request.notice_period is not None:
            payload["notice_period"] = request.notice_period
        
        # Compute normalized_profile if work_experience or skills were updated
        if request.work_experience is not None or request.skills is not None:
            # Get current profile to fill in any missing fields
            current = _get_profile_by_user_id(user_id)
            
            # Extract skill names from skill objects for normalization
            skills_for_normalization = []
            if request.skills is not None:
                skills_for_normalization = [
                    skill.get("name") if isinstance(skill, dict) else skill.name 
                    for skill in request.skills
                ]
            else:
                current_skills = current.get("skills") or []
                skills_for_normalization = [
                    skill.get("name") if isinstance(skill, dict) else skill 
                    for skill in current_skills
                ]
            
            merged_profile = {
                "skills": skills_for_normalization,
                "work_experience": request.work_experience if request.work_experience is not None else (current.get("work_experience") or []),
                "notice_period": request.notice_period if request.notice_period is not None else (current.get("notice_period") or "immediate")
            }
            payload["normalized_profile"] = _compute_normalized_profile(merged_profile)
        
        try:
            # Try update via Supabase SDK
            update_response = supabase_client.table("user_profiles").update(payload).eq("user_id", user_id).execute()
            print(f"📡 Supabase update via SDK: success")
            print(f"📡 Response data count: {len(update_response.data) if hasattr(update_response, 'data') and update_response.data else 0}")
        except Exception as update_err:
            print(f"❌ SDK Update error: {update_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update profile: {str(update_err)}"
            )
        
        # Fetch fresh profile after update using explicit SELECT
        profile = _get_profile_by_user_id(user_id)
        
        if profile:
            print(f"✅ Profile after update:")
            print(f"   - job_search_timeline in DB: {profile.get('job_search_timeline')}")
            print(f"   - Expected: {payload.get('job_search_timeline', 'N/A')}")
            print(f"   - Match: {profile.get('job_search_timeline') == payload.get('job_search_timeline')}")
            if request.skills is not None:
                print(f"   - skills in DB: {profile.get('skills')}")
                print(f"   - Expected skills: {payload.get('skills', 'N/A')}")
                print(f"   - Skills type in DB: {type(profile.get('skills'))}")
                print(f"   - Skills type expected: {type(payload.get('skills'))}")
                print(f"   - Skills match: {profile.get('skills') == payload.get('skills')}")
            if request.languages is not None:
                print(f"   - languages in DB: {profile.get('languages')}")
                print(f"   - Expected languages: {payload.get('languages', 'N/A')}")
                print(f"   - Languages type in DB: {type(profile.get('languages'))}")
                print(f"   - Languages type expected: {type(payload.get('languages'))}")
                print(f"   - Languages match: {profile.get('languages') == payload.get('languages')}")
            if request.education is not None:
                print(f"   - education in DB: {profile.get('education')}")
                print(f"   - Expected education: {payload.get('education', 'N/A')}")
                print(f"   - Education length: {len(profile.get('education', []))}")
                print(f"   - Education match: {profile.get('education') == payload.get('education')}")
            if request.work_experience is not None:
                print(f"   - work_experience in DB: {profile.get('work_experience')}")
                print(f"   - Expected work_experience: {payload.get('work_experience', 'N/A')}")
                print(f"   - Work experience length: {len(profile.get('work_experience', []))}")
                print(f"   - Work experience match: {profile.get('work_experience') == payload.get('work_experience')}")
            if request.projects is not None:
                print(f"   - projects in DB: {profile.get('projects')}")
                print(f"   - Expected projects: {payload.get('projects', 'N/A')}")
                print(f"   - Projects length: {len(profile.get('projects', []))}")
                print(f"   - Projects match: {profile.get('projects') == payload.get('projects')}")
            if request.links is not None:
                print(f"   - links in DB: {profile.get('links')}")
                print(f"   - Expected links: {payload.get('links', 'N/A')}")
                print(f"   - Links match: {profile.get('links') == payload.get('links')}")
            if request.ethnicity is not None:
                print(f"   - ethnicity in DB: {profile.get('ethnicity')}")
                print(f"   - Expected ethnicity: {payload.get('ethnicity', 'N/A')}")
                print(f"   - Ethnicity match: {profile.get('ethnicity') == payload.get('ethnicity')}")
            if request.work_authorized_us is not None:
                print(f"   - work_authorized_us in DB: {profile.get('work_authorized_us')}")
                print(f"   - Expected: {payload.get('work_authorized_us', 'N/A')}")
            if request.work_authorized_canada is not None:
                print(f"   - work_authorized_canada in DB: {profile.get('work_authorized_canada')}")
                print(f"   - Expected: {payload.get('work_authorized_canada', 'N/A')}")
            if request.work_authorized_uk is not None:
                print(f"   - work_authorized_uk in DB: {profile.get('work_authorized_uk')}")
                print(f"   - Expected: {payload.get('work_authorized_uk', 'N/A')}")
            if request.sponsorship_required is not None:
                print(f"   - sponsorship_required in DB: {profile.get('sponsorship_required')}")
                print(f"   - Expected: {payload.get('sponsorship_required', 'N/A')}")
            if request.disability is not None:
                print(f"   - disability in DB: {profile.get('disability')}")
                print(f"   - Expected: {payload.get('disability', 'N/A')}")
            if request.lgbtq is not None:
                print(f"   - lgbtq in DB: {profile.get('lgbtq')}")
                print(f"   - Expected: {payload.get('lgbtq', 'N/A')}")
            if request.gender is not None:
                print(f"   - gender in DB: {profile.get('gender')}")
                print(f"   - Expected: {payload.get('gender', 'N/A')}")
            if request.veteran is not None:
                print(f"   - veteran in DB: {profile.get('veteran')}")
                print(f"   - Expected: {payload.get('veteran', 'N/A')}")
        else:
            print(f"❌ NO PROFILE FOUND after update!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile fetch after update failed"
            )

        return _serialize_profile(profile)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update personal info: {str(e)}"
        )


# ============ GET AUTOFILL DATA (FOR EXTENSION) ============
@router.get("/extension/autofill-data")
async def get_autofill_data(authorization: str = Header(None)):
    """Get profile data formatted for extension autofill."""
    user_id = verify_token(authorization)

    try:
        profile = _ensure_profile_exists(user_id)
        
        # Get email from auth user
        user_email = None
        try:
            token = authorization.replace("Bearer ", "")
            auth_user = supabase_client.auth.get_user(token)
            if auth_user and auth_user.user:
                user_email = getattr(auth_user.user, 'email', None)
        except Exception as e:
            print(f"[DEBUG] Email retrieval failed: {str(e)}")
            user_email = None

        # Get normalized_profile with computed experience_years
        normalized = profile.get("normalized_profile") or {}
        if not normalized:
            # Compute on-the-fly if not in DB
            normalized = _compute_normalized_profile(profile)

        # Calculate total experience in years from work_experience
        total_experience_years = 0
        work_exp = profile.get("work_experience") or []
        if work_exp:
            total_experience_years = len(work_exp)  # Simple count, or sum duration if available

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
            # Extension autofill keys
            "full_name": profile.get("full_name"),
            "email": user_email,  # Use retrieved auth email
            "phone": profile.get("phone"),
            "first_name": profile.get("first_name"),
            "last_name": profile.get("last_name"),
            "notice_period": normalized.get("notice_period") or profile.get("notice_period"),
            "current_ctc": profile.get("current_ctc"),
            "expected_ctc": profile.get("expected_ctc") or profile.get("min_salary"),
            "birthday": profile.get("birthday"),
            "gender": profile.get("gender"),
            "total_experience_years": total_experience_years,
            # KEY: Computed experience breakdown for autofill questions
            "normalized_profile": normalized
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


@router.get("/extension/resume-file")
async def get_extension_resume_file(
    resume_ref: str = Query(..., min_length=1),
    authorization: str = Header(None),
):
    """Return raw resume bytes for extension uploads (auth required)."""
    user_id = verify_token(authorization)

    profile = _ensure_profile_exists(user_id)
    stored_ref = str(profile.get("resume_url") or "").strip()
    incoming_ref = str(resume_ref or "").strip()

    # Prevent downloading arbitrary URLs/paths through this endpoint.
    if not stored_ref or incoming_ref != stored_ref:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resume reference does not match the user profile",
        )

    try:
        lower = incoming_ref.lower()

        if lower.startswith("http://") or lower.startswith("https://"):
            async with httpx.AsyncClient(follow_redirects=True, timeout=25.0) as client:
                resp = await client.get(incoming_ref)

            if resp.status_code >= 400:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Resume URL fetch failed: HTTP {resp.status_code}",
                )

            file_name = incoming_ref.split("?")[0].rstrip("/").split("/")[-1] or "resume.pdf"
            content_type = resp.headers.get("content-type") or _infer_media_type_from_name(file_name)
            content_disposition = resp.headers.get("content-disposition") or f'attachment; filename="{file_name}"'

            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Content-Disposition": content_disposition},
            )

        storage_path = incoming_ref.lstrip("/")
        if not storage_path.startswith(f"{user_id}/"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Resume storage path does not belong to the authenticated user",
            )

        file_name = storage_path.split("/")[-1] or "resume.pdf"
        content_type = _infer_media_type_from_name(file_name)
        file_bytes = supabase_client.storage.from_("resumes").download(storage_path)

        return Response(
            content=file_bytes,
            media_type=content_type,
            headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load resume file: {str(e)}",
        )
