"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./LoginPage.module.css";
import FormInput from "../components/FormInput";
import { resendEmailAPI } from "../api";

export default function ResendVerificationEmail() {
    const [email, setEmail] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const showEmailEmpty = () => {
        setErrorMessage("An email is required.");
    }

    // returns true if good email, false if bad
    const checkEmailStructure = () => {
        const regex = /^[^@]+@[^@]+\.[^@]+$/;
        return regex.test(email);
    };

    const showBadEmail = () => {
        setErrorMessage("Enter a valid email.");
    }

    const onReset = async (e) => {
        e.preventDefault();

        if (email.trim() === "") return showEmailEmpty();
        if (!checkEmailStructure()) return showBadEmail();

        const res = await resendEmailAPI({ email });

        if (res.code == 0) {
            setIsSuccess(true);
        } else {
            const error = res.data.error || "Try again later."
            setErrorMessage(error);
        }
    }

    // video speed code
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.7;
        }
    }, []);

    // SUCCESS SCREEN
    if (isSuccess) {
        return (
            <div className={styles.page}>
                <video
                    ref={videoRef}
                    className={styles.bgVideo}
                    src="/wavebg.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                <div className={styles.loginBox}>
                    <img src="/budgielogo.png" alt="logo" className={styles.logo} />

                    <h2 className={styles.title}>Email Sent!</h2>

                    <p className={styles.logoTextOp2}>
                        If an account exists with <b>{email}</b>, you will receive an email shortly with a link to verify your email.
                    </p>

                    <a href="/" className={styles.returnLogin}>
                        Return to Login
                    </a>
                </div>
            </div>
        );
    }

    // DEFAULT VIEW
    return (
        <div className={styles.page}>
            <video
                ref={videoRef}
                className={styles.bgVideo}
                src="/wavebg.webm"
                autoPlay
                loop
                muted
                playsInline
            />

            <div className={styles.loginBox}>
                <img src="/budgielogo.png" alt="logo" className={styles.logo} />
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.logoTextOp2}>Please enter your email to receive a email verification link</p>

                <form onSubmit={onReset}>
                    <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />

                    {errorMessage && (
                        <p className={styles.errorMessage}>{errorMessage}</p>
                    )}

                    <button className={styles.loginButton} onClick={(e) => onReset(e)}>SEND VERIFICATION LINK</button>
                </form>

                <a href="/" className={styles.returnLogin}>
                    Return to Login
                </a>
            </div>
        </div>
    );
}
