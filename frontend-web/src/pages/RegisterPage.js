"use client"

import { useState } from "react";

import InputForm from "@/components/InputForm";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div id="background">
            <InputForm />
        </div>
    )
}
