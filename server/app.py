from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from config import Config
from openai import OpenAI
from schema import GPTResponseSchema, ChatSchema
import json
import constants
import queries
from server.utils import db_conn_execute_query
import utils

app = Flask(__name__)
CORS(app)

GPT = OpenAI(api_key=Config.OPENAI_API_KEY)
@app.route('/')
def check_health():
    return 'server is up!'

@app.route('/url', methods=['POST'])
def initialize_chat() -> tuple[Response, int]:
    url = request.get_json()['url']

    if not utils.is_url_valid(url):
        return jsonify({"error": 'URL format is invalid.'}), 400

    try:
        page_content = utils.scrape_page_content(url)
    except Exception as e:
        return jsonify({"error": e}), 400

    conn = utils.db_get_connection()
    chat_id = db_conn_execute_query(conn, queries.CREATE_CHAT, (url, page_content, json.dumps([])))
    convo = [{"role": "assistant", "content": f"Trained on {url}, and your chat reference id is {chat_id}"}]
    str_convo = json.dumps(convo, ensure_ascii=False)

    db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_convo, chat_id))
    conn.close()

    new_chat = {
        'id': chat_id,
        'url': url,
        'convo': str_convo
    }

    chat_dict = ChatSchema(**new_chat).model_dump()
    return jsonify(chat_dict), 200


'''chat() takes in a { role: 'user', content: inputValue }'''
@app.route('/chat', methods=['POST'])
def chat() -> tuple[Response, int]:
    user_message = request.get_json()['body']
    chat_id = int(request.get_json()['id'])

    conn = utils.db_get_connection()
    chat_data = utils.db_conn_fetch_one_query(conn, queries.SET_PAGE_CONTENT, (chat_id,))
    conn.close()

    # Or can be Internal error, maybe we should not expose this to client
    if chat_data is None:
        return jsonify({"error": "Chat not found"}), 404

    convo = json.loads(chat_data['convo'])
    convo.append(user_message)

    setting = [constants.init_setting_prompt,
               {"role": "system","content": chat_data['page_content']}]
    chat_context = setting + convo


    response = send_to_ai(chat_context)
    json_response = json.loads(response)
    last_message = {'role': 'assistant', 'content': json_response['body']}
    convo.append(last_message)

    str_convo = json.dumps(convo, ensure_ascii=False)

    conn = utils.db_get_connection()
    db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_convo, chat_id))
    conn.close()

    return jsonify(json.loads(response)), 200


def send_to_ai(chat_context) -> str:
    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=GPTResponseSchema,
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

    conn = utils.db_get_connection()
    prev_chat = utils.db_conn_fetch_one_query(conn, queries.FETCH_CHAT, (chat_id,))
    conn.close()

    if chat is None:
        return jsonify({"error": "Chat not found"}), 404

    chat_dict = ChatSchema(**prev_chat).model_dump()
    return jsonify(chat_dict), 200

if __name__ == '__main__':
    utils.db_init()
    app.run(port=Config.SERVER_PORT)
