import "./LoginInput.module.css";

export default function LoginInput({ title, type, setValue }) {
    return (
        <>
            <span>{title}</span>
            <input type={type} onChange={(e) => setValue(e.target.value)} />
        </>
    );
}
