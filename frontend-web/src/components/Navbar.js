"use client"
import styles from "./Dashboard.module.css";

export default function Navbar({ activeTab, setActiveTab }) {
    return (
        <nav className={styles.navbar}>
            <button 
                className={activeTab === "home" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("home")}
            >
                Home
            </button>

            <button 
                className={activeTab === "accounts" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("accounts")}
            >
                Accounts
            </button>

            <button 
                className={activeTab === "envelopes" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("envelopes")}
            >
                Envelopes
            </button>

            <button 
                className={activeTab === "transactions" ? styles.activeButton : styles.navButton}
                onClick={() => setActiveTab("transactions")}
            >
                Transactions
            </button>
        </nav>
    );
}
