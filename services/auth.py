
import streamlit as st
from database.supabase_client import get_supabase_client


def sign_up(email: str, password: str):
    """Register a new user with email and password."""
    client = get_supabase_client()

    email = email.strip().lower()

    if not email or not password:
        raise ValueError("Email and password are required.")

    response = client.auth.sign_up(
        {
            "email": email,
            "password": password,
        }
    )

    # Email confirmation is enabled, so a session may not exist yet.
    if response.session is not None:
        st.session_state["user"] = response.user

    return response


def sign_in(email: str, password: str):
    """Authenticate an existing user."""
    client = get_supabase_client()

    email = email.strip().lower()

    if not email or not password:
        raise ValueError("Email and password are required.")

    response = client.auth.sign_in_with_password(
        {
            "email": email,
            "password": password,
        }
    )

    st.session_state["user"] = response.user

    return response


def sign_out():
    """Sign out the current user."""
    client = get_supabase_client()

    client.auth.sign_out()

    st.session_state.pop("user", None)


def get_current_user():
    """Return the currently authenticated user."""
    return st.session_state.get("user")
