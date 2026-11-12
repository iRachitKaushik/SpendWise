import streamlit as st
import pandas as pd
import plotly.express as px

from datetime import date
from components.styles import load_css

from database.db import initialize_database
from services.transactions import (
    add_transaction,
    get_all_transactions,
    delete_transaction,
    update_transaction,
)
from services.analytics import (
    calculate_summary,
    category_breakdown,
    monthly_summary,
)

# --------------------------------------------------
# PAGE CONFIGURATION
# --------------------------------------------------

st.set_page_config(
    page_title="SpendWise | Finance Dashboard",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --------------------------------------------------
# CUSTOM CSS
# --------------------------------------------------

load_css()


# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------

initialize_database()


# --------------------------------------------------
# SIDEBAR NAVIGATION
# --------------------------------------------------

st.sidebar.title("💰 SpendWise")
st.sidebar.caption("Personal Finance Analytics")

page = st.sidebar.radio("Navigation", ["Dashboard", "Transactions", "Add Transaction"])

st.sidebar.divider()
st.sidebar.caption("Built with Python, SQLite & Streamlit")


# --------------------------------------------------
# DATA LOADING
# --------------------------------------------------

transactions = get_all_transactions()

df = pd.DataFrame(transactions)


# --------------------------------------------------
# DASHBOARD PAGE
# --------------------------------------------------

if page == "Dashboard":

    st.title("Financial Overview")
    st.markdown(
        '<p class="subtitle">Monitor your financial performance.</p>',
        unsafe_allow_html=True,
    )

    summary = calculate_summary(transactions)

    # KPI CARDS

    with st.container(border=True):
        col1, col2, col3, col4 = st.columns(4)

        col1.metric("Total Income", f"₹{summary['total_income']:,.2f}")

        col2.metric("Total Expenses", f"₹{summary['total_expenses']:,.2f}")

        col3.metric("Current Balance", f"₹{summary['balance']:,.2f}")

        col4.metric("Savings Rate", f"{summary['savings_rate']:.1f}%")

    st.divider()

    if not transactions:
        st.info("No transactions yet. Add your first transaction.")
    else:

        # CATEGORY ANALYSIS

        st.subheader("Expense Distribution")

        category_data = category_breakdown(transactions)

        if not category_data.empty:

            col1, col2 = st.columns(2)

            with col1:
                fig = px.pie(
                    category_data,
                    names="category",
                    values="amount",
                    hole=0.55,
                    title="Spending by Category",
                )

                fig.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="#0e1117",
                    plot_bgcolor="#0e1117",
                    font_color="#f1f5f9",
                )

                st.plotly_chart(fig, use_container_width=True)

            with col2:

                fig = px.bar(
                    category_data,
                    x="category",
                    y="amount",
                    color="amount",
                    title="Category-wise Expenses",
                    labels={"category": "Category", "amount": "Amount (₹)"},
                )

                fig.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="#0e1117",
                    plot_bgcolor="#0e1117",
                    font_color="#f1f5f9",
                    showlegend=False,
                )

                st.plotly_chart(fig, use_container_width=True)

        else:
            st.info("No expense records available for analysis.")

        # MONTHLY ANALYSIS

        st.subheader("Monthly Financial Performance")

        monthly_data = monthly_summary(transactions)

        if not monthly_data.empty:

            monthly_pivot = (
                monthly_data.pivot(index="month", columns="type", values="amount")
                .fillna(0)
                .reset_index()
            )

            fig = px.bar(
                monthly_pivot,
                x="month",
                y=[
                    col for col in ["income", "expense"] if col in monthly_pivot.columns
                ],
                barmode="group",
                title="Monthly Income vs Expenses",
                labels={
                    "value": "Amount (₹)",
                    "month": "Month",
                    "variable": "Transaction Type",
                },
            )

            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="#0e1117",
                plot_bgcolor="#0e1117",
                font_color="#f1f5f9",
            )

            st.plotly_chart(fig, use_container_width=True)

        # RECENT TRANSACTIONS

        st.subheader("Recent Transactions")

        recent = df.head(5)

        st.dataframe(
            recent[["title", "amount", "type", "category", "date"]],
            use_container_width=True,
            hide_index=True,
        )


# --------------------------------------------------
# TRANSACTIONS PAGE
# --------------------------------------------------

