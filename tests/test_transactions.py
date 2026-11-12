import sqlite3

import pytest

from services import transactions


@pytest.fixture
def test_db(tmp_path, monkeypatch):
    db_path = tmp_path / "test_spendwise.db"

    def get_test_connection():
        connection = sqlite3.connect(db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    monkeypatch.setattr(transactions, "get_connection", get_test_connection)

    with get_test_connection() as connection:
        connection.execute("""
            CREATE TABLE transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                amount REAL NOT NULL CHECK(amount > 0),
                type TEXT NOT NULL
                    CHECK(type IN ('income', 'expense')),
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

    return db_path


def test_add_and_get_transaction(test_db):
    transaction_id = transactions.add_transaction(
        "Salary", 50000, "income", "Job", "2026-11-01"
    )

    result = transactions.get_all_transactions()

    assert len(result) == 1
    assert result[0]["id"] == transaction_id
    assert result[0]["title"] == "Salary"
    assert result[0]["amount"] == 50000


def test_update_transaction(test_db):
    transaction_id = transactions.add_transaction(
        "Food", 500, "expense", "Food", "2026-11-01"
    )

    updated = transactions.update_transaction(
        transaction_id,
        "Groceries",
        800,
        "expense",
        "Food",
        "2026-11-02",
    )

    result = transactions.get_all_transactions()

    assert updated is True
    assert result[0]["title"] == "Groceries"
    assert result[0]["amount"] == 800


def test_delete_transaction(test_db):
    transaction_id = transactions.add_transaction(
        "Rent", 10000, "expense", "Housing", "2026-11-01"
    )

    deleted = transactions.delete_transaction(transaction_id)

    assert deleted is True
    assert transactions.get_all_transactions() == []


def test_delete_nonexistent_transaction(test_db):
    assert transactions.delete_transaction(999) is False


def test_invalid_transaction_rejected(test_db):
    with pytest.raises(ValueError, match="Title cannot be empty"):
        transactions.add_transaction("", 500, "income", "Job", "2026-11-01")


def test_invalid_amount_rejected(test_db):
    with pytest.raises(ValueError, match="Amount must be greater than zero"):
        transactions.add_transaction("Food", 0, "expense", "Food", "2026-11-01")


def test_invalid_type_rejected(test_db):
    with pytest.raises(ValueError, match="Invalid transaction type"):
        transactions.add_transaction("Food", 500, "transfer", "Food", "2026-11-01")


def test_empty_category_rejected(test_db):
    with pytest.raises(ValueError, match="Category cannot be empty"):
        transactions.add_transaction("Food", 500, "expense", " ", "2026-11-01")


def test_invalid_date_rejected(test_db):
    with pytest.raises(ValueError, match="Date must use YYYY-MM-DD format"):
        transactions.add_transaction("Food", 500, "expense", "Food", "01-11-2026")
