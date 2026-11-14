import streamlit as st


def load_css():
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        :root {
            --bg: #080d19;
            --glass: rgba(255, 255, 255, 0.055);
            --border: rgba(255, 255, 255, 0.10);
            --text: #f1f5f9;
            --muted: #94a3b8;
            --accent: #8b9cff;
            --green: #5ee6b0;
        }

        .stApp {
            background:
                radial-gradient(ellipse at 12% 8%, rgba(79, 70, 229, .19), transparent 38%),
                radial-gradient(ellipse at 90% 85%, rgba(16, 185, 129, .10), transparent 35%),
                var(--bg);
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
        }

        [data-testid="stHeader"] {
            background: rgba(8, 13, 25, .65);
        }

        [data-testid="stSidebar"] {
            background: rgba(12, 19, 35, .88);
            border-right: 1px solid var(--border);
            backdrop-filter: blur(22px);
        }

        [data-testid="stMetric"] {
            background: linear-gradient(145deg,
                rgba(255,255,255,.085),
                rgba(255,255,255,.025));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 22px 20px;
            box-shadow: 0 12px 35px rgba(0,0,0,.18);
            transition: transform .25s ease, border-color .25s ease,
                        box-shadow .25s ease;
            animation: card-enter .55s ease both;
        }

        [data-testid="stMetric"]:hover {
            transform: translateY(-4px);
            border-color: rgba(139,156,255,.42);
            box-shadow: 0 16px 38px rgba(0,0,0,.26);
        }

        [data-testid="stMetricLabel"] {
            color: var(--muted);
            font-weight: 500;
        }

        [data-testid="stMetricValue"] {
            color: var(--green);
            font-weight: 800;
            letter-spacing: -1px;
        }

        h1, h2, h3 {
            color: #f8fafc;
            letter-spacing: -.5px;
            font-weight: 700;
        }

        .subtitle {
            color: var(--muted);
            font-size: 14px;
        }

        .stButton > button,
        .stDownloadButton > button {
            background: linear-gradient(135deg,
                rgba(99,102,241,.25),
                rgba(59,130,246,.12));
            color: #f8fafc;
            border: 1px solid rgba(139,156,255,.30);
            border-radius: 12px;
            padding: 8px 18px;
            font-weight: 600;
            transition: all .22s ease;
        }

        .stButton > button:hover,
        .stDownloadButton > button:hover {
            background: rgba(99,102,241,.34);
            border-color: rgba(139,156,255,.65);
            transform: translateY(-2px);
            color: white;
        }

        input, textarea {
            background: rgba(255,255,255,.045) !important;
            border-radius: 11px !important;
        }

        [data-testid="stDataFrame"] {
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
        }

        [data-testid="stPlotlyChart"] {
            background: rgba(255,255,255,.025);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 8px;
        }

        hr {
            border-color: rgba(255,255,255,.09);
        }

        @keyframes card-enter {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: .01ms !important;
                transition-duration: .01ms !important;
            }
        }

        @media (max-width: 768px) {
            [data-testid="stMetric"] {
                padding: 15px;
                border-radius: 15px;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
