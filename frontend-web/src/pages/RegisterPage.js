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

    const togglePassword = () => setShowPassword((prev) => !prev);
    const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

    const onRegister = async (e) => {
        e.preventDefault();

        const timezone = "US/East";
        const currency = "USD";
        const name = `${firstName} ${lastName}`;

        const res = await registerAPI({ email, password, name, timezone, currency });

        if (res.code == 0) {
            console.log(res);
            // Close the form and let the user know an email was sent and they can log in after they verify their email
            // Also say something like "Emailed verified? Login here" or something like that
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

            {/* register */}
            <div className={`${styles.loginBox} ${styles.registerBox}`}>
                <img src="/budgielogo.png" alt="logo" className={styles.logo} />

                <h2 className={styles.title}>Create Your BΰDGIE Account</h2>
                <p className={styles.logoText}>Please fill in your details to register</p>

                {/* first name */}
                <FormInput name={"First Name"} value={firstName} setValue={setFirstName} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                {/* last name */}
                <FormInput name={"Last Name"} value={lastName} setValue={setLastName} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />
                {/* email */}
                <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />

                {/* password */}
                <FormInput name={"Password"} value={password} setValue={setPassword} show={showPassword} toggleShow={togglePassword} isHidable={true} styles={styles} />
                {/* confirm password */}
                <FormInput name={"Confirm Password"} value={confirmPassword} setValue={setConfirmPassword} show={showConfirmPassword} toggleShow={toggleConfirmPassword} isHidable={true} styles={styles} />

                {/* register button */}
                <button className={styles.loginButton} onClick={(e) => onRegister(e)}>REGISTER</button>

                {/* login redirect */}
                <p className={styles.loginRedirectText}>
                    Already have an account? <a href="/">Login here</a>
                </p>
            </div>
        </div>
    );
}


