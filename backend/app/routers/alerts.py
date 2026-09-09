from fastapi import APIRouter

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/")
def list_alerts_stub():
    """Placeholder. Twilio / matching not wired."""
    return {"implemented": False, "items": []}
