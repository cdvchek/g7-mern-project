"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "./LoginPage.module.css";
import FormInput from "../components/FormInput";
import { loginAPI } from "../api";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const togglePassword = () => setShowPassword((prev) => !prev);

    const showEmailEmpty = () => {
        setErrorMessage("An email is required.");
    }

    const showPasswordEmpty = () => {
        setErrorMessage("A password is required.");
    }

    // returns true if good email, false if bad
    const checkEmailStructure = () => {
        const regex = /^[^@]+@[^@]+\.[^@]+$/;
        return regex.test(email);
    };

    const showBadEmail = () => {
        setErrorMessage("Enter a valid email.");
    }

    const onLogin = async (e) => {
        e.preventDefault();

        // input validation
        if (email.trim() === "") return showEmailEmpty();
        if (password === "") return showPasswordEmpty();
        if (!checkEmailStructure()) return showBadEmail();

        // hit backend to login
        const res = await loginAPI({ email, password });

        // check the backend response
        if (res.code == 0) {
            router.push("/dashboard");
        } else {
            const error = res.data.error || "Try again later.";
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
                <h2 className={styles.title}>Welcome to BΰDGIE</h2>
                <p className={styles.logoText}>Please enter your login details to continue</p>

                <form className={styles.form} onSubmit={onLogin}>
                    <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                    <FormInput name={"Password"} value={password} setValue={setPassword} show={showPassword} toggleShow={togglePassword} isHidable={true} styles={styles} />

                    {errorMessage && (
                        <p className={styles.errorMessage}>{errorMessage}</p>
                    )}

                    <div className={styles.forgotRow}>
                        <a href="/forgot_password" className={styles.forgot}>
                            Forgot Password?
                        </a>
                        <a href="resend_verification_email" className={styles.forgot}>
                            Email not verified?
                        </a>
                    </div>

                    {/* login button */}
                    <button className={styles.loginButton} onClick={(e) => onLogin(e)}>LOGIN</button>
                </form>

                {/* separator */}
                <div className={styles.separatorContainer}>
                    <span className={styles.separatorLine}></span>
                    <span className={styles.separatorText}>or</span>
                    <span className={styles.separatorLine}></span>
                </div>

                {/* sign up button */}
                <button className={styles.signupButton}><a href="/register">SIGN UP</a></button>
            </div>
        </div>
    );
}
