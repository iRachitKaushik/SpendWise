
# SpendWise — Personal Finance Analytics Dashboard

SpendWise is a personal finance management application built with Python and Streamlit. It helps users manage transactions, monitor income and expenses, and analyze financial performance through interactive visualizations.

## Features

- Add, view, update, and delete financial transactions
- Track total income, expenses, balance, and savings rate
- Analyze expenses by category
- Visualize monthly income and expenses
- Filter transactions by type and category
- Export transaction records to CSV
- Store financial records locally using SQLite
- Glassmorphism-inspired user interface

## Tech Stack

- **Language:** Python
- **Frontend:** Streamlit
- **Database:** SQLite
- **Data Analysis:** Pandas
- **Visualizations:** Plotly
- **Testing:** Pytest

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
│   ├── __init__.py
│   └── styles.py
├── tests/
│   ├── test_analytics.py
│   └── test_transactions.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Installation

Clone the repository:

```bash
git clone https://github.com/iRachitKaushik/SpendWise.git
cd SpendWise
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

The test suite covers financial analytics, transaction operations, and input validation.

## Database

SpendWise uses SQLite for local data storage. The database and transactions table are initialized automatically when the application starts.

## Author

**Rachit Kaushik**
