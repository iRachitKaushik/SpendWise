from datetime import datetime
from services.transactions import VALID_TYPES
from database.supabase_client import get_supabase_client

VALID_FREQUENCIES = {"weekly", "monthly", "yearly"}


def validate_recurring(title, amount, transaction_type, category,
                       frequency, next_due_date, end_date=None):
    if not isinstance(title, str) or not title.strip():
        raise ValueError("Title cannot be empty.")
    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")
    if transaction_type not in VALID_TYPES:
        raise ValueError("Invalid transaction type.")
    if not isinstance(category, str) or not category.strip():
        raise ValueError("Category cannot be empty.")
    if frequency not in VALID_FREQUENCIES:
        raise ValueError("Invalid recurrence frequency.")

    try:
        due = datetime.strptime(next_due_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValueError("Invalid due date.")

    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            raise ValueError("Invalid end date.")
        if end < due:
            raise ValueError("End date cannot be before due date.")


def create_recurring_transaction(
    title, amount, transaction_type, category,
    frequency, next_due_date, user_id, end_date=None
):
    validate_recurring(
        title, amount, transaction_type, category,
        frequency, next_due_date, end_date
    )
    if not user_id:
        raise ValueError("Authentication required.")

    client = get_supabase_client()
    response = client.table("recurring_transactions").insert({
        "user_id": user_id,
        "title": title.strip(),
        "amount": amount,
        "type": transaction_type,
        "category": category.strip(),
        "frequency": frequency,
        "next_due_date": next_due_date,
        "end_date": end_date,
    }).execute()

    return response.data[0]["id"] if response.data else None


def get_recurring_transactions(user_id):
    if not user_id:
        raise ValueError("Authentication required.")

    response = (
        get_supabase_client()
        .table("recurring_transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("next_due_date")
        .execute()
    )
    return response.data


def update_recurring_transaction(
    recurring_id, title, amount, transaction_type,
    category, frequency, next_due_date, user_id, end_date=None
):
    validate_recurring(
        title, amount, transaction_type, category,
        frequency, next_due_date, end_date
    )
    if not user_id:
        raise ValueError("Authentication required.")

    response = (
        get_supabase_client()
        .table("recurring_transactions")
        .update({
            "title": title.strip(),
            "amount": amount,
            "type": transaction_type,
            "category": category.strip(),
            "frequency": frequency,
            "next_due_date": next_due_date,
            "end_date": end_date,
        })
        .eq("id", recurring_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )
    return bool(response.data)


def set_recurring_status(recurring_id, user_id, is_active):
    if not user_id:
        raise ValueError("Authentication required.")

    response = (
        get_supabase_client()
        .table("recurring_transactions")
        .update({"is_active": is_active})
        .eq("id", recurring_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )
    return bool(response.data)


def delete_recurring_transaction(recurring_id, user_id):
    if not user_id:
        raise ValueError("Authentication required.")

    response = (
        get_supabase_client()
        .table("recurring_transactions")
        .delete()
        .eq("id", recurring_id)
        .eq("user_id", user_id)
        .select("id")
        .execute()
    )
    return bool(response.data)


def confirm_recurring_transaction(recurring_id, user_id):
    if not user_id:
        raise ValueError("Authentication required.")

    return (
        get_supabase_client()
        .rpc(
            "confirm_recurring_transaction",
            {"p_recurring_id": recurring_id}
        )
        .execute()
    )
