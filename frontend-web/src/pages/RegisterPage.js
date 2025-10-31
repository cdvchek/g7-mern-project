"use client";

import { useState } from "react";
import React from "react";
import styles from "./RegisterPage.module.css";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  return (
    <div className={styles.page}>
      {/* background */}
      <video
        className={styles.bgVideo}
        src="/wavebg.webm"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* register */}
      <div className={`${styles.loginBox} ${styles.registerBox}`}>
        <img src="/budgielogo.png" alt="logo" className={styles.logo} />

        <h2 className={styles.title}>Create Your BUDGI:3 Account</h2>
        <p className={styles.logoText}>Please fill in your details to register</p>

        {/* first name */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* last name */}
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* email */}
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* password */}
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
              // eye open
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
              // eye slash
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

        {/* confirm password */}
        <div className={styles.inputGroup}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
          <button
            type="button"
            onClick={toggleConfirmPassword}
            className={styles.eyeButton}
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? (
              // eye open
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
              // eye slash
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

        {/* register button */}
        <button className={styles.loginButton}>REGISTER</button>

        {/* login redirect */}
        <p className={styles.loginRedirectText}>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}


