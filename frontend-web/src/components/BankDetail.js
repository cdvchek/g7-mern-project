export default function BankDetail({ styles, bank, accounts, onBack, onToggle }) {
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
                <h3 style={{ margin: 0 }}>{bank.name}</h3>
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
                            borderRadius: 6,
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700 }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{a.type}</div>
                            <div style={{ fontSize: 14, marginTop: 6 }}>${Number(a.balance || 0).toLocaleString()}</div>
                        </div>
                        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
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
