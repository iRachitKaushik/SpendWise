import streamlit as st
from datetime import date

from services.recurring import (
    create_recurring_transaction,
    get_recurring_transactions,
    update_recurring_transaction,
    set_recurring_status,
    delete_recurring_transaction,
    confirm_recurring_transaction,
)


def render_recurring_page(user_id):
    st.title("Recurring Transactions")
    st.caption("Manage your scheduled income and expenses.")

    with st.form("create_recurring_form"):
        st.subheader("Create Schedule")

        title = st.text_input("Title")
        col1, col2 = st.columns(2)

        with col1:
            amount = st.number_input("Amount (₹)", min_value=0.01, value=100.0)
            transaction_type = st.selectbox("Type", ["expense", "income"])
            category = st.text_input("Category")

        with col2:
            frequency = st.selectbox(
                "Frequency", ["weekly", "monthly", "yearly"]
            )
            due_date = st.date_input("First due date", value=date.today())
            has_end = st.checkbox("Set an end date")
            end_date = st.date_input(
                "End date", value=date.today(), disabled=not has_end
            )

        submitted = st.form_submit_button(
            "Create Recurring Transaction", use_container_width=True
        )

        if submitted:
            try:
                create_recurring_transaction(
                    title, amount, transaction_type, category,
                    frequency, due_date.isoformat(), user_id,
                    end_date.isoformat() if has_end else None,
                )
                st.success("Recurring transaction created.")
                st.rerun()
            except Exception as error:
                st.error(f"Unable to create schedule: {error}")

    st.divider()
    st.subheader("Your Schedules")

    try:
        records = get_recurring_transactions(user_id)
    except Exception as error:
        st.error(f"Unable to load schedules: {error}")
        return

    if not records:
        st.info("No recurring transactions yet.")
        return

    for item in records:
        rid = item["id"]
        due = date.fromisoformat(item["next_due_date"])
        active = item["is_active"]

        with st.expander(
            f"{item['title']} — ₹{float(item['amount']):,.2f}"
            f" {'(Active)' if active else '(Paused)'}"
        ):
            st.write(
                f"**Type:** {item['type'].title()}  |  "
                f"**Category:** {item['category']}"
            )
            st.write(
                f"**Frequency:** {item['frequency'].title()}  |  "
                f"**Next due:** {due.strftime('%d %b %Y')}"
            )

            with st.form(f"edit_recurring_{rid}"):
                st.markdown("**Edit Schedule**")
                new_title = st.text_input(
                    "Title", value=item["title"], key=f"title_{rid}"
                )
                col1, col2 = st.columns(2)

                with col1:
                    new_amount = st.number_input(
                        "Amount (₹)", min_value=0.01,
                        value=float(item["amount"]), key=f"amount_{rid}"
                    )
                    new_type = st.selectbox(
                        "Type", ["expense", "income"],
                        index=["expense", "income"].index(item["type"]),
                        key=f"type_{rid}"
                    )
                    new_category = st.text_input(
                        "Category", value=item["category"],
                        key=f"category_{rid}"
                    )

                with col2:
                    new_frequency = st.selectbox(
                        "Frequency", ["weekly", "monthly", "yearly"],
                        index=["weekly", "monthly", "yearly"].index(
                            item["frequency"]
                        ),
                        key=f"frequency_{rid}"
                    )
                    new_due = st.date_input(
                        "Next due date", value=due, key=f"due_{rid}"
                    )
                    old_end = item.get("end_date")
                    set_end = st.checkbox(
                        "Set end date", value=bool(old_end),
                        key=f"has_end_{rid}"
                    )
                    new_end = st.date_input(
                        "End date",
                        value=date.fromisoformat(old_end) if old_end else due,
                        disabled=not set_end,
                        key=f"end_{rid}"
                    )

                if st.form_submit_button("Save Changes"):
                    try:
                        update_recurring_transaction(
                            rid, new_title, new_amount, new_type,
                            new_category, new_frequency,
                            new_due.isoformat(), user_id,
                            new_end.isoformat() if set_end else None,
                        )
                        st.success("Schedule updated.")
                        st.rerun()
                    except Exception as error:
                        st.error(f"Update failed: {error}")

            col1, col2 = st.columns(2)

            with col1:
                if st.button(
                    "Pause" if active else "Resume",
                    key=f"toggle_{rid}",
                    use_container_width=True,
                ):
                    try:
                        set_recurring_status(rid, user_id, not active)
                        st.rerun()
                    except Exception as error:
                        st.error(f"Status update failed: {error}")

            with col2:
                if st.button(
                    "Delete Schedule", key=f"delete_{rid}",
                    use_container_width=True,
                ):
                    try:
                        delete_recurring_transaction(rid, user_id)
                        st.success("Schedule deleted.")
                        st.rerun()
                    except Exception as error:
                        st.error(f"Delete failed: {error}")

            if active and due <= date.today():
                if st.button(
                    "Confirm & Add Transaction",
                    key=f"confirm_{rid}",
                    type="primary",
                    use_container_width=True,
                ):
                    try:
                        confirm_recurring_transaction(rid, user_id)
                        st.success("Transaction added successfully.")
                        st.rerun()
                    except Exception as error:
                        st.error(f"Confirmation failed: {error}")
            elif active:
                st.caption("This schedule is not due yet.")
