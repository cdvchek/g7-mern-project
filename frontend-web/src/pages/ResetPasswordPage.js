"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import styles from "./LoginPage.module.css";
import FormInput from "../components/FormInput";


export default function ResetPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");

    // const onReset = async (e) => {
    //     e.preventDefault();

    //     // waiting for verification api setup
    //     const res = await verifyAPI({ email });

    //     if (res.code == 0) {
    //         console.log(res);
    //         // router.replace("/dashboard");
    //         // router.refresh();
    //     } else {
    //         // bad and do error handling
    //     }
    // }

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
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.logoTextOp2}>Please enter your email to receive a password reset link</p>

                <FormInput name={"Email"} value={email} setValue={setEmail} show={true} toggleShow={() => { }} isHidable={false} styles={styles} />

                {/* reset button */}
                <button className={styles.loginButton} onClick={(e) => onLogin(e)}>SEND RESET LINK</button>
                
                <a href="/" className={styles.returnLogin}>
                    Return to Login
                </a>

            </div>
        </div>
    );
}
