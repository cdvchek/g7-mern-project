"use client";

const bankIdOf = (b) => b?.item_id ?? b?.id ?? b?._id ?? null;

export default function BanksList({
    styles,
    banks = [],
    loading = false,
    onOpenBank,
    onConnectBank,
    starting = false,
}) {
    const safeBanks = Array.isArray(banks) ? banks : [];

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Connected Banks</h3>

                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={onConnectBank}
                    disabled={starting}
                    aria-busy={starting ? "true" : "false"}
                >
                    {starting ? "Starting…" : "Connect Bank"}
                </button>
            </div>

            {loading && <div style={{ marginTop: 12, color: "#666" }}>Loading…</div>}

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {safeBanks.map((b, idx) => {
                    const instName = b?.institution_name || b?.name || "Bank";
                    const instId = b?.institution?.institution_id || b?.institution_id || "";
                    const key = bankIdOf(b) ?? `bank-${idx}`;

                    return (
                        <div
                            key={key}
                            onClick={() => onOpenBank?.(b)}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                border: "1px solid #eee",
                                padding: 12,
                                borderRadius: 8,
                                cursor: "pointer",
                                background: "#fff",
                            }}
                            title="Open accounts"
                        >
                            <div>
                                <div style={{ fontWeight: 700 }}>{instName}</div>
                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                    {instId ? `Institution ID: ${instId}` : ""}
                                </div>
                            </div>
                            <div style={{ fontSize: 18, opacity: 0.5 }}>›</div>
                        </div>
                    );
                })}

                {!loading && safeBanks.length === 0 && (
                    <div style={{ color: "#666" }}>No banks connected yet. Connect one above.</div>
                )}
            </div>
        </>
    );
}
