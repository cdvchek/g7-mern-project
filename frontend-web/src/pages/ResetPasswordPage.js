"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./LoginPage.module.css";
import { resetPasswordAPI, startPasswordResetAPI } from "../api";
import FormInput from "../components/FormInput";

export default function ResetPassword() {
    const searchParams = useSearchParams();
    const videoRef = useRef(null);

    const [status, setStatus] = useState("verifying"); // verifying -> form | error | success
    const [message, setMessage] = useState("Checking reset link...");
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");

    // password inputs
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = 0.7;
    }, []);

    // just parse params; do NOT call resetPasswordAPI here
    useEffect(() => {
        const t = searchParams.get("token") || "";
        const e = searchParams.get("email") || "";
        setEmail(e);
        setToken(t);

        if (!t || !e) {
            setStatus("error");
            setMessage("Invalid or incomplete reset link. Missing token or email.");
        } else {
            setStatus("form");
            setMessage("Enter your new password below.");
        }
    }, [searchParams]);

    const onSubmitNewPassword = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (!password || !confirmPassword) {
            setMessage("Please enter and confirm your new password.");
            setStatus("form");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match. Please try again.");
            setStatus("form");
            return;
        }

        setSubmitting(true);
        const res = await resetPasswordAPI({ email, token, newPassword: password });
        setSubmitting(false);

        if (res?.code === 0) {
            setStatus("success");
            setMessage("Your password has been reset.");
        } else {
            setStatus("error");
            setMessage(res?.msg || "Could not reset your password. The link may be invalid or expired.");
        }
    };

    const onResend = async () => {
        if (!email) return;
        const res = await startPasswordResetAPI({ email });
        if (res?.code === 0) {
            setMessage(`A new reset email has been sent to ${email}.`);
        } else {
            setMessage(res?.msg || "Could not resend the reset email. Please try again later.");
        }
    };

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
                        <h2 className={styles.title}>Verifying Link</h2>
                        <p className={styles.logoTextOp2}>{message}</p>
                    </>
                )}

                {status === "form" && (
                    <>
                        <h2 className={styles.title}>Set New Password</h2>
                        {message && <p className={styles.logoTextOp2}>{message}</p>}

                        <FormInput
                            name={"New Password"}
                            value={password}
                            setValue={setPassword}
                            show={showPassword}
                            toggleShow={() => setShowPassword((s) => !s)}
                            isHidable={true}
                            styles={styles}
                        />

                        <FormInput
                            name={"Confirm New Password"}
                            value={confirmPassword}
                            setValue={setConfirmPassword}
                            show={showConfirmPassword}
                            toggleShow={() => setShowConfirmPassword((s) => !s)}
                            isHidable={true}
                            styles={styles}
                        />

                        <button
                            className={styles.loginButton}
                            onClick={onSubmitNewPassword}
                            disabled={submitting}
                            aria-busy={submitting}
                        >
                            {submitting ? "Saving..." : "Save Password"}
                        </button>

                        <a href="/" className={styles.returnLogin} style={{ marginTop: 12 }}>
                            Cancel & Return to Login
                        </a>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h2 className={styles.title}>Password Updated 🎉</h2>
                        <p className={styles.logoTextOp2}>
                            Your password has been reset. You can now log in with your new password.
                        </p>
                        <a className={styles.loginButton} href="/">
                            Go to Login
                        </a>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2 className={styles.title}>Reset Link Problem</h2>
                        <p className={styles.logoTextOp2}>{message}</p>
                        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                            {email && (
                                <button className={styles.loginButton} onClick={onResend}>
                                    Resend Reset Email
                                </button>
                            )}
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
