"""Run alembic upgrade using the project's DATABASE_URL and local alembic scripts.

Usage:
    python backend/alembic_upgrade.py head
"""
import os
import sys
from logging.config import fileConfig

from alembic import command
from alembic.config import Config

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.config import settings

cfg = Config(os.path.join(os.path.dirname(__file__), '..', 'alembic.ini'))
cfg.set_main_option('sqlalchemy.url', settings.DATABASE_URL)
cfg.set_main_option('script_location', os.path.join(os.path.dirname(__file__), '..', 'alembic'))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python backend/alembic_upgrade.py <revision>')
        sys.exit(2)
    rev = sys.argv[1]
    command.upgrade(cfg, rev)
