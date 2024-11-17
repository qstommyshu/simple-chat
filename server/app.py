from pyexpat.errors import messages

from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import sqlite3
from config import Config

app = Flask(__name__)
# TODO: set CORS to only allow client
CORS(app)

messages = []

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_URI)
    conn.row_factory = sqlite3.Row
    return conn
@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'

@app.route('/url', methods=['POST'])
def initialize_chat() -> Response:
    url = request.get_json()['url']

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO chats (url) VALUES (?)', (url,))
    conn.commit()
    chat_id = cur.lastrowid
    conn.close()

    return jsonify({'chat_id': chat_id})



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
