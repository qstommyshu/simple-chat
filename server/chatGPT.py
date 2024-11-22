from schema import GPTResponseSchema
from config import Config
from openai import OpenAI
from typing import List, Dict, Optional

# Ensure that the DATABASE_URI is provided
if not getattr(Config, 'OPENAI_API_KEY', None):
    raise ValueError("OPENAI_API_KEY must be set in .env file.")

GPT = OpenAI(api_key=Config.OPENAI_API_KEY)

def send_to_ai(chat_context: List[Dict[str, str]]) -> Optional[str]:
    """
    Send the chat context to OpenAI and return the response.

    Args:
        chat_context (list): The row to convert.

    Returns:
        Optional[str]: string json that follows schema.GPTResponseSchema
    """
    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=GPTResponseSchema,
        messages=chat_context
    )

    return chat_completion.choices[0].message.content
