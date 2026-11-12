import streamlit as st


def load_css():
    st.markdown(
        """
        <style>
        /* Main application background */
        .stApp {
            background:
                radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.16), transparent 35%),
                radial-gradient(circle at 85% 80%, rgba(139, 92, 246, 0.14), transparent 35%),
                #0b1020;
            color: #f1f5f9;
        }

        /* Sidebar */
        [data-testid="stSidebar"] {
            background: rgba(15, 23, 42, 0.82);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Metric cards */
        [data-testid="stMetric"] {
            background: rgba(255, 255, 255, 0.055);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        }

        [data-testid="stMetricValue"] {
            color: #6ee7b7;
        }

        /* Headings and secondary text */
        h1, h2, h3 {
            color: #f8fafc;
        }

        .subtitle {
            color: #94a3b8;
            font-size: 14px;
        }

        /* Buttons */
        .stButton > button,
        .stDownloadButton > button {
            background: rgba(59, 130, 246, 0.16);
            color: #e2e8f0;
            border: 1px solid rgba(96, 165, 250, 0.35);
            border-radius: 10px;
            transition: all 0.2s ease;
        }

        .stButton > button:hover,
        .stDownloadButton > button:hover {
            background: rgba(59, 130, 246, 0.28);
            border-color: rgba(96, 165, 250, 0.7);
            color: #ffffff;
        }

        /* Form controls */
        input, textarea {
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 9px !important;
        }

        /* Data tables */
        [data-testid="stDataFrame"] {
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 12px;
            overflow: hidden;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
