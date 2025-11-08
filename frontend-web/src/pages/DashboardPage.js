"use client"

import { useState } from "react";
import Navbar from "../components/Navbar";
import Settings from "../components/Settings";
import DashboardHome from "../components/DashboardHome";
import DashboardAccounts from "../components/DashboardAccounts";
import DashboardEnvelopes from "../components/DashboardEnvelopes";
import DashboardTransactions from "../components/DashboardTransactions";
import styles from "../components/Dashboard.module.css";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("home");
    
    // sample, replace with actual user data
    const userName = "Tester McTesterson";
    const userEmail = "test@tester.com";
    const userInitials = "TM";

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
            {/* Header with Logo, App Name and User Menu */}
            <div className={styles.header}>
                <img 
                    src="/budgiemail.png" 
                    alt="BΰDGIE Mail Logo" 
                    className={styles.logo}
                />
                <div className={styles.appName}>BΰDGIE</div>
                <Settings 
                    userName={userName}
                    userEmail={userEmail}
                    userInitials={userInitials}
                />
            </div>
            
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className={styles.dashboardContent}>
                {renderContent()}
            </div>
        </div>
    );
}