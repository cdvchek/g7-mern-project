"use client"
import FormInput from "./FormInput";

import styles from "./InputForm.module.css";

export default function InputForm({ title, inputs }) {

    return (
        <div className={styles.formCard}>
            <h1>{title}</h1>
            {inputs.map((input, i) => (
                <FormInput key={i} name={input.name} setValue={input.setValue} />
            ))}
        </div>
    )
}
