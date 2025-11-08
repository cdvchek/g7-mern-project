"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "./RegisterPage.module.css";
import FormInput from "../components/FormInput";
import { registerAPI } from "../api";

export default function Register() {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    const togglePassword = () => setShowPassword((prev) => !prev);
    const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

    const onRegister = async (e) => {
        e.preventDefault();

        const timezone = "US/East";
        const currency = "USD";
        const name = `${firstName} ${lastName}`;

        const res = await registerAPI({ email, password, name, timezone, currency });

        if (res.code == 0) {
            setRegisteredEmail(email);
            setIsSuccess(true);
        } else {
            // handle error properly later
            console.log("error registering", res.msg);
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

                <div className={`${styles.loginBox} ${styles.registerBox}`}>
                    <img src="/budgielogo.png" alt="logo" className={styles.logo} />

                    <h2 className={styles.title}>Registration Successful!</h2>

                    <p className={styles.logoText}>
                        We’ve sent a verification email to <b>{registeredEmail}</b>.<br /><br />
                        Please check your inbox and click the verification link before logging in.
                    </p>

                    <p className={styles.loginRedirectText}>
                        Already verified? <a href="/">Login here</a>
                    </p>
                </div>
            </div>
        );
    }

    // NORMAL REGISTER FORM
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

            <div className={`${styles.loginBox} ${styles.registerBox}`}>
                <img src="/budgielogo.png" alt="logo" className={styles.logo} />

                <h2 className={styles.title}>Create Your BΰDGIE Account</h2>
                <p className={styles.logoText}>Please fill in your details to register</p>

                <FormInput name={"First Name"} value={firstName} setValue={setFirstName} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                <FormInput name={"Last Name"} value={lastName} setValue={setLastName} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />

                <FormInput name={"Password"} value={password} setValue={setPassword} show={showPassword} toggleShow={togglePassword} isHidable={true} styles={styles} />
                <FormInput name={"Confirm Password"} value={confirmPassword} setValue={setConfirmPassword} show={showConfirmPassword} toggleShow={toggleConfirmPassword} isHidable={true} styles={styles} />

                <button className={styles.loginButton} onClick={(e) => onRegister(e)}>REGISTER</button>

                <p className={styles.loginRedirectText}>
                    Already have an account? <a href="/">Login here</a>
                </p>
            </div>
        </div>
    );
}
