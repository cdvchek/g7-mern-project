"use client"

import { useState } from "react";

import InputForm from "@/components/InputForm";

import styles from "./LoginPage.module.css"

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const inputs = [
        { name: "Email", setValue: setEmail },
        { name: "Password", setValue: setPassword }
    ];

    return (
        <div className={styles.background}>
            <InputForm title={"Login"} inputs={inputs} />
        </div>
    )
}
