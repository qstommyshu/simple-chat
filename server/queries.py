INIT_DB = '''
            CREATE TABLE IF NOT EXISTS chats(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                page_content BLOB NOT NULL,
                conversation TEXT NOT NULL
            )
            '''

CREATE_CHAT = '''
INSERT INTO chats (url, page_content, conversation) VALUES (?, ?, ?)
'''

UPDATE_CONVERSATION = '''
UPDATE chats set conversation = ? WHERE id = ?
'''

SET_PAGE_CONTENT = '''
SELECT page_content, conversation FROM chats WHERE id = ?
'''

FETCH_CHAT = '''
SELECT * FROM chats WHERE id = ?
'''