elif page == "Transactions":

    st.title("Transaction Management")
    st.caption("View, filter, update and delete your transactions.")

    if not transactions:
        st.info("No transactions available.")
    else:

        df = pd.DataFrame(transactions)

        # FILTERS

        col1, col2 = st.columns(2)

        with col1:
            transaction_filter = st.selectbox(
                "Transaction Type", ["All", "income", "expense"]
            )

        with col2:
            categories = ["All"] + sorted(df["category"].unique().tolist())

            category_filter = st.selectbox("Category", categories)

        filtered = df.copy()

        if transaction_filter != "All":
            filtered = filtered[filtered["type"] == transaction_filter]

        if category_filter != "All":
            filtered = filtered[filtered["category"] == category_filter]

        st.write(f"Showing {len(filtered)} transactions")

        st.dataframe(
            filtered[["id", "title", "amount", "type", "category", "date"]],
            use_container_width=True,
            hide_index=True,
        )

        # CSV EXPORT

        csv_data = filtered.to_csv(index=False).encode("utf-8")

        st.download_button(
            label="Download CSV",
            data=csv_data,
            file_name="spendwise_transactions.csv",
            mime="text/csv",
        )

        st.divider()

        # EDIT TRANSACTION

        st.subheader("Edit Transaction")

        transaction_ids = filtered["id"].tolist()

        if transaction_ids:
            with st.container(border=True):
                st.markdown("#### Update Existing Transaction")

                selected_id = st.selectbox("Select transaction ID", transaction_ids)

                selected = df[df["id"] == selected_id].iloc[0]

                with st.form("edit_transaction_form"):
                    edit_title = st.text_input("Title", value=selected["title"])

                    edit_amount = st.number_input(
                        "Amount (₹)",
                        min_value=0.01,
                        value=float(selected["amount"]),
                        step=100.0,
                    )

                    edit_type = st.selectbox(
                        "Type",
                        ["income", "expense"],
                        index=["income", "expense"].index(selected["type"]),
                    )

                    edit_category = st.text_input(
                        "Category", value=selected["category"]
                    )

                    edit_date = st.date_input(
                        "Date", value=date.fromisoformat(selected["date"])
                    )

                    submitted = st.form_submit_button("Update Transaction")

                    if submitted:
                        try:
                            update_transaction(
                                selected_id,
                                edit_title,
                                edit_amount,
                                edit_type,
                                edit_category,
                                edit_date.isoformat(),
                            )

                            st.success("Transaction updated.")
                            st.rerun()

                        except ValueError as error:
                            st.error(str(error))

        # DELETE TRANSACTION
        st.subheader("Delete Transaction")

        if transaction_ids:
            with st.container(border=True):
                delete_id = st.selectbox(
                    "Choose transaction to delete",
                    transaction_ids,
                    key="delete_id",
                )

                if st.button("Delete Selected Transaction", type="primary"):
                    deleted = delete_transaction(delete_id)

                    if deleted:
                        st.success("Transaction deleted.")
                        st.rerun()
                    else:
                        st.warning("Transaction was not found.")
        else:
            st.info("No transactions available to delete.")


# ADD TRANSACTION PAGE
# --------------------------------------------------

elif page == "Add Transaction":

    st.title("Add New Transaction")
    st.caption("Record your income or expenses.")

    with st.form("add_transaction_form"):

        title = st.text_input("Transaction Title")

        amount = st.number_input("Amount (₹)", min_value=0.01, value=100.0, step=100.0)

        transaction_type = st.selectbox("Transaction Type", ["expense", "income"])

        if transaction_type == "expense":

            category_options = [
                "Food",
                "Travel",
                "Shopping",
                "Rent",
                "Bills",
                "Entertainment",
                "Health",
                "Education",
                "Other",
            ]

        else:

            category_options = [
                "Salary",
                "Freelancing",
                "Business",
                "Investment",
                "Gift",
                "Other",
            ]

        category = st.selectbox("Category", category_options)

        transaction_date = st.date_input("Transaction Date", value=date.today())

        submitted = st.form_submit_button("Save Transaction", type="primary")

        if submitted:

            try:
                transaction_id = add_transaction(
                    title,
                    amount,
                    transaction_type,
                    category,
                    transaction_date.isoformat(),
                )

                st.success(f"Transaction saved successfully! ID: {transaction_id}")

                st.rerun()

            except ValueError as error:
                st.error(str(error))


# --------------------------------------------------
# FOOTER
# --------------------------------------------------

st.divider()

st.caption("SpendWise | Personal Finance Management System | Built with Python")
