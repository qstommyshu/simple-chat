from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import sqlite3
from config import Config
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from schema import ChatResponse
import json

app = Flask(__name__)
# TODO: set CORS to only allow client address access
CORS(app)

chat_history = []
GPT = OpenAI(api_key=Config.OPENAI_API_KEY)


def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_URI)
    conn.row_factory = sqlite3.Row
    return conn
@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'

@app.route('/url', methods=['POST'])
def initialize_chat() -> Response:
    # TODO: valid url format in server
    url = request.get_json()['url']

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO chats (url) VALUES (?)', (url,))
    conn.commit()
    chat_id = cur.lastrowid
    conn.close()

    return jsonify({'chat_id': chat_id})

@app.route('/chat', methods=['POST'])
def chat() -> str:
    user_input = request.get_json()['body']
    chat_id = request.get_json()['chat_id']
    response = send_to_ai(user_input)

    json_messages = json.dumps(chat_history)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE chats set history = ? WHERE id = ?', (json_messages, chat_id))
    conn.commit()

    return response


def scrape_text_content(url: str) -> str:
    try:
        response = requests.get(url)

        if response.status_code != 200:
            raise Exception(f'Failed to fetch URL. Status code: {response.status_code}')

        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator='\n', strip=True)
        print(text_content)
        return text_content

    except Exception as e:
        raise e

def send_to_ai(data: str) -> str:
    message = "User: " + data
    chat_history.append(
        {"role": "user", "content": message}
    )

    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=ChatResponse,
        messages=chat_history
    )

    response = chat_completion.choices[0].message.content
    chat_history.append({"role": "system", "content": response})
    print(response)
    return response



if __name__ == '__main__':
    # initialize db
    conn = sqlite3.connect(Config.DATABASE_URI)
    cur = conn.cursor()
    # TODO: make url field not update able
    cur.execute('''
            CREATE TABLE IF NOT EXISTS chats(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                history TEXT
            )
    ''')
    conn.commit()
    conn.close()

    app.run(port=8000)
