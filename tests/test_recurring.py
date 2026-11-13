import pytest
from services import recurring


USER = "test-user-123"


def test_valid_recurring_data():
    recurring.validate_recurring(
        "Rent", 10000, "expense", "Housing",
        "monthly", "2026-12-01"
    )


@pytest.mark.parametrize("frequency", ["weekly", "monthly", "yearly"])
def test_valid_frequencies(frequency):
    recurring.validate_recurring(
        "Rent", 10000, "expense", "Housing",
        frequency, "2026-12-01"
    )


def test_invalid_frequency():
    with pytest.raises(ValueError, match="Invalid recurrence frequency"):
        recurring.validate_recurring(
            "Rent", 10000, "expense", "Housing",
            "daily", "2026-12-01"
        )


def test_invalid_amount():
    with pytest.raises(ValueError, match="Amount must be greater"):
        recurring.validate_recurring(
            "Rent", 0, "expense", "Housing",
            "monthly", "2026-12-01"
        )


def test_empty_title():
    with pytest.raises(ValueError, match="Title cannot be empty"):
        recurring.validate_recurring(
            "", 100, "expense", "Food",
            "weekly", "2026-12-01"
        )


def test_invalid_end_date():
    with pytest.raises(ValueError, match="End date cannot be before"):
        recurring.validate_recurring(
            "Rent", 100, "expense", "Housing",
            "monthly", "2026-12-10", "2026-12-01"
        )


@pytest.mark.parametrize("function,args", [
    (recurring.get_recurring_transactions, (None,)),
    (recurring.delete_recurring_transaction, (1, None)),
    (recurring.confirm_recurring_transaction, (1, None)),
])
def test_authentication_required(function, args):
    with pytest.raises(ValueError, match="Authentication required"):
        function(*args)
