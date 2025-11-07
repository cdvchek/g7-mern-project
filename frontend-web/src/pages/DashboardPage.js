"use client"

import { useState } from "react";
import Navbar from "../components/Navbar";
import DashboardHome from "../components/DashboardHome";
import DashboardAccounts from "../components/DashboardAccounts";
import DashboardEnvelopes from "../components/DashboardEnvelopes";
import DashboardTransactions from "../components/DashboardTransactions";
import styles from "../components/Dashboard.module.css";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("home");

    const renderContent = () => {
        switch (activeTab) {
            case "accounts":
                return <DashboardAccounts />;
            case "envelopes":
                return <DashboardEnvelopes />;
            case "transactions":
                return <DashboardTransactions />;
            default:
                return <DashboardHome />;
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className={styles.dashboardContent}>
                {renderContent()}
            </div>
        </div>
    );
}
