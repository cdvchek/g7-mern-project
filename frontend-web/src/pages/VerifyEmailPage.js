"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";

export default function VerifyEmail() {
    const router = useRouter();
    const [code, setCode] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);

    // video speed
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.7;
        }
    }, []);

    // update boxes
    const handleChange = (element, index) => {

    const value = element.value.replace(/[^0-9]/g, "");
    const newCode = [...code];

    // sep each input
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // move next box
    if (index < 5 && value) {
        inputRefs.current[index + 1].focus();
    }
};
    // move down
    const handleKeyDown = (e, index) => {
        // delete
        if (e.key === "Backspace") {
            e.preventDefault();
            const newCode = [...code];

            // check new box to index
            if (newCode[index]) {
                newCode[index] = "";
                setCode(newCode);
            }
            // move back 
            else if (index > 0) {
                newCode[index - 1] = "";
                setCode(newCode);
                inputRefs.current[index - 1].focus();
            }
        } 
        // move left
        else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1].focus();
        } 
        // move right
        else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // adding ability to paste from email
    const handlePaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").slice(0, 6);
        const newCode = paste.split("");
        setCode(newCode);
        newCode.forEach((char, i) => {
            if (inputRefs.current[i]) inputRefs.current[i].value = char;
        });
        if (newCode.length === 6) {
            inputRefs.current[5].focus();
        }
    };

    // verify api connection
    const onVerify = async (e) => {
        e.preventDefault();
        const enteredCode = code.join("");
        console.log("Entered Code:", enteredCode);

        // add verify email api connection
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
                <h2 className={styles.title}>Verify Email</h2>
                <p className={styles.logoTextOp2}>Enter the 6-digit code sent to your email</p>

                {/* code boxes */}
                <div
                    className={styles.codeInputGroup}
                    onPaste={handlePaste}
                >
                    {code.map((num, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            className={styles.codeInputBox}
                            value={num}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputRefs.current[index] = el)}
                        />
                    ))}
                </div>

                {/* verify button */}
                <button className={styles.loginButton} onClick={onVerify}>
                    VERIFY
                </button>

                <p style={{ color: "black" }}>
                    Didn't receive a code?{" "}
                    <a href="/dashboard" style={{ color: "#007aff" }}>Resend it</a>
                </p>
            </div>
        </div>
    );
}
