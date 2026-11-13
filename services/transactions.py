
from datetime import datetime

from database.supabase_client import get_supabase_client


VALID_TYPES = {"income", "expense"}


def validate_transaction(title, amount, transaction_type, category, date):
    """Validate transaction data."""

    if not isinstance(title, str) or not title.strip():
        raise ValueError("Title cannot be empty.")

    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")

    if transaction_type not in VALID_TYPES:
        raise ValueError("Invalid transaction type.")

    if not isinstance(category, str) or not category.strip():
        raise ValueError("Category cannot be empty.")

    try:
        datetime.strptime(date, "%Y-%m-%d")
    except (ValueError, TypeError):
        raise ValueError("Date must use YYYY-MM-DD format.")


def add_transaction(title, amount, transaction_type, category, date, user_id):
    """Add a transaction belonging to the authenticated user."""

    validate_transaction(title, amount, transaction_type, category, date)

    if not user_id:
        raise ValueError("Authentication required.")

    client = get_supabase_client()

    response = client.table("transactions").insert({
        "user_id": user_id,
        "title": title.strip(),
        "amount": amount,
        "type": transaction_type,
        "category": category.strip(),
        "date": date,
    }).execute()

    return response.data[0]["id"] if response.data else None


def get_all_transactions(user_id):
    """Retrieve only the authenticated user's transactions."""

    if not user_id:
        raise ValueError("Authentication required.")

    client = get_supabase_client()

    response = (
        client.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .order("id", desc=True)
        .execute()
    )

    return response.data


def delete_transaction(transaction_id, user_id):
    """Delete a transaction belonging to the authenticated user."""

    if not user_id:
        raise ValueError("Authentication required.")

    client = get_supabase_client()

    response = (
        client.table("transactions")
        .delete()
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )

    return bool(response.data)


def update_transaction(
    transaction_id,
    title,
    amount,
    transaction_type,
    category,
    date,
    user_id,
):
    """Update a transaction belonging to the authenticated user."""

    validate_transaction(title, amount, transaction_type, category, date)

    if not user_id:
        raise ValueError("Authentication required.")

    client = get_supabase_client()

    response = (
        client.table("transactions")
        .update({
            "title": title.strip(),
            "amount": amount,
            "type": transaction_type,
            "category": category.strip(),
            "date": date,
        })
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )

    return bool(response.data)
