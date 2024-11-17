from dotenv import load_dotenv
import os

load_dotenv()
class Config:
    DATABASE_URI = 'simple-chat.db'
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_MODEL = "gpt-4o-mini"
    GPT_INIT_PROMPT = """You are an AI assistant, you will be answering questions from a user. Your goal is to provide 
    a concise and accurate answer to user's question, and provide 4 related options that the user might be interested 
    in, the options should be formatted in first person voice. 
    """
    # GPT_SUMMRY_PROMPT = """summary"""

