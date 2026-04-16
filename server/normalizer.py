"""
PROFILE NORMALIZER - Converts raw profile data to structured experience breakdown

This module calculates experience_years for specific technology areas from:
- work_experience descriptions
- skills list

This normalized data is stored in DB and used by autofill system.
"""

from typing import List, Dict, Optional
from datetime import datetime
import re


# ============================================================================
# SKILL CATEGORY MAPPINGS - Maps specific skills to experience categories
# ============================================================================

SKILL_CATEGORY_MAP = {
    # Gen AI / LLM
    "gen_ai": {
        "keywords": [
            "llm", "large language model", "gpt", "chatgpt", "gpt-3", "gpt-4",
            "generative ai", "gen ai", "rag", "retrieval augmented",
            "prompt engineering", "fine-tuning", "transformer",
            "langchain", "semantic search", "vector database",
            "openai", "anthropic", "claude", "bedrock"
        ]
    },

    # MLOps / Model Deployment
    "mlops": {
        "keywords": [
            "mlops", "ml ops", "model deployment", "ml pipeline",
            "data pipeline", "model serving", "ml monitoring",
            "mlflow", "kubeflow", "airflow", "dbt", "feature store",
            "model registry", "experiment tracking"
        ]
    },

    # AWS
    "aws": {
        "keywords": [
            "aws", "amazon web services", "ec2", "s3", "lambda",
            "rds", "dynamodb", "sqs", "sns", "cloudformation",
            "iam", "vpc", "api gateway", "elastic beanstalk",
            "redshift", "emr", "sagemaker"
        ]
    },

    # Backend / REST API
    "backend": {
        "keywords": [
            "backend", "rest api", "rest", "api", "microservices",
            "graphql", "websocket", "grpc", "message queue",
            "django", "fastapi", "flask", "express", "spring boot",
            "nodejs", "node.js", "java", "golang", "go lang",
            "server-side", "api design", "database design"
        ]
    },

    # CI/CD
    "cicd": {
        "keywords": [
            "ci/cd", "continuous integration", "continuous deployment",
            "github actions", "gitlab ci", "jenkins", "circleci",
            "terraform", "infrastructure as code", "iac",
            "docker", "kubernetes", "k8s", "containerization",
            "deployment automation", "release pipeline"
        ]
    },

    # Python
    "python": {
        "keywords": [
            "python", "django", "flask", "fastapi", "pandas",
            "numpy", "scikit-learn", "matplotlib", "seaborn",
            "jupyter", "ipython", "pytest", "sqlalchemy"
        ]
    },

    # React / Frontend
    "react": {
        "keywords": [
            "react", "reactjs", "jsx", "redux", "react hooks",
            "nextjs", "next.js", "typescript", "javascript",
            "css", "tailwind", "responsive design", "ui/ux",
            "component library", "state management"
        ]
    },

    # SQL / Databases
    "sql": {
        "keywords": [
            "sql", "postgres", "postgresql", "mysql", "mariadb",
            "database design", "query optimization", "sql performance",
            "normalization", "indexing", "transactions"
        ]
    },

    # DevOps / Infrastructure
    "devops": {
        "keywords": [
            "devops", "infrastructure", "linux", "docker", "kubernetes",
            "prometheus", "grafana", "logging", "monitoring",
            "ansible", "puppet", "chef", "saltstack"
        ]
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _normalize_text(text: str) -> str:
    """Normalize text for matching: lowercase, strip whitespace."""
    if not text:
        return ""
    return str(text).lower().strip()


def _calculate_duration_months(start_date: Optional[str], end_date: Optional[str], is_current: bool) -> int:
    """
    Calculate duration in months between start and end dates.
    
    Args:
        start_date: ISO format date string (YYYY-MM-DD)
        end_date: ISO format date string (YYYY-MM-DD) or None for current
        is_current: Whether role is currently held
    
    Returns:
        Duration in months (0 if unable to calculate)
    """
    if not start_date:
        return 0

    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    except Exception:
        return 0

    # If current role, end date is today
    if is_current or not end_date:
        end = datetime.now()
    else:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except Exception:
            return 0

    delta = end - start
    months = delta.days // 30  # Rough estimate: 30 days per month
    return max(0, months)


def _extract_years(months: int) -> float:
    """Convert months to years (fractional)."""
    if months <= 0:
        return 0.0
    return round(months / 12, 1)


def _count_skill_mentions(text: str, skill_keywords: List[str]) -> int:
    """Count how many keywords from a skill appear in text."""
    normalized_text = _normalize_text(text)
    count = 0
    for keyword in skill_keywords:
        # Use word boundaries to avoid partial matches
        if f" {keyword} " in f" {normalized_text} " or normalized_text.startswith(keyword + " ") or normalized_text.endswith(f" {keyword}"):
            count += 1
    return count


def _skill_appears_in_work_history(skill_keywords: List[str], work_experience: List[Dict]) -> bool:
    """Check if a skill appears mentioned in work_experience."""
    if not work_experience:
        return False

    combined_text = " ".join([
        _normalize_text(exp.get("title", "")) +
        " " + _normalize_text(exp.get("company", "")) +
        " " + _normalize_text(exp.get("description", ""))
        for exp in work_experience
    ])

    for keyword in skill_keywords:
        if keyword in combined_text:
            return True
    return False


# ============================================================================
# MAIN NORMALIZER FUNCTION
# ============================================================================

def normalize_profile(
    skills: Optional[List[str]] = None,
    work_experience: Optional[List[Dict]] = None,
    education: Optional[List[Dict]] = None
) -> Dict:
    """
    Normalize raw profile data into structured experience breakdown.
    
    Args:
        skills: List of skill names (e.g., ["Python", "React", "AWS"])
        work_experience: List of work experience entries with title, company, description, dates
        education: List of education entries (not currently used, but included for future)
    
    Returns:
        {
            "notice_period": "immediate",
            "experience_years": {
                "gen_ai": 0,
                "mlops": 0,
                "aws": 3,
                "backend": 2,
                "cicd": 1,
                "python": 4,
                "react": 2,
                "sql": 3,
                "devops": 1
            },
            "version": 1
        }
    
    This is stored as JSON in normalized_profile column.
    """
    
    if not skills:
        skills = []
    if not work_experience:
        work_experience = []

    # Initialize all categories to 0
    experience_years = {
        category: 0.0
        for category in SKILL_CATEGORY_MAP.keys()
    }

    # For each skill category, calculate total years
    for category, config in SKILL_CATEGORY_MAP.items():
        keywords = config.get("keywords", [])

        # Check if this skill category appears in:
        # 1. User's skills list
        # 2. Work experience descriptions

        # Match in skills list
        skill_matched = any(
            keyword in _normalize_text(" ".join(skills))
            for keyword in keywords
        )

        # If skill is in list, also check work history to calculate duration
        if skill_matched and work_experience:
            # Calculate total months spent on jobs mentioning this skill
            total_months = 0

            for exp in work_experience:
                title = _normalize_text(exp.get("title", ""))
                description = _normalize_text(exp.get("description", ""))
                company = _normalize_text(exp.get("company", ""))

                combined = f"{title} {description} {company}"

                # Count how many keywords for this category appear
                keyword_count = sum(
                    1 for keyword in keywords
                    if keyword in combined
                )

                # If skill keywords mentioned in this job, count the duration
                if keyword_count > 0:
                    is_current = exp.get("is_current", False)
                    start_date = exp.get("start_date")
                    end_date = exp.get("end_date")

                    duration_months = _calculate_duration_months(
                        start_date, end_date, is_current
                    )
                    total_months += duration_months

            # Convert to years
            years = _extract_years(total_months)
            experience_years[category] = years

    return {
        "notice_period": "immediate",  # Default, will be overridden by actual value
        "experience_years": experience_years,
        "version": 1
    }


# ============================================================================
# CONVENIENCE FUNCTIONS FOR QUICK ACCESS
# ============================================================================

def get_experience_for_skill(
    skill_name: str,
    skills: Optional[List[str]] = None,
    work_experience: Optional[List[Dict]] = None
) -> Optional[float]:
    """
    Get calculated experience (in years) for a specific skill.
    
    Args:
        skill_name: Category name (e.g., "aws", "gen_ai", "backend")
        skills: User's skills list
        work_experience: User's work experience
    
    Returns:
        Years (float) or None if not found
    """
    if skill_name not in SKILL_CATEGORY_MAP:
        return None

    normalized = normalize_profile(skills, work_experience)
    years = normalized.get("experience_years", {}).get(skill_name)

    # Don't return 0, return None for "no experience"
    if years == 0 or years == 0.0:
        return None

    return years


# ============================================================================
# TEST / DEBUG
# ============================================================================

if __name__ == "__main__":
    # Test data
    test_skills = ["Python", "React", "AWS", "SQL", "PostgreSQL"]
    test_work_experience = [
        {
            "title": "Senior Backend Engineer",
            "company": "TechCorp",
            "description": "Built REST APIs using Python and FastAPI. Deployed to AWS EC2 and Lambda.",
            "start_date": "2022-01-01",
            "end_date": None,
            "is_current": True
        },
        {
            "title": "Full Stack Developer",
            "company": "StartupXYZ",
            "description": "React frontend development and Node.js backend. Used PostgreSQL for database.",
            "start_date": "2020-06-01",
            "end_date": "2021-12-31",
            "is_current": False
        }
    ]

    result = normalize_profile(test_skills, test_work_experience)
    print("Normalized Profile:")
    print(result)
    print("\nExperience Years:")
    for skill, years in result["experience_years"].items():
        if years > 0:
            print(f"  {skill}: {years} years")
