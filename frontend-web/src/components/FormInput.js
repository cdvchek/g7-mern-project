"use client"
export default function FormInput({ name, value, setValue, show, toggleShow, isHidable, styles }) {
    return (
        <div className={styles.inputGroup}>
            <input
                type={show ? "text" : "password"}
                placeholder={name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={styles.input}
            />
            {isHidable &&
                <button
                    type="button"
                    onClick={toggleShow}
                    className={styles.eyeButton}
                    aria-label="Toggle password visibility"
                >
                    {show ? (
                        // eye open
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="#000"
                            strokeWidth="2"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="#000" />
                        </svg>
                    ) : (
                        // eye slash
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="#000"
                            strokeWidth="2"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" fill="#000" />
                            <line x1="2" y1="2" x2="22" y2="22" stroke="#000" strokeWidth="2" />
                        </svg>
                    )}
                </button>
            }
        </div>
    )
}