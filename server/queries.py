INIT_DB = '''
            CREATE TABLE IF NOT EXISTS chats(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                page_content BLOB NOT NULL,
                convo TEXT NOT NULL
            )
            '''

CREATE_CHAT = '''
INSERT INTO chats (url, page_content, convo) VALUES (?, ?, ?)
'''

UPDATE_CONVERSATION = '''
UPDATE chats set convo = ? WHERE id = ?
'''

SET_PAGE_CONTENT = '''
SELECT page_content, convo FROM chats WHERE id = ?
'''

FETCH_CHAT = '''
SELECT * FROM chats WHERE id = ?
'''