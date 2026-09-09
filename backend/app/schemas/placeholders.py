"""Shape-only schemas. Fields that would be sensitive later are omitted on purpose."""

from pydantic import BaseModel, Field


class DonorCreateStub(BaseModel):
    display_name: str = Field(examples=["Donneur Demo"])
    blood_group: str = Field(examples=["O+"])


class AlertCreateStub(BaseModel):
    blood_group: str = Field(examples=["O+"])
    zone_label: str = Field(examples=["Quartier Demo — Cotonou"])
