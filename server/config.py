from dotenv import load_dotenv
import os

load_dotenv()
class Config:
    DATABASE_URI = 'simple-chat.db'
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    OPENAI_MODEL = "gpt-4o-mini"
    SERVER_PORT = 5000

