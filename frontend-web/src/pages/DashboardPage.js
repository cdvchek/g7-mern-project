"use client"

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Settings from "../components/Settings";
import DashboardHome from "../components/DashboardHome";
import DashboardAccounts from "../components/DashboardAccounts";
import DashboardEnvelopes from "../components/DashboardEnvelopes";
import DashboardTransactions from "../components/DashboardTransactions";
import styles from "../components/Dashboard.module.css";
import { getUser } from "../api/tokens";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = getUser();
        setUser(userData);
    }, []);

    // user info
    const userName = user?.name || "Guest User";
    const userEmail = user?.email || "guest@example.com";
    
    // initials
    const getInitials = (name) => {
        if (!name) return "GU";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    
    const userInitials = getInitials(userName);

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
            {/* Header */}
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