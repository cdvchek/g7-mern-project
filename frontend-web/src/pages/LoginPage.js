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

    const togglePassword = () => setShowPassword((prev) => !prev);

    const onLogin = async (e) => {
        e.preventDefault();

        if (email.trim() === "" || password === "") {
            console.log("im sorta working");
            return
        }

        const res = await loginAPI({ email, password });

        if (res.code == 0) {
            console.log(res);
            // router.replace("/dashboard");
            // router.refresh();
        } else {
            // bad and do error handling
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

                <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                <FormInput name={"Password"} value={password} setValue={setPassword} show={showPassword} toggleShow={togglePassword} isHidable={true} styles={styles} />

                <a href="/reset_password" className={styles.forgot}>
                    Forgot Password?
                </a>

                {/* login button */}
                <button className={styles.loginButton} onClick={(e) => onLogin(e)}>LOGIN</button>

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
