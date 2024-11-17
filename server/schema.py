from pydantic import BaseModel, Field


class ChatResponse(BaseModel):
    answer: str = Field(description="The answer to the user's question")
    options: list[str] = Field(description="further options the user might be interested in")
