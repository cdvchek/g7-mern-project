"use client"
export default function FormInput({ name, setValue }) {
    return (
        <div>
            <span>{name}</span>
            <input onChange={(e) => setValue(e.target.value)}/>
        </div>
    )
}
