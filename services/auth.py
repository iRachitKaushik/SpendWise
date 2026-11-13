import base64
import hashlib
import json
from datetime import datetime, timedelta, timezone

import streamlit as st
import extra_streamlit_components as stx
from cryptography.fernet import Fernet, InvalidToken

from database.supabase_client import get_supabase_client

COOKIE_NAME = "spendwise_auth"


def initialize_auth_cookies():
    """Initialize the browser cookie manager once per app run."""
    manager = stx.CookieManager(key="spendwise_auth_cookie_manager")
    st.session_state["_spendwise_cookie_manager"] = manager
    return manager


def _manager():
    manager = st.session_state.get("_spendwise_cookie_manager")
    if manager is None:
        raise RuntimeError("Authentication cookies are not initialized.")
    return manager


def _fernet():
    password = st.secrets["cookies"]["password"]
    key = base64.urlsafe_b64encode(
        hashlib.sha256(str(password).encode()).digest()
    )
    return Fernet(key)


def _save_session(session):
    if session is None:
        return

    payload = json.dumps({
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }).encode()

    encrypted = _fernet().encrypt(payload).decode()

    _manager().set(
        COOKIE_NAME,
        encrypted,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        secure=True,
        same_site="lax",
    )


def _read_session():
    encrypted = _manager().get(COOKIE_NAME)
    if not encrypted:
        return None

    try:
        payload = _fernet().decrypt(encrypted.encode())
        return json.loads(payload)
    except (InvalidToken, ValueError, TypeError):
        _manager().delete(COOKIE_NAME)
        return None


def _clear_session():
    try:
        _manager().delete(COOKIE_NAME)
    except Exception:
        pass
    st.session_state.pop("user", None)


def sign_up(email: str, password: str):
    client = get_supabase_client()
    email = email.strip().lower()

    if not email or not password:
        raise ValueError("Email and password are required.")

    response = client.auth.sign_up({
        "email": email,
        "password": password,
    })

    if response.session is not None:
        _save_session(response.session)
        st.session_state["user"] = response.user

    return response


def sign_in(email: str, password: str):
    client = get_supabase_client()
    email = email.strip().lower()

    if not email or not password:
        raise ValueError("Email and password are required.")

    response = client.auth.sign_in_with_password({
        "email": email,
        "password": password,
    })

    _save_session(response.session)
    st.session_state["user"] = response.user

    return response


def sign_out():
    client = get_supabase_client()
    client.auth.sign_out()
    _clear_session()


def get_current_user():
    client = get_supabase_client()

    try:
        session = client.auth.get_session()

        if session is None:
            saved = _read_session()
            if not saved:
                st.session_state.pop("user", None)
                return None

            response = client.auth.set_session(
                saved["access_token"],
                saved["refresh_token"],
            )
            session = response.session

        if session is None:
            _clear_session()
            return None

        saved = _read_session()

        if (
            not saved
            or saved.get("access_token") != session.access_token
            or saved.get("refresh_token") != session.refresh_token
        ):
            _save_session(session)

        st.session_state["user"] = session.user
        return session.user

    except Exception:
        _clear_session()
        return None
