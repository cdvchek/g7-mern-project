"use client";

import { useState } from "react";
import React from "react";
import styles from "./RegisterPage.module.css";

// import Navbar from "../components/Navbar";
// import DashboardHome from "../components/DashboardHome"
// import DashboardAccounts from "../components/DashboardAccounts"
// import DashboardEnvelopes from "../components/DashboardEnvelopes"
// import DashboardTransactions from "../components/DashboardTransactions"

const DashboardPage = {
    HOME: 0,
    ACCOUNTS: 1,
    ENVELOPES: 2,
    TRANSACTIONS: 3
}

export default function Dashboard() {
    const [dashboardPage, setDashboardPage] = useState(Dashboard.HOME)

    const renderPage = () => {
        switch (dashboardPage) {
            // case DashboardPage.HOME: return <DashboardHome />
            // case DashboardPage.ACCOUNTS: return <DashboardAccounts />
            // case DashboardPage.ENVELOPES: return <DashboardEnvelopes />
            // case DashboardPage.TRANSACTIONS: return <DashboardTransactions />
            default: return <></>
        }
    }

    return (
        <div className={styles.page}>
            <Navbar page={dashboardPage} setPage={setDashboardPage} enum={DashboardPage} />
            {renderPage()}
        </div>
    );
}