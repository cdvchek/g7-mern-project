"use client"

import { useState } from "react";

import FormInput from "./FormInput";

export default function LoginPage({ inputs }) {

    return (
        <div id="background">
            <InputForm inputs={inputs} />
        </div>
    )
}
