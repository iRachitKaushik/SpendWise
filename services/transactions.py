
from datetime import datetime
from database.db import get_connection


VALID_TYPES = {"income", "expense"}


def validate_transaction(title, amount, transaction_type, category, date):
    """Validate transaction data."""

    if not title.strip():
        raise ValueError("Title cannot be empty.")

    if amount <= 0:
        raise ValueError("Amount must be greater than zero.")

    if transaction_type not in VALID_TYPES:
        raise ValueError("Invalid transaction type.")

    if not category.strip():
        raise ValueError("Category cannot be empty.")

    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise ValueError("Date must use YYYY-MM-DD format.")


def add_transaction(title, amount, transaction_type, category, date):
    validate_transaction(title, amount, transaction_type, category, date)

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO transactions
            (title, amount, type, category, date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (title.strip(), amount, transaction_type, category.strip(), date)
        )

        return cursor.lastrowid


def get_all_transactions():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM transactions ORDER BY date DESC, id DESC"
        ).fetchall()

        return [dict(row) for row in rows]


def delete_transaction(transaction_id):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM transactions WHERE id = ?",
            (transaction_id,)
        )

        return cursor.rowcount > 0


def update_transaction(transaction_id, title, amount,
                       transaction_type, category, date):

    validate_transaction(title, amount, transaction_type, category, date)

    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE transactions
            SET title = ?, amount = ?, type = ?, category = ?, date = ?
            WHERE id = ?
            """,
            (title.strip(), amount, transaction_type,
             category.strip(), date, transaction_id)
        )

        return cursor.rowcount > 0
