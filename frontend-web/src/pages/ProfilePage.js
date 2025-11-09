"use client";

import { useState, useEffect } from "react";
import styles from "./ProfilePage.module.css";
import dashboardStyles from "../components/Dashboard.module.css";
import Settings from "../components/Settings";
import { getUser } from "../api/tokens";

export default function ProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = getUser();
        setUser(userData);
    }, []);

    // Extract user info with fallbacks
    const userName = user?.name || "Guest User";
    const userEmail = user?.email || "guest@example.com";
    
    // Extract initials from name
    const getInitials = (name) => {
        if (!name) return "GU";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const initials = getInitials(userName);

    return (
        <div className={dashboardStyles.dashboardContainer}>
            {/* Header with Logo, App Name and User Menu */}
            <div className={dashboardStyles.header}>
                <img 
                    src="/budgiemail.png" 
                    alt="BΰDGIE Mail Logo" 
                    className={dashboardStyles.logo}
                />
                <div className={dashboardStyles.appName}>BΰDGIE</div>
                <Settings 
                    userName={userName}
                    userEmail={userEmail}
                    userInitials={initials}
                />
            </div>

            <div className={styles.profileContainer}>
            <div className={styles.profileBox}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarLarge}>
                        <span className={styles.initials}>{initials}</span>
                    </div>
                </div>

                <div className={styles.infoSection}>
                    <h2 className={styles.title}>Profile Information</h2>
                    
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Name:</span>
                        <span className={styles.value}>{userName}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Email:</span>
                        <span className={styles.value}>{userEmail}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Timezone:</span>
                        <span className={styles.value}>{user?.timezone || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Currency:</span>
                        <span className={styles.value}>{user?.currency || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Account Status:</span>
                        <span className={`${styles.value} ${styles.statusBadge} ${user?.is_verified ? styles.verified : styles.unverified}`}>
                            {user?.is_verified ? "Verified" : "Unverified"}
                        </span>
                    </div>
                </div>

                <div className={styles.note}>
                    <p>To update your profile information, please visit the Settings page.</p>
                </div>
            </div>
            </div>
        </div>
    );
}