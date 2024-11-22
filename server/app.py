# Standard Library Imports
import json

# Third-Party Imports
from flask import Flask, Response, request, jsonify
from flask_cors import CORS

# Local Application Imports
from config import Config
from schema import ChatSchema
import constants
from server.utils import db_conn_update_convo, db_conn_create_chat, db_conn_fetch_chat
import utils
from chatGPT import send_to_ai

app = Flask(__name__)
CORS(app)


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

    with utils.db_get_connection() as conn:
        chat_id = db_conn_create_chat(conn, url, page_content)
        new_chat = db_conn_fetch_chat(conn, chat_id)

    if not new_chat:
        return jsonify({"error": "An error occurred when creating a new chat, please try again"}), 500

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

    with utils.db_get_connection() as conn:
        prev_chat = db_conn_fetch_chat(conn, chat_id)

    if not prev_chat:
        return jsonify({"error": "Chat not found"}), 404

    convo = json.loads(prev_chat['convo'])
    convo.append(user_message)

    # Construct chat context
    setting = [
        constants.init_setting_prompt,
        {"role": "system", "content": prev_chat['page_content']}
    ]
    chat_context = setting + convo

    try:
        response = send_to_ai(chat_context)
        json_response = json.loads(response)
        last_message = {'role': 'assistant', 'content': json_response['body']}
        convo.append(last_message)

        # Update conversation in the database
        with utils.db_get_connection() as conn:
            db_conn_update_convo(conn, chat_id, convo)

        return jsonify(json_response), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate AI response: {str(e)}"}), 500


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

    with utils.db_get_connection() as conn:
        prev_chat = utils.db_conn_fetch_chat(conn, chat_id)

    if not prev_chat:
        return jsonify({"error": "Chat not found"}), 404

    chat_dict = ChatSchema(**prev_chat).model_dump()
    return jsonify(chat_dict), 200

if __name__ == '__main__':
    utils.db_init()
    app.run(port=Config.SERVER_PORT)
