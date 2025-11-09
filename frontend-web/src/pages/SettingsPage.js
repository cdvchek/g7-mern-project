"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./SettingsPage.module.css";
import dashboardStyles from "../components/Dashboard.module.css";
import FormInput from "../components/FormInput";
import Settings from "../components/Settings";
import { getUser } from "../api/tokens";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = getUser();
        setUser(userData);
    }, []);

    const [username, setUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [email, setEmail] = useState("");
    const [timezone, setTimezone] = useState("");
    const [currency, setCurrency] = useState("");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" or "error"

    // Extract user info with fallbacks
    const userName = user?.name || "Guest User";
    const userEmail = user?.email || "guest@example.com";
    
    const getInitials = (name) => {
        if (!name) return "GU";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };
    
    const userInitials = getInitials(userName);

    const handleConfirmChanges = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!username && !oldPassword && !newPassword && !email && !timezone && !currency) {
            setMessage("Please fill in at least one field to update.");
            setMessageType("error");
            return;
        }

        if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
            setMessage("Both old and new passwords are required to change password.");
            setMessageType("error");
            return;
        }

        // TODO: Add API calls to update user settings
        // Example:
        // const updates = {};
        // if (username) updates.username = username;
        // if (email) updates.email = email;
        // if (timezone) updates.timezone = timezone;
        // if (currency) updates.currency = currency;
        // if (oldPassword && newPassword) {
        //     updates.oldPassword = oldPassword;
        //     updates.newPassword = newPassword;
        // }
        // const res = await updateUserAPI(updates);

        setMessage("Settings updated successfully!");
        setMessageType("success");
        
        // Clear form after successful update
        setTimeout(() => {
            setUsername("");
            setOldPassword("");
            setNewPassword("");
            setEmail("");
            setTimezone("");
            setCurrency("");
            setMessage("");
        }, 2000);
    };

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
                    userInitials={userInitials}
                />
            </div>

            <div className={styles.settingsContainer}>
            <div className={styles.settingsBox}>
                <h2 className={styles.title}>Change Username</h2>
                
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder="Enter a new username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <h2 className={styles.title}>Old Password</h2>
                
                <div className={styles.inputGroup}>
                    <input
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Enter your old password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className={styles.input}
                    />
                    <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className={styles.eyeButton}
                        aria-label="Toggle password visibility"
                    >
                        {showOldPassword ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="#000"
                                strokeWidth="2"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" fill="#000" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="#000"
                                strokeWidth="2"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" fill="#000" />
                                <line x1="2" y1="2" x2="22" y2="22" stroke="#000" strokeWidth="2" />
                            </svg>
                        )}
                    </button>
                </div>

                <h2 className={styles.title}>New Password</h2>
                
                <div className={styles.inputGroup}>
                    <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={styles.input}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={styles.eyeButton}
                        aria-label="Toggle password visibility"
                    >
                        {showNewPassword ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="#000"
                                strokeWidth="2"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" fill="#000" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="#000"
                                strokeWidth="2"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" fill="#000" />
                                <line x1="2" y1="2" x2="22" y2="22" stroke="#000" strokeWidth="2" />
                            </svg>
                        )}
                    </button>
                </div>

                <h2 className={styles.title}>Change Email</h2>
                
                <div className={styles.inputWrapper}>
                    <input
                        type="email"
                        placeholder="Enter your new email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <h2 className={styles.title}>Change Timezone</h2>
                
                <div className={styles.inputWrapper}>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={styles.input}
                    >
                        <option value="">Select Timezone</option>
                        <option value="US/Eastern">US/Eastern</option>
                        <option value="US/Central">US/Central</option>
                        <option value="US/Mountain">US/Mountain</option>
                        <option value="US/Pacific">US/Pacific</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                </div>

                <h2 className={styles.title}>Change Currency</h2>
                
                <div className={styles.inputWrapper}>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={styles.input}
                    >
                        <option value="">Select Currency</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles[messageType]}`}>
                        {message}
                    </div>
                )}

                <button 
                    className={styles.confirmButton}
                    onClick={handleConfirmChanges}
                >
                    CONFIRM CHANGES
                </button>
            </div>
            </div>
        </div>
    );
}