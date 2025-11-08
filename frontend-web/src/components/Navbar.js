"use client"
import styles from "./Dashboard.module.css";

export default function Navbar({ activeTab, setActiveTab }) {
    return (
        <nav className={styles.navbar}>
            <button 
                className={activeTab === "home" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("home")}
            >
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
            </button>

            <button 
                className={activeTab === "envelopes" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("envelopes")}
            >
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 8l9 6l9-6" />
                </svg>
                Envelopes
            </button>

            <button 
                className={activeTab === "accounts" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("accounts")}
            >
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M2 10h20" />
                    <circle cx="7" cy="15" r="1" fill="currentColor" />
                </svg>
                Accounts
            </button>

            <button 
                className={activeTab === "transactions" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("transactions")}
            >
                <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="20.5" r="1" />
                    <circle cx="18" cy="20.5" r="1" />
                    <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1" />
                </svg>
                Transactions
            </button>
        </nav>
    );
}