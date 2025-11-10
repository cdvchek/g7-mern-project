"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createLinkTokenAPI, exchangeLinkTokenAPI } from "../api";

export default function BanksList({ styles, banks, loading, onOpenBank, onAddBank }) {
    const [linkToken, setLinkToken] = useState(null);
    const [wantOpen, setWantOpen] = useState(false);
    const [starting, setStarting] = useState(false);

    // Configure Plaid Link
    const { open, ready, exit } = usePlaidLink({
        token: linkToken || "",
        onSuccess: async (public_token, metadata) => {
            try {
                const inst = metadata?.institution
                    ? { name: metadata.institution.name || "Unknown Institution", institution_id: metadata.institution.institution_id || "" }
                    : { name: "Unknown Institution", institution_id: "" };

                await exchangeLinkTokenAPI({
                    public_token,
                    institution: inst, // << send full object
                });

                // Ask parent to re-fetch banks (or do it here if you control state)
                onAddBank?.(inst);
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

    // Open Link when token is ready
    useEffect(() => {
        if (wantOpen && linkToken && ready) {
            open();
            setStarting(false);
        }
    }, [wantOpen, linkToken, ready, open]);

    async function startPlaid() {
        try {
            setStarting(true);
            const res = await createLinkTokenAPI();
            const token = res?.data?.link_token;
            if (!token) throw new Error("No link token returned");
            setLinkToken(token);
            setWantOpen(true);
        } catch (e) {
            console.error("START PLAID ERROR:", e);
            setStarting(false);
        }
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Connected Banks</h3>

                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={startPlaid}
                    disabled={starting} // optional guard
                    aria-busy={starting ? "true" : "false"}
                >
                    {starting ? "Starting…" : "Connect Bank"}
                </button>
            </div>

            {loading && <div style={{ marginTop: 12, color: "#666" }}>Loading…</div>}

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {banks.map((b) => {
                    const instName = b.institution?.name || b.name || "Bank";
                    const instId = b.institution?.institution_id || b.institution_id || "";
                    return (
                        <div
                            key={b.id || b.item_id}
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
                                <div style={{ fontWeight: 700 }}>{instName}</div>
                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                    {instId ? `Institution ID: ${instId}` : ""}
                                </div>
                            </div>
                            <div style={{ fontSize: 18, opacity: 0.5 }}>›</div>
                        </div>
                    );
                })}

                {!loading && banks.length === 0 && (
                    <div style={{ color: "#666" }}>No banks connected yet. Connect one above.</div>
                )}
            </div>
        </>
    );
}
