
import streamlit as st
from supabase import Client, create_client


def get_supabase_client() -> Client:
    """Return a Supabase client scoped to the current Streamlit session."""

    if "supabase_client" not in st.session_state:
        try:
            supabase_url = st.secrets["supabase"]["url"]
            supabase_key = st.secrets["supabase"]["publishable_key"]
        except KeyError as error:
            raise RuntimeError(
                "Supabase configuration is missing from secrets.toml."
            ) from error

        if not supabase_url or not supabase_key:
            raise RuntimeError("Supabase URL or publishable key is empty.")

        st.session_state["supabase_client"] = create_client(
            supabase_url,
            supabase_key,
        )

    return st.session_state["supabase_client"]
