
from types import SimpleNamespace

import pytest

from services import transactions


class FakeSupabaseQuery:
    def __init__(self, rows):
        self.rows = rows
        self.operation = "select"
        self.payload = None
        self.filters = []

    def select(self, columns="*"):
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def order(self, column, desc=False):
        self.rows.sort(
            key=lambda row: row[column],
            reverse=desc,
        )
        return self

    def execute(self):
        matching = [
            row for row in self.rows
            if all(row.get(key) == value for key, value in self.filters)
        ]

        if self.operation == "insert":
            new_row = {
                **self.payload,
                "id": len(self.rows) + 1,
            }
            self.rows.append(new_row)
            return SimpleNamespace(data=[new_row])

        if self.operation == "update":
            for row in matching:
                row.update(self.payload)
            return SimpleNamespace(data=matching)

        if self.operation == "delete":
            for row in matching:
                self.rows.remove(row)
            return SimpleNamespace(data=matching)

        return SimpleNamespace(data=matching)


class FakeSupabaseClient:
    def __init__(self):
        self.rows = []

    def table(self, table_name):
        assert table_name == "transactions"
        return FakeSupabaseQuery(self.rows)


@pytest.fixture
def test_supabase(monkeypatch):
    client = FakeSupabaseClient()

    monkeypatch.setattr(
        transactions,
        "get_supabase_client",
        lambda: client,
    )

    return client


USER_ID = "test-user-123"


def test_add_and_get_transaction(test_supabase):
    transaction_id = transactions.add_transaction(
        "Salary", 50000, "income", "Job", "2026-11-01", USER_ID
    )

    result = transactions.get_all_transactions(USER_ID)

    assert len(result) == 1
    assert result[0]["id"] == transaction_id
    assert result[0]["title"] == "Salary"
    assert result[0]["amount"] == 50000
    assert result[0]["user_id"] == USER_ID


def test_update_transaction(test_supabase):
    transaction_id = transactions.add_transaction(
        "Food", 500, "expense", "Food", "2026-11-01", USER_ID
    )

    updated = transactions.update_transaction(
        transaction_id,
        "Groceries",
        800,
        "expense",
        "Food",
        "2026-11-02",
        USER_ID,
    )

    result = transactions.get_all_transactions(USER_ID)

    assert updated is True
    assert result[0]["title"] == "Groceries"
    assert result[0]["amount"] == 800


def test_delete_transaction(test_supabase):
    transaction_id = transactions.add_transaction(
        "Rent", 10000, "expense", "Housing", "2026-11-01", USER_ID
    )

    deleted = transactions.delete_transaction(
        transaction_id, USER_ID
    )

    assert deleted is True
    assert transactions.get_all_transactions(USER_ID) == []


def test_delete_nonexistent_transaction(test_supabase):
    assert transactions.delete_transaction(999, USER_ID) is False


def test_update_nonexistent_transaction(test_supabase):
    updated = transactions.update_transaction(
        999,
        "Food",
        500,
        "expense",
        "Food",
        "2026-11-01",
        USER_ID,
    )

    assert updated is False


def test_missing_user_rejected(test_supabase):
    with pytest.raises(ValueError, match="Authentication required"):
        transactions.add_transaction(
            "Salary", 50000, "income", "Job", "2026-11-01", None
        )


def test_invalid_transaction_rejected(test_supabase):
    with pytest.raises(ValueError, match="Title cannot be empty"):
        transactions.add_transaction(
            "", 500, "income", "Job", "2026-11-01", USER_ID
        )


def test_invalid_amount_rejected(test_supabase):
    with pytest.raises(ValueError, match="Amount must be greater than zero"):
        transactions.add_transaction(
            "Food", 0, "expense", "Food", "2026-11-01", USER_ID
        )


def test_invalid_type_rejected(test_supabase):
    with pytest.raises(ValueError, match="Invalid transaction type"):
        transactions.add_transaction(
            "Food", 500, "transfer", "Food", "2026-11-01", USER_ID
        )


def test_empty_category_rejected(test_supabase):
    with pytest.raises(ValueError, match="Category cannot be empty"):
        transactions.add_transaction(
            "Food", 500, "expense", " ", "2026-11-01", USER_ID
        )


def test_invalid_date_rejected(test_supabase):
    with pytest.raises(ValueError, match="Date must use YYYY-MM-DD format"):
        transactions.add_transaction(
            "Food", 500, "expense", "Food", "01-11-2026", USER_ID
        )
