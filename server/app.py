from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from config import Config
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from schema import ChatResponse
import json
import constants
import queries
from server.utils import db_conn_execute_query
from utils import db_get_connection, is_url_valid, db_init, db_conn_fetch_one_query

app = Flask(__name__)
# TODO: set CORS to only allow client address access
CORS(app)

GPT = OpenAI(api_key=Config.OPENAI_API_KEY)
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

    conn = db_get_connection()

    chat_id = db_conn_execute_query(conn, queries.CREATE_CHAT, (url, page_content, json.dumps([])))
    convo = [{"role": "assistant", "content": f"Trained on {url}, and your chat reference id is {chat_id}"}]
    str_convo = json.dumps(convo, ensure_ascii=False)

    db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_convo, chat_id))
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
def chat() -> tuple[Response, int]:
    user_message = request.get_json()['body']
    chat_id = int(request.get_json()['id'])

    conn = db_get_connection()
    chat_data = db_conn_fetch_one_query(conn, queries.SET_PAGE_CONTENT, (chat_id,))
    conn.close()

    # Internal error, should not be exposed to client
    if chat_data is None:
        return jsonify({"error": "Chat not found"}), 404

    chat_history = json.loads(chat_data['conversation'])
    chat_history.append(user_message)

    setting = [constants.init_setting_prompt,
               {"role": "system","content": chat_data['page_content']}]
    chat_context = setting + chat_history


    response = send_to_ai(chat_context)
    json_response = json.loads(response)
    last_message = {'role': 'assistant', 'content': json_response['body']}
    chat_history.append(last_message)

    str_chat_history = json.dumps(chat_history, ensure_ascii=False)

    conn = db_get_connection()
    db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_chat_history, chat_id))
    conn.close()

    return jsonify(json.loads(response)), 200


def send_to_ai(chat_context) -> str:
    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=ChatResponse,
        messages=chat_context
    )

    response = chat_completion.choices[0].message.content
    return response

@app.route('/load_chat', methods=['GET'])
def load_chat() -> tuple[Response, int]:
    chat_id = request.args.get('id')

    if chat_id is None:
        return jsonify({"error": "Missing parameter 'id'"}), 400

    try:
        chat_id = int(chat_id)
    except ValueError:
        return jsonify({"error": "Invalid parameter 'id'. It must be an integer."}), 400

    conn = db_get_connection()
    chat = db_conn_fetch_one_query(conn, queries.FETCH_CHAT, (chat_id,))
    conn.close()

    if chat is None:
        return jsonify({"error": "Chat not found"}), 404

    chat_dict = {
        "id": chat['id'],
        "url": chat['url'],
        "convo": chat['conversation']
    }
    return jsonify(chat_dict), 200

if __name__ == '__main__':
    db_init()
    app.run(port=Config.SERVER_PORT)
