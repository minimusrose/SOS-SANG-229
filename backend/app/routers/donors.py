from fastapi import APIRouter

router = APIRouter(prefix="/donors", tags=["donors"])


@router.get("/")
def list_donors_stub():
    """Placeholder. No donor records are stored or returned."""
    return {"implemented": False, "items": []}
