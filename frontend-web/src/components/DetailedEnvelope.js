import { useState } from "react";

export default function DetailedEnvelope({ styles, envelope, onBack, onEdit, onDelete }) {
    const balance = envelope.amount ?? envelope.balance ?? 0;
    const goal = envelope.monthly_target ?? envelope.goal ?? 0;

    return (
        <div>
            {/* Header with back arrow */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <button
                    aria-label="Back"
                    onClick={onBack}
                    style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 22,
                        lineHeight: 1,
                        cursor: "pointer",
                        padding: "2px 6px",
                    }}
                    title="Back"
                >
                    ←
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                        aria-hidden
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: envelope.color || "#999",
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                        }}
                    />
                    <h3 style={{ margin: 0 }}>{envelope.name}</h3>
                </div>
            </div>

            {/* Summary card */}
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                    display: "grid",
                    gap: 8,
                }}
            >
                <div><strong>Balance:</strong> ${balance}</div>
                <div><strong>Monthly Goal:</strong> ${goal}</div>
                {/* Add transactions history here later */}
            </div>

            {/* Actions only here (Edit/Delete) */}
            <div style={{ display: "flex", gap: 8 }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onEdit}>
                    Edit
                </button>
                <button className={`${styles.btn} ${styles.btnAccent}`} onClick={onDelete}>
                    Delete
                </button>
            </div>
        </div>
    );
}
