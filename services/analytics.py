
import pandas as pd


def calculate_summary(transactions):
    """Calculate key financial metrics."""

    if not transactions:
        return {
            "total_income": 0.0,
            "total_expenses": 0.0,
            "balance": 0.0,
            "savings_rate": 0.0,
        }

    df = pd.DataFrame(transactions)

    total_income = df.loc[
        df["type"] == "income", "amount"
    ].sum()

    total_expenses = df.loc[
        df["type"] == "expense", "amount"
    ].sum()

    balance = total_income - total_expenses

    savings_rate = (
        (balance / total_income) * 100
        if total_income > 0 else 0.0
    )

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "balance": float(balance),
        "savings_rate": float(savings_rate),
    }


def category_breakdown(transactions):
    """Calculate expense totals by category."""

    df = pd.DataFrame(transactions)

    if df.empty:
        return pd.DataFrame(columns=["category", "amount"])

    expenses = df[df["type"] == "expense"]

    return (
        expenses.groupby("category")["amount"]
        .sum()
        .reset_index()
        .sort_values("amount", ascending=False)
    )


def monthly_summary(transactions):
    """Calculate monthly income and expenses."""

    df = pd.DataFrame(transactions)

    if df.empty:
        return pd.DataFrame(
            columns=["month", "type", "amount"]
        )

    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M").astype(str)

    return (
        df.groupby(["month", "type"])["amount"]
        .sum()
        .reset_index()
    )
