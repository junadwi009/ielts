"""
Dependency helpers for route modules.

Each helper reads from Flask's current_app.config, which is populated
by create_app() either with real instances (production path) or with
test-injected mocks (TESTING path).
"""
from flask import current_app


def _repo():
    return current_app.config["REPO"]


def _gateway():
    return current_app.config["GATEWAY"]


def _cfg():
    return current_app.config["APP_CONFIG"]
