"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createLinkTokenAPI, exchangeLinkTokenAPI } from "../api";

export default function BanksList({ styles, banks, loading, onOpenBank, onAddBank }) {
    const [linkToken, setLinkToken] = useState(null);
    const [wantOpen, setWantOpen] = useState(false);

    // configure plaid
    const { open, ready, exit } = usePlaidLink({
        token: linkToken || "",
        onSuccess: async (public_token, metadata) => {
            try {
                const institution =
                    metadata?.institution?.name ||
                    metadata?.institution?.institution_id ||
                    "Unknown Institution";

                await exchangeLinkTokenAPI({
                    public_token,
                    institution,
                });

                // trigger parent to refetch banks
                onAddBank?.({ name: institution, institution });
            } finally {
                setLinkToken(null);
                setWantOpen(false);
            }
        },
        onExit: () => {
            setLinkToken(null);
            setWantOpen(false);
        },
    });

    useEffect(() => {
        if (wantOpen && linkToken && ready) open();
    }, [wantOpen, linkToken, ready, open]);

    async function startPlaid() {
        try {
            const res = await createLinkTokenAPI();
            const token = res?.data?.link_token;
            if (!token) throw new Error("No link token returned");
            setLinkToken(token);
            setWantOpen(true);
        } catch (e) {
            console.error("START PLAID ERROR:", e);
        }
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Connected Banks</h3>

                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={startPlaid}>
                    Connect Bank
                </button>
            </div>

            {loading && <div style={{ marginTop: 12, color: "#666" }}>Loading…</div>}

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {banks.map((b) => (
                    <div
                        key={b.id}
                        onClick={() => onOpenBank(b)}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #eee",
                            padding: 12,
                            borderRadius: 6,
                            cursor: "pointer",
                        }}
                        title="Open accounts"
                    >
                        <div>
                            <div style={{ fontWeight: 700 }}>{b.name}</div>
                            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                {b.institution ? `Institution: ${b.institution}` : ""}
                            </div>
                        </div>
                        <div style={{ fontSize: 18, opacity: 0.5 }}>›</div>
                    </div>
                ))}

                {!loading && banks.length === 0 && (
                    <div style={{ color: "#666" }}>No banks connected yet. Connect one above.</div>
                )}
            </div>
        </>
    );
}
