"use client";

const formatUSD = (cents) =>
    (Number(cents || 0) / 100).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
    });

export default function BankDetail({ bank, accounts, onBack, onToggle, onDelete }) {
    return (
        <div>
            {/* Header with back + delete */}
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
                <h3 style={{ margin: 0, flex: 1 }}>
                    {bank?.institution_name || bank?.name || "Bank"}
                </h3>
                <button
                    onClick={() => onDelete?.(bank?.item_id)}
                    style={{
                        border: "none",
                        background: "#ff4d4f",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                    title="Delete this bank connection"
                >
                    Delete
                </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
                {accounts.map((a) => (
                    <div
                        key={a.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #eee",
                            padding: 12,
                            borderRadius: 8,
                            background: "#fff",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700 }}>
                                {a.name || a.official_name || "Account"}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                                {[a.type, a.subtype].filter(Boolean).join(" • ")}
                                {a.mask ? ` • ••${a.mask}` : ""}
                            </div>
                            <div style={{ fontSize: 14, marginTop: 8 }}>
                                {formatUSD(a.balance_current)}
                            </div>
                        </div>

                        <label
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                fontSize: 13,
                                userSelect: "none",
                            }}
                            title="Include this account in your tracked total"
                        >
                            <input
                                type="checkbox"
                                checked={!!a.tracking}
                                onChange={(e) => onToggle?.(a.id, e.target.checked)}
                            />
                            Enable Tracking
                        </label>
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div style={{ color: "#666" }}>No accounts found for this bank.</div>
                )}
            </div>
        </div>
    );
}
