# SpendWise — Personal Finance Analytics Dashboard

SpendWise is a personal finance management application built with Python. It helps users track income and expenses, manage transactions, and visualize financial performance.

## Features

- Add, view, update, and delete transactions (CRUD)
- Track total income, expenses, balance, and savings rate
- Analyze spending by category
- Visualize monthly financial performance
- Filter transactions by type and category
- Export transaction records to CSV
- Store data locally using SQLite

## Tech Stack

- Python
- Streamlit
- SQLite
- Pandas
- Plotly
- Pytest

## Project Structure

```text
spendwise/
├── app.py
├── database/
│   ├── __init__.py
│   └── db.py
├── services/
│   ├── __init__.py
│   ├── analytics.py
│   └── transactions.py
├── components/
│   └── __init__.py
├── tests/
│   └── test_analytics.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd spendwise
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run the Application

```bash
streamlit run app.py
```

## Run Tests

```bash
python -m pytest -v
```

## Database

SpendWise uses SQLite. The database is created automatically when the application starts.

## Author

Built as a Python portfolio project.