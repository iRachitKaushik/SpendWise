from services.analytics import (
    calculate_summary,
    category_breakdown,
    monthly_summary,
)


def sample_transactions():
    return [
        {
            "amount": 50000,
            "type": "income",
            "category": "Salary",
            "date": "2026-11-01",
        },
        {
            "amount": 10000,
            "type": "expense",
            "category": "Rent",
            "date": "2026-11-02",
        },
        {
            "amount": 5000,
            "type": "expense",
            "category": "Food",
            "date": "2026-11-03",
        },
    ]


def test_calculate_summary():
    result = calculate_summary(sample_transactions())

    assert result["total_income"] == 50000
    assert result["total_expenses"] == 15000
    assert result["balance"] == 35000
    assert result["savings_rate"] == 70


def test_category_breakdown():
    result = category_breakdown(sample_transactions())

    assert len(result) == 2
    assert result.iloc[0]["category"] == "Rent"


def test_empty_transactions():
    result = calculate_summary([])

    assert result["balance"] == 0
    assert result["savings_rate"] == 0