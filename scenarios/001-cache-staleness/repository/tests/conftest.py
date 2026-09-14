import pytest
from app import app
from inventory.cache import get_redis_client
from inventory.db import execute

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def redis_client():
    return get_redis_client()
