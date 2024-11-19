from urllib.parse import urlparse

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

setting_prompt = {"role": "system", "content": Config.GPT_INIT_PROMPT}
string_setting_prompt = json.dumps(setting_prompt, ensure_ascii=False)

GPT = OpenAI(api_key=Config.OPENAI_API_KEY)

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_URI)
    conn.row_factory = sqlite3.Row
    return conn

def is_url_valid(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

# def execute_and_commit(conn, sql: str, parameters):
#     cur = conn.cursor()
#     cur.execute(sql, parameters)
#     conn.commit()

@app.route('/')
def check_health():  # put application's code here
    return 'server is up!'

@app.route('/url', methods=['POST'])
def initialize_chat() -> Response:
    url = request.get_json()['url']
    if not is_url_valid(url):
        raise Exception(f'URL format is invalid.')

    # TODO: catch exception
    page_content = scrape_page_content(url)

    conn = get_db_connection()
    # TODO: can change to a function
    cur = conn.cursor()
    cur.execute('INSERT INTO chats (url, page_content, conversation) VALUES (?, ?, ?)',
                (url, page_content, json.dumps([])))
    conn.commit()
    # TODO: up to here
    chat_id = cur.lastrowid
    convo = [{"role": "assistant", "content": f"Trained on {url}, and your chat reference id is {chat_id}"}]
    str_convo = json.dumps(convo, ensure_ascii=False)
    cur.execute('UPDATE chats set conversation = ? WHERE id = ?', (str_convo, chat_id))
    conn.commit()
    conn.close()

    # TODO: make it a schema
    return jsonify({
        'id': chat_id,
        'url': url,
        'convo': str_convo
    })

def scrape_page_content(url: str) -> str:
    try:
        response = requests.get(url)

        if response.status_code != 200:
            raise Exception(f'Failed to fetch URL. Status code: {response.status_code}')

        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator='\n', strip=True)
        return text_content

    except Exception as e:
        raise e

'''chat() takes in a { role: 'user', content: inputValue }'''
@app.route('/chat', methods=['POST'])
def chat() -> Response:
    user_message = request.get_json()['body']
    chat_id = int(request.get_json()['id'])

    # Get page_content and conversation
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT page_content, conversation FROM chats WHERE id = ?', (chat_id,))
    chat_data = cur.fetchone()
    conn.close()

    # Internal error, should not be exposed to client
    if chat_data is None:
        return jsonify({"error": "Chat not found"}), 404

    chat_history = json.loads(chat_data['conversation'])
    chat_history.append(user_message)

    setting = [setting_prompt,
               {"role": "system","content": chat_data['page_content']}]
    chat_context = setting + chat_history



    response = send_to_ai(chat_context)
    json_response = json.loads(response)
    last_message = {'role': 'assistant', 'content': json_response['body']}
    chat_history.append(last_message)

    str_chat_history = json.dumps(chat_history, ensure_ascii=False)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE chats set conversation = ? WHERE id = ?', (str_chat_history, chat_id))
    conn.commit()

    return jsonify(json.loads(response))


def send_to_ai(chat_context) -> str:
    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=ChatResponse,
        messages=chat_context
    )

    response = chat_completion.choices[0].message.content
    return response

@app.route('/load_chat', methods=['GET'])
def load_chat() -> Response:
    chat_id = request.args.get('id')

    if chat_id is None:
        return jsonify({"error": "Missing parameter 'id'"}), 400

    try:
        chat_id = int(chat_id)
    except ValueError:
        return jsonify({"error": "Invalid parameter 'id'. It must be an integer."}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM chats WHERE id = ?', (chat_id,))
    chat = cur.fetchone()
    conn.close()

    if chat is None:
        return jsonify({"error": "Chat not found"}), 404

    chat_dict = {
        "id": chat['id'],
        "url": chat['url'],
        "convo": chat['conversation']
    }
    return jsonify(chat_dict)

if __name__ == '__main__':
    # initialize db
    conn = sqlite3.connect(Config.DATABASE_URI)
    cur = conn.cursor()
    # TODO: make url field not update able
    cur.execute('''
            CREATE TABLE IF NOT EXISTS chats(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                page_content BLOB NOT NULL,
                conversation TEXT NOT NULL
            )
            ''')
    conn.commit()
    conn.close()

    app.run(port=8000)
