"use client";

import { useState } from "react";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <div className={styles.page}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Login</h2>

        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          <button
            type="button"
            onClick={togglePassword}
            className={styles.eyeButton}
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              /* eye open (password visible) */
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
              /* eye slash (password is hidden)*/
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
                <line x1="2" y1="2" x2="22" y2="22" stroke="#000" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>

        <a href="#" className={styles.forgot}>
          Forgot Password?
        </a>

        <button className={styles.loginButton}>LOGIN</button>
      </div>
    </div>
  );
}
