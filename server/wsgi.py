from app import app
import utils

if __name__ == '__main__':
    utils.db_init()
    app.run()

