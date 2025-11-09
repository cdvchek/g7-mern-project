"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SettingsPage.module.css";
import FormInput from "../components/FormInput";
import { getUser } from "../api/tokens";

export default function SettingsPage() {
    const router = useRouter();
    const user = getUser();

    const [username, setUsername] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [email, setEmail] = useState("");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const handleConfirmChanges = async (e) => {
        e.preventDefault();
        
        if (!username && !oldPassword && !newPassword && !email) {
            setMessage("Please fill in at least one field to update.");
            setMessageType("error");
            return;
        }

        if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
            setMessage("Both old and new passwords are required to change password.");
            setMessageType("error");
            return;
        }

        // api integration to update user settings needed

        setMessage("Settings updated successfully!");
        setMessageType("success");
        
        // clear after setting update
        setTimeout(() => {
            setUsername("");
            setOldPassword("");
            setNewPassword("");
            setEmail("");
            setMessage("");
        }, 2000);
    };

    return (
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
                        placeholder="Enter your new email. We will refer you to the email confirmation screen."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                    />
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
    );
}