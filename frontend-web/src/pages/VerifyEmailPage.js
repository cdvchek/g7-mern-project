"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./LoginPage.module.css";
import { verifyEmailAPI } from "../api";
import { resendEmailAPI } from "@/api/resendEmailAction";

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const videoRef = useRef(null);

    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("Verifying Email...");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = 0.7;
    }, []);

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");
        setEmail(email);

        if (!token || !email) {
            setStatus("error");
            setMessage("Invalid verification link. Missing token or email.");
            return;
        }

        const verify = async () => {
            const res = await verifyEmailAPI({ email, token });

            if (res.code == 0) {
                setStatus("success");
                setMessage("Your email has been verified.");
            } else {
                setStatus("error");
                setMessage(res.msg);
            }
        };

        verify();
    }, [searchParams]);

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

                {status === "verifying" && (
                    <>
                        <h2 className={styles.title}>Verifying Email</h2>
                        <p className={styles.logoTextOp2}>{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h2 className={styles.title}>Email Verified 🎉</h2>
                        <p className={styles.logoTextOp2}>
                            You can close this tab or continue to login.
                        </p>
                        <a className={styles.loginButton} href="/">
                            Go to Login
                        </a>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className={styles.title}>Verification Failed</h2>
                        <p className={styles.logoTextOp2}>{message}</p>
                        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                            <a className={styles.loginButton} onClick={() => resendEmailAPI({ email })}>
                                Resend Verification Email
                            </a>
                            <a className={styles.loginButton} href="/">
                                Go to Login
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
