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

@app.errorhandler(Exception)
def handle_exception(e):
    """Global error handler for uncaught exceptions."""
    return jsonify({"error": str(e)}), 500

@app.route('/')
def check_health() -> str:
    """Check if the server is running."""
    return 'Server is up and running!'

@app.route('/url', methods=['POST'])
def initialize_chat() -> tuple[Response, int]:
    """Initialize a new chat with a given URL."""
    data = request.get_json()
    url = data.get('url')

    if not utils.is_url_valid(url):
        return jsonify({"error": 'URL format is invalid.'}), 400

    try:
        page_content = utils.scrape_page_content(url)
    except Exception as e:
        return jsonify({"error": f"Failed to scrape page content: {str(e)}"}), 400

    conn = utils.db_get_connection()
    try:
        chat_id = db_conn_execute_query(conn, queries.CREATE_CHAT, (url, page_content, json.dumps([])))
        convo = [{"role": "assistant", "content": f"Trained on {url}, and your chat reference id is {chat_id}"}]
        str_convo = json.dumps(convo, ensure_ascii=False)
        db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_convo, chat_id))
    finally:
        conn.close()

    new_chat = {
        'id': chat_id,
        'url': url,
        'convo': str_convo,
    }

    chat_dict = ChatSchema(**new_chat).model_dump()
    return jsonify(chat_dict), 200


@app.route('/chat', methods=['POST'])
def chat() -> tuple[Response, int]:
    """Handle a user's chat message and get a response from OpenAI."""
    data = request.get_json()
    user_message = data.get('body')
    chat_id = data.get('id')

    if not user_message or not chat_id:
        return jsonify({"error": "Invalid request. Both 'body' and 'id' are required."}), 400

    try:
        chat_id = int(chat_id)
    except ValueError:
        return jsonify({"error": "Invalid 'id'. It must be an integer."}), 400

    conn = utils.db_get_connection()
    try:
        chat_data = utils.db_conn_fetch_one_query(conn, queries.SET_PAGE_CONTENT, (chat_id,))
    finally:
        conn.close()

    if not chat_data:
        return jsonify({"error": "Chat not found"}), 404

    convo = json.loads(chat_data['convo'])
    convo.append(user_message)

    # Construct chat context
    setting = [
        constants.init_setting_prompt,
        {"role": "system", "content": chat_data['page_content']}
    ]
    chat_context = setting + convo

    try:
        response = send_to_ai(chat_context)
        json_response = json.loads(response)
        last_message = {'role': 'assistant', 'content': json_response['body']}
        convo.append(last_message)

        # Update conversation in the database
        str_convo = json.dumps(convo, ensure_ascii=False)
        conn = utils.db_get_connection()
        try:
            db_conn_execute_query(conn, queries.UPDATE_CONVERSATION, (str_convo, chat_id))
        finally:
            conn.close()

        return jsonify(json_response), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate AI response: {str(e)}"}), 500


def send_to_ai(chat_context: list) -> str:
    """Send the chat context to OpenAI and return the response."""
    chat_completion = GPT.beta.chat.completions.parse(
        model=Config.OPENAI_MODEL,
        response_format=GPTResponseSchema,
        messages=chat_context
    )

    return chat_completion.choices[0].message.content
@app.route('/load_chat', methods=['GET'])
def load_chat() -> tuple[Response, int]:
    """Load a chat conversation by its ID."""
    chat_id = request.args.get('id')

    if not chat_id:
        return jsonify({"error": "Missing parameter 'id'"}), 400

    try:
        chat_id = int(chat_id)
    except ValueError:
        return jsonify({"error": "Invalid parameter 'id'. It must be an integer."}), 400

    conn = utils.db_get_connection()
    try:
        prev_chat = utils.db_conn_fetch_one_query(conn, queries.FETCH_CHAT, (chat_id,))
    finally:
        conn.close()

    if not prev_chat:
        return jsonify({"error": "Chat not found"}), 404

    chat_dict = ChatSchema(**prev_chat).model_dump()
    return jsonify(chat_dict), 200

if __name__ == '__main__':
    utils.db_init()
    app.run(port=Config.SERVER_PORT)
