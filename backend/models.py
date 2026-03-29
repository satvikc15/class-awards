from __future__ import annotations

from typing import Dict

from pydantic import BaseModel, Field


class SubmitNominationsRequest(BaseModel):
    picks: Dict[str, str] = Field(
        ..., description="categoryId -> nominee roll"
    )

class SubmitVotesRequest(BaseModel):
    votes: Dict[str, str] = Field(
        ..., description="categoryId -> chosen nominee roll"
    )


class AdminPassRequest(BaseModel):
    adminPass: str = Field(..., description="Admin password")


class SendOtpRequest(BaseModel):
    roll: str = Field(..., description="Full roll number")


class VerifyOtpRequest(BaseModel):
    roll: str = Field(..., description="Full roll number")
    otp: str = Field(..., description="6-digit OTP code")


class SaveDraftRequest(BaseModel):
    picks: Dict[str, str] = Field(
        ..., description="categoryId -> nominee roll (partial OK)"
    )
