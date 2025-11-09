"use client";

import { useState, useEffect } from "react";
import styles from "./ProfilePage.module.css";
import { getUser } from "../api/tokens";

export default function ProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = getUser();
        setUser(userData);
    }, []);

    if (!user) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.profileBox}>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    // initials 
    const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const initials = getInitials(user.name);

    return (
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
                        <span className={styles.value}>{user.name || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Email:</span>
                        <span className={styles.value}>{user.email || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Timezone:</span>
                        <span className={styles.value}>{user.timezone || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Currency:</span>
                        <span className={styles.value}>{user.currency || "Not set"}</span>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.label}>Account Status:</span>
                        <span className={`${styles.value} ${styles.statusBadge} ${user.is_verified ? styles.verified : styles.unverified}`}>
                            {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                    </div>
                </div>

                <div className={styles.note}>
                    <p>To update your profile information, please visit the Settings page.</p>
                </div>
            </div>
        </div>
    );
}