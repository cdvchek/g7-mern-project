"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "./LoginPage.module.css";
import FormInput from "../components/FormInput";
import { startPasswordResetAPI } from "../api";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");

    const [isSuccess, setIsSuccess] = useState(false);

    const onReset = async (e) => {
        e.preventDefault();

        const res = await startPasswordResetAPI({ email });

        if (res.code == 0) {
            setIsSuccess(true);
        } else {
            console.log("error resetting password", res.msg);
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
                        If an account exists with <b>{email}</b>, you will receive an email shortly with a link to reset your password.
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
                <p className={styles.logoTextOp2}>Please enter your email to receive a password reset link</p>

                <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />

                <button className={styles.loginButton} onClick={(e) => onReset(e)}>SEND RESET LINK</button>

                <a href="/" className={styles.returnLogin}>
                    Return to Login
                </a>
            </div>
        </div>
    );
}
