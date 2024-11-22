from pydantic import BaseModel, Field

class GPTResponseSchema(BaseModel):
    body: str = Field(description="The text answer to the user's question")
    options: list[str] = Field(description="further options the user might be interested in")

class ChatSchema(BaseModel):
    id: int = Field(description="The id of current chat")
    url: str = Field(description="The url page which current chat is about")
    convo: str = Field(description="The conversation of current chat")
