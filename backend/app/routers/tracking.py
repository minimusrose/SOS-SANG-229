from fastapi import APIRouter

router = APIRouter(prefix="/requests", tags=["tracking"])


@router.get("/")
def list_requests_stub():
    """Placeholder live-tracking list. Fictional IDs only when added later."""
    return {"implemented": False, "items": []}
