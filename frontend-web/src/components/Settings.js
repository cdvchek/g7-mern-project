"use client"
import { useState, useRef, useEffect } from "react";
import styles from "./Settings.module.css";

export default function Settings({ userName = "Default", userEmail = "default@example.com", userInitials = "DF" }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDashboard = () => {
    console.log("Navigate to Dashboard");
    setIsOpen(false);
  };

  const handleProfile = () => {
    console.log("Navigate to Profile");
    setIsOpen(false);
  };

  const handleSettings = () => {
    console.log("Navigate to Settings");
    setIsOpen(false);
  };

  const handleLogout = () => {
    console.log("Logout user");
    setIsOpen(false);
    // Add your logout logic here
  };

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button 
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className={styles.avatar}>
          <span className={styles.initials}>{userInitials}</span>
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.avatarLarge}>
              <span className={styles.initialsLarge}>{userInitials}</span>
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userEmail}>{userEmail}</div>
            </div>
            <button 
              className={styles.expandButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.optionsSection}>
            <div className={styles.optionsLabel}>Options</div>
            
            <button className={styles.menuItem} onClick={handleDashboard}>
              <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="3" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Dashboard</span>
            </button>

            <button className={styles.menuItem} onClick={handleProfile}>
              <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Profile</span>
            </button>

            <button className={styles.menuItem} onClick={handleSettings}>
              <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.5 4.5L14 6M6 14L4.5 15.5M15.5 15.5L14 14M6 6L4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Settings</span>
            </button>

            <button className={styles.menuItem} onClick={handleLogout}>
              <svg className={styles.icon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 17H4C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3H8M13 13L17 10M17 10L13 7M17 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}