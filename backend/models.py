from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class SubmitNominationsRequest(BaseModel):
    name: str = Field("", description="Legacy: roll number")
    user_id: str = Field("", description="Roll number of the nominator")
    username: str = Field("", description="Full name of the nominator")
    picks: Dict[str, str] = Field(
        ..., description="categoryId -> nominee roll"
    )


class CheckNameQuery(BaseModel):
    name: str


class SubmitVotesRequest(BaseModel):
    name: str = Field("", description="Legacy: roll number")
    user_id: str = Field("", description="Roll number of the voter")
    username: str = Field("", description="Full name of the voter")
    votes: Dict[str, str] = Field(
        ..., description="categoryId -> chosen nominee roll"
    )


class AdminPassRequest(BaseModel):
    adminPass: str


