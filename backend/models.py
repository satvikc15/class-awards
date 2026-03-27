from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class SubmitNominationsRequest(BaseModel):
    name: str = Field("", description="Legacy: roll number")
    user_id: str = Field("", description="Roll number of the nominator")
    username: str = Field("", description="Full name of the nominator")
    email: str = Field("", description="Email of the nominator")
    picks: Dict[str, str] = Field(
        ..., description="categoryId -> nominee roll"
    )


class CheckNameQuery(BaseModel):
    name: str


class SubmitVotesRequest(BaseModel):
    name: str = Field("", description="Legacy: roll number")
    user_id: str = Field("", description="Roll number of the voter")
    username: str = Field("", description="Full name of the voter")
    email: str = Field("", description="Email of the voter")
    votes: Dict[str, str] = Field(
        ..., description="categoryId -> chosen nominee roll"
    )


class AdminPassRequest(BaseModel):
    adminPass: str


class RemoveNominatorRequest(BaseModel):
    adminPass: str
    roll: str = Field(..., description="Roll number to remove from nominators")


class SendOtpRequest(BaseModel):
    roll: str = Field(..., description="Full roll number")


class VerifyOtpRequest(BaseModel):
    roll: str = Field(..., description="Full roll number")
    otp: str = Field(..., description="6-digit OTP code")
