"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Dashboard.module.css";
import { getMyTransactionsAPI, getMyEnvelopesAPI } from "../api";
import TransactionAllocationModal from "./TransactionAllocationModal";

// helpers
const toInt = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : def;
};
const formatMoneyCents = (cents) => {
    const n = toInt(cents);
    const sign = n < 0 ? "-" : "+";
    const abs = Math.abs(n);
    return `${sign} $${(abs / 100).toFixed(2)}`;
};
const pct = (part, total) => {
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
};

export default function DashboardTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTx, setActiveTx] = useState(null);
    const [envelopes, setEnvelopes] = useState([]);

    async function refresh() {
        setLoading(true);
        setError("");
        try {
            const [txRes, envRes] = await Promise.all([
                getMyTransactionsAPI({}),
                getMyEnvelopesAPI(),
            ]);

            const rawTx = txRes?.data?.transactions ?? txRes?.data?.data ?? txRes?.data ?? [];
            const formattedTx = (Array.isArray(rawTx) ? rawTx : []).map((t) => {
                const amount = toInt(t.amount_cents ?? t.amount ?? 0, 0);
                const allocated = toInt(t.allocated_cents ?? t.allocated ?? 0, 0);
                const absTotal = Math.abs(amount);
                const absAllocated = Math.min(absTotal, Math.abs(allocated));
                const remaining = Math.max(0, absTotal - absAllocated);

                return {
                    id: t.id || t._id,
                    amount_cents: amount,            // signed
                    allocated_cents: absAllocated,   // >= 0
                    remaining_cents: remaining,      // >= 0
                    allocated_pct: absTotal > 0 ? pct(absAllocated, absTotal) : 0,
                    name: t.name || t.merchant_name || "Unnamed",
                    account: t.account?.name || t.account_id?.name || "Unknown",
                    dateISO: t.posted_at || t.createdAt || t.date || null,
                };
            });

            formattedTx.sort((a, b) => new Date(a.dateISO || 0) - new Date(b.dateISO || 0));
            setTransactions(formattedTx);

            const rawEnv = envRes?.data?.envelopes ?? envRes?.data?.data ?? envRes?.data ?? [];
            const normalizedEnvs = (Array.isArray(rawEnv) ? rawEnv : []).map((e) => ({
                id: e.id || e._id,
                name: e.name,
                color: e.color || "#22c55e",
                amount: toInt(e.amount ?? e.amount_cents ?? 0, 0),
            }));
            setEnvelopes(normalizedEnvs);
        } catch (e) {
            console.error(e);
            setError("Failed to load transactions or envelopes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    // Oldest transaction that still has remaining > 0
    const oldestNeedingAllocationId = useMemo(() => {
        const tx = transactions.find((t) => t.remaining_cents > 0);
        return tx?.id ?? null;
    }, [transactions]);

    // filter by query
    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return transactions;
        return transactions.filter(
            (t) => t.name.toLowerCase().includes(q) || t.account.toLowerCase().includes(q)
        );
    }, [transactions, query]);

    const onRowClick = (t) => {
        const isOldestNeeding = t.id === oldestNeedingAllocationId;
        if (!isOldestNeeding || t.remaining_cents <= 0) return;
        if (envelopes.length === 0) {
            setError("You have no envelopes yet. Create an envelope first.");
            return;
        }
        setActiveTx(t);
        setModalOpen(true);
    };

    if (loading) return <div className={styles.card}>Loading transactions...</div>;

    return (
        <div className={styles.card}>
            <h3>Transaction History</h3>

            <div style={{ marginTop: 10, marginBottom: 12, display: "flex", gap: 8 }}>
                <input
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: 8, width: 260, borderRadius: 6, border: "1px solid #ddd" }}
                />
                {oldestNeedingAllocationId && (
                    <span
                        style={{
                            fontSize: 12,
                            background: "#eef7ff",
                            color: "#0561c9",
                            padding: "6px 10px",
                            borderRadius: 999,
                        }}
                    >
                        Next to allocate: #{String(oldestNeedingAllocationId).slice(-6)}
                    </span>
                )}
            </div>

            {error && (
                <div style={{ marginBottom: 10, color: "crimson", fontSize: 13 }}>
                    {error}
                </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                        <th style={{ padding: 8 }}>Transaction</th>
                        <th>Account</th>
                        <th>Change</th>
                        <th>Allocated</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((t) => {
                        const rowClickable = t.id === oldestNeedingAllocationId && t.remaining_cents > 0;
                        const positive = toInt(t.amount_cents) >= 0;
                        const status =
                            t.remaining_cents === 0
                                ? "Fully Allocated"
                                : t.id === oldestNeedingAllocationId
                                    ? "Ready"
                                    : "Locked";

                        return (
                            <tr
                                key={t.id}
                                onClick={() => onRowClick(t)}
                                style={{
                                    borderBottom: "1px dashed #f0f0f0",
                                    cursor: rowClickable ? "pointer" : "default",
                                    background: rowClickable ? "#fcfffa" : undefined,
                                    opacity: !rowClickable && t.remaining_cents > 0 ? 0.6 : 1,
                                }}
                            >
                                <td style={{ padding: 8, fontWeight: 500 }}>{t.name}</td>
                                <td style={{ padding: 8 }}>{t.account}</td>
                                <td
                                    style={{
                                        padding: 8,
                                        color: positive ? "#0b7a28" : "crimson",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatMoneyCents(t.amount_cents)}
                                </td>
                                <td style={{ padding: 8 }}>
                                    <div style={{ fontSize: 12 }}>
                                        {formatMoneyCents(t.allocated_cents).replace("+ ", "")} /{" "}
                                        {formatMoneyCents(Math.abs(t.amount_cents)).replace("+ ", "")} ({t.allocated_pct}%)
                                    </div>
                                </td>
                                <td style={{ padding: 8 }}>
                                    {t.dateISO ? new Date(t.dateISO).toLocaleDateString() : "-"}
                                </td>
                                <td style={{ padding: 8 }}>
                                    {status === "Fully Allocated" ? (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                background: "#eaf9f0",
                                                color: "#137b3f",
                                                padding: "4px 8px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            Fully Allocated
                                        </span>
                                    ) : status === "Ready" ? (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                background: "#fff6e6",
                                                color: "#8a5b00",
                                                padding: "4px 8px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            Ready
                                        </span>
                                    ) : (
                                        <span
                                            title="You must finish older transactions first."
                                            style={{
                                                fontSize: 12,
                                                background: "#f2f2f2",
                                                color: "#666",
                                                padding: "4px 8px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            Locked
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {modalOpen && activeTx && (
                <TransactionAllocationModal
                    styles={styles}
                    open={modalOpen}
                    tx={activeTx}         // { id, amount_cents, allocated_cents, remaining_cents, ... }
                    envelopes={envelopes}
                    onClose={() => {
                        setModalOpen(false);
                        setActiveTx(null);
                    }}
                    onAllocated={async () => {
                        setModalOpen(false);
                        setActiveTx(null);
                        await refresh();
                    }}
                />
            )}
        </div>
    );
}
