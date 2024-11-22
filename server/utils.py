import json
import sqlite3
from typing import Optional, Dict, List
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from config import Config
import queries

# Ensure that the DATABASE_URI is provided
if not getattr(Config, 'DATABASE_URI', None):
    raise ValueError("DATABASE_URI must be set in the Config.")


def row_to_dict(row: sqlite3.Row) -> Dict[str, str]:
    """
    Convert a sqlite3.Row object to a dictionary.

    Args:
        row (sqlite3.Row): The row to convert.

    Returns:
        Dict[str, Any]: A dictionary representation of the row.
    """
    return {key: row[key] for key in row.keys()} if row else {}


# Database Utilities
def db_init() -> None:
    """
    Initialize the database by executing the INIT_DB query.
    """
    try:
        with sqlite3.connect(Config.DATABASE_URI) as conn:
            conn.execute(queries.INIT_DB)
            conn.commit()
    except sqlite3.Error as e:
        raise e


def db_get_connection() -> sqlite3.Connection:
    """
    Get a new database connection with row factory set to sqlite3.Row.

    Returns:
        sqlite3.Connection: A new SQLite connection object.
    """
    try:
        conn = sqlite3.connect(Config.DATABASE_URI)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        raise e


def db_conn_fetch_chat(conn: sqlite3.Connection, chat_id: int) -> Optional[Dict[str, str]]:
    """
    Execute a SELECT query and fetch a single result as a dictionary.

    Args:
        conn (sqlite3.Connection): The database connection.
        chat_id (int): The reference id of an existing chat.

    Returns:
        Optional[Dict[str, Any]]: The fetched row as a dictionary or None if no result.
    """
    try:
        cursor = conn.execute(queries.FETCH_CHAT, (chat_id,))
        row = cursor.fetchone()
        if row:
            user_dict = row_to_dict(row)
            return user_dict
        # if the row is not found
        return None
    except sqlite3.Error as e:
        raise e


def db_conn_create_chat(conn: sqlite3.Connection, url: str, page_content: str) -> int:
    """
    Create a new chat with given url and page_content, and store it in database.

    Args:
        conn (sqlite3.Connection): The database connection.
        url (str): The url that the user wants to chat about.
        page_content (str): The scraped page content of the chat url.
    Returns:
        int: The last row ID inserted.
    """
    convo = [{"role": "assistant", "content": f"Trained on {url}, please check above the chat box to see your chat reference id"}]
    str_convo = json.dumps(convo, ensure_ascii=False)
    try:
        cur = conn.cursor()
        cur.execute(queries.CREATE_CHAT, (url, page_content, str_convo))
        row_id = cur.lastrowid
        conn.commit()
        return row_id
    except sqlite3.Error as e:
        raise e


def db_conn_update_convo(conn: sqlite3.Connection, chat_id: int, convo: List[Dict[str, str]]) -> int:
    """
    Execute an UPDATE query to chat conversation by id, and commit the changes.

    Args:
        conn (sqlite3.Connection): The database connection.
        chat_id (int): The reference id of an existing chat.
        convo (List[Dict[str, str]]): The new chat conversation.
    Returns:
        int: The last row ID inserted.
    """
    str_convo = json.dumps(convo, ensure_ascii=False)
    try:
        cur = conn.cursor()
        cur.execute(queries.UPDATE_CONVERSATION, (str_convo, chat_id))
        row_id = cur.lastrowid
        conn.commit()
        return row_id
    except sqlite3.Error as e:
        raise e

# Web Scraping Utilities
def scrape_page_content(url: str, timeout: int = 10) -> str:
    """
    Scrape and return the text content of a webpage.

    Args:
        url (str): The URL of the webpage to scrape.
        timeout (int): The timeout for the HTTP request in seconds.

    Returns:
        str: The extracted text content from the webpage.

    Raises:
        ValueError: If the URL is invalid.
        requests.RequestException: If the HTTP request fails.
    """
    if not is_url_valid(url):
        raise ValueError("Invalid URL provided.")

    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator='\n', strip=True)
        return text_content
    except requests.RequestException as e:
        raise e


def is_url_valid(url: str) -> bool:
    """
    Validate the given URL.

    Args:
        url (str): The URL to validate.

    Returns:
        bool: True if the URL has a valid scheme and network location, False otherwise.
    """
    try:
        result = urlparse(url)
        is_valid = all([result.scheme, result.netloc])
        return is_valid
    except:
        return False
