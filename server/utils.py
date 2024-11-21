import sqlite3
from config import Config
from urllib.parse import urlparse
import queries
import requests
from bs4 import BeautifulSoup

# DB
def db_init():
    conn = sqlite3.connect(Config.DATABASE_URI)
    cur = conn.cursor()
    cur.execute(queries.INIT_DB)
    conn.commit()
    conn.close()

def db_get_connection():
    conn = sqlite3.connect(Config.DATABASE_URI)
    conn.row_factory = sqlite3.Row
    return conn

def db_conn_fetch_one_query(conn, query: str, parameters):
    cur = conn.cursor()
    cur.execute(query, parameters)
    data = cur.fetchone()

    return data

def db_conn_execute_query(conn, query: str, parameters) -> int:
    cur = conn.cursor()
    cur.execute(query, parameters)
    row_id = cur.lastrowid
    conn.commit()

    return row_id

# Web scraper
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

def is_url_valid(url: str) -> bool:
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False

