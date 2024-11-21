from pydantic import BaseModel, Field, HttpUrl


class GPTResponseSchema(BaseModel):
    body: str = Field(description="The text answer to the user's question")
    options: list[str] = Field(description="further options the user might be interested in")

class ChatSchema(BaseModel):
    id: int
    url: str
    convo: str
