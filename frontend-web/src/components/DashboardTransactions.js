import { useEffect, useMemo, useState } from "react";
import styles from "./Dashboard.module.css";
import { getMyTransactionsAPI, getMyEnvelopesAPI, allocateTransactionAPI } from "../api";

function formatMoneyCents(cents) {
    const sign = cents < 0 ? "-" : "+";
    const abs = Math.abs(cents);
    return `${sign} $${(abs / 100).toFixed(2)}`;
}

function toDollars(cents) {
    return (cents / 100).toFixed(2);
}

function toCentsFloatStr(s) {
    const n = Number(s);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
}

export default function DashboardTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [allocOpen, setAllocOpen] = useState(false);
    const [allocTx, setAllocTx] = useState(null);
    const [envelopes, setEnvelopes] = useState([]);
    const [allocRows, setAllocRows] = useState([]); // [{envelopeId, amount_cents}]
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // fetch transactions + envelopes
    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const [txRes, envRes] = await Promise.all([
                    getMyTransactionsAPI({}),
                    getMyEnvelopesAPI(),
                ]);

                // ---- Transactions normalize
                const rawTx = txRes?.data?.transactions ?? txRes?.data?.data ?? txRes?.data ?? [];
                const formattedTx = rawTx.map((t) => ({
                    id: t.id || t._id,
                    allocated: !!t.allocated,
                    amount_cents: t.amount_cents,
                    name: t.name || t.merchant_name || "Unnamed",
                    account: t.account_id?.name || "Unknown",
                    dateISO: t.posted_at || t.createdAt || null,
                }));
                formattedTx.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
                setTransactions(formattedTx);

                // ---- Envelopes normalize (your payload is { code, data: [...], msg })
                const rawEnv = envRes?.data?.envelopes ?? envRes?.data?.data ?? envRes?.data ?? [];
                const normalizedEnvs = (Array.isArray(rawEnv) ? rawEnv : []).map((e) => ({
                    id: e.id || e._id,
                    name: e.name,
                    // keep other fields if you want them later:
                    amount: e.amount,
                    color: e.color,
                    monthly_target: e.monthly_target,
                    createdAt: e.createdAt,
                }));
                setEnvelopes(normalizedEnvs);
            } catch (e) {
                console.error(e);
                setError("Failed to load transactions or envelopes.");
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    // compute the id of the oldest unallocated (only one can be actionable)
    const oldestUnallocatedId = useMemo(() => {
        const tx = transactions.find((t) => !t.allocated);
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
        const isOldestUnalloc = t.id === oldestUnallocatedId;
        if (!isOldestUnalloc || t.allocated) return;
        if (envelopes.length === 0) {
            setError("You have no envelopes yet. Create an envelope first.");
            return;
        }
        // initialize with 1 row using first envelope as default
        setAllocTx(t);
        setAllocRows([
            {
                envelopeId: envelopes[0].id,
                amount_cents: 0,
            },
        ]);
        setError("");
        setAllocOpen(true);
    };

    const totalAllocCents = useMemo(
        () => allocRows.reduce((sum, r) => sum + (r.amount_cents || 0), 0),
        [allocRows]
    );

    const targetAmountCents = allocTx?.amount_cents ?? 0;
    const isIncome = targetAmountCents > 0; // positive = money in
    const neededCents = Math.abs(targetAmountCents);

    const updateRowAmount = (idx, dollarsStr) => {
        const next = [...allocRows];
        next[idx] = { ...next[idx], amount_cents: toCentsFloatStr(dollarsStr) };
        setAllocRows(next);
    };

    const updateRowEnvelope = (idx, envId) => {
        const next = [...allocRows];
        next[idx] = { ...next[idx], envelopeId: envId };
        setAllocRows(next);
    };

    const addAllocRow = () => {
        if (envelopes.length === 0) return;
        setAllocRows((r) => [
            ...r,
            { envelopeId: envelopes[0].id, amount_cents: 0 },
        ]);
    };

    const removeAllocRow = (idx) => {
        setAllocRows((r) => r.filter((_, i) => i !== idx));
    };

    const canSubmit =
        allocTx &&
        allocRows.length > 0 &&
        totalAllocCents === neededCents &&
        allocRows.every((r) => r.envelopeId && r.amount_cents >= 0);

    const submitAllocation = async () => {
        if (!canSubmit || !allocTx) return;
        setSubmitting(true);
        setError("");
        try {
            // Note: fix typo alloxTx -> allocTx & use correct API
            await allocateTransactionAPI(allocTx.id, {
                splits: allocRows
                    .filter((r) => r.amount_cents > 0)
                    .map((r) => ({
                        envelope_id: r.envelopeId,
                        amount_cents: r.amount_cents, // absolute per your backend
                    })),
            });

            // refresh transactions after allocation using the SAME API you imported
            const txRes = await getMyTransactionsAPI({});
            const raw = txRes?.data?.transactions ?? txRes?.data?.data ?? txRes?.data ?? [];
            const formatted = raw.map((t) => ({
                id: t.id || t._id,
                allocated: !!t.allocated,
                amount_cents: t.amount_cents,
                name: t.name || t.merchant_name || "Unnamed",
                account: t.account_id?.name || "Unknown",
                dateISO: t.posted_at || t.createdAt || null,
            }));
            formatted.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
            setTransactions(formatted);

            setAllocOpen(false);
            setAllocTx(null);
            setAllocRows([]);
        } catch (e) {
            console.error(e);
            setError(
                e?.response?.data?.error ||
                "Allocation failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
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
                {oldestUnallocatedId && (
                    <span
                        style={{
                            fontSize: 12,
                            background: "#eef7ff",
                            color: "#0561c9",
                            padding: "6px 10px",
                            borderRadius: 999,
                        }}
                    >
                        Next to allocate: #{String(oldestUnallocatedId).slice(-6)}
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
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((t) => {
                        const isOldestUnalloc = t.id === oldestUnallocatedId;
                        const rowClickable = isOldestUnalloc && !t.allocated;
                        return (
                            <tr
                                key={t.id}
                                onClick={() => onRowClick(t)}
                                style={{
                                    borderBottom: "1px dashed #f0f0f0",
                                    cursor: rowClickable ? "pointer" : "default",
                                    background: rowClickable ? "#fcfffa" : undefined,
                                    opacity: !rowClickable && !t.allocated ? 0.6 : 1,
                                }}
                            >
                                <td style={{ padding: 8, fontWeight: 500 }}>{t.name}</td>
                                <td style={{ padding: 8 }}>{t.account}</td>
                                <td
                                    style={{
                                        padding: 8,
                                        color: t.amount_cents >= 0 ? "green" : "crimson",
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatMoneyCents(t.amount_cents)}
                                </td>
                                <td style={{ padding: 8 }}>
                                    {t.dateISO ? new Date(t.dateISO).toLocaleDateString() : "-"}
                                </td>
                                <td style={{ padding: 8 }}>
                                    {t.allocated ? (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                background: "#eaf9f0",
                                                color: "#137b3f",
                                                padding: "4px 8px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            Allocated
                                        </span>
                                    ) : isOldestUnalloc ? (
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
                                            title="You must allocate older transactions first."
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

            {/* Allocation Modal */}
            {allocOpen && allocTx && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        if (!submitting) {
                            setAllocOpen(false);
                            setAllocTx(null);
                            setAllocRows([]);
                        }
                    }}
                >
                    <div
                        style={{
                            width: 520,
                            background: "#fff",
                            borderRadius: 12,
                            padding: 18,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 style={{ marginTop: 0, marginBottom: 8 }}>
                            {isIncome ? "Allocate Income" : "Deallocate (Spending)"}
                        </h4>
                        <div style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
                            Amount: <strong>{formatMoneyCents(allocTx.amount_cents)}</strong> •{" "}
                            Account: <strong>{allocTx.account}</strong> • Tx #{String(allocTx.id).slice(-6)}
                        </div>

                        <div
                            style={{
                                border: "1px solid #eee",
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 8,
                                background: "#fafafa",
                            }}
                        >
                            <div style={{ fontSize: 13, marginBottom: 4 }}>
                                Distribute exactly{" "}
                                <strong>${toDollars(Math.abs(allocTx.amount_cents))}</strong>{" "}
                                across envelopes:
                            </div>

                            {allocRows.map((row, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 140px 32px",
                                        gap: 8,
                                        alignItems: "center",
                                        marginBottom: 8,
                                    }}
                                >
                                    <select
                                        value={row.envelopeId || ""}
                                        onChange={(e) => updateRowEnvelope(idx, e.target.value)}
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            border: "1px solid #ddd",
                                        }}
                                    >
                                        {envelopes.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={row.amount_cents ? (row.amount_cents / 100).toFixed(2) : ""}
                                        onChange={(e) => updateRowAmount(idx, e.target.value)}
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            border: "1px solid #ddd",
                                            textAlign: "right",
                                        }}
                                    />

                                    <button
                                        onClick={() => removeAllocRow(idx)}
                                        disabled={allocRows.length === 1 || submitting}
                                        style={{
                                            border: "1px solid #eee",
                                            background: "#fff",
                                            borderRadius: 8,
                                            height: 36,
                                            cursor: allocRows.length === 1 || submitting ? "not-allowed" : "pointer",
                                        }}
                                        title={allocRows.length === 1 ? "Keep at least one row" : "Remove row"}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <button
                                    onClick={addAllocRow}
                                    disabled={submitting || envelopes.length === 0}
                                    style={{
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "1px solid #ddd",
                                        background: "#fff",
                                        cursor: envelopes.length ? "pointer" : "not-allowed",
                                    }}
                                    title={envelopes.length ? "" : "Create an envelope first"}
                                >
                                    + Add envelope
                                </button>
                                <div style={{ fontSize: 13 }}>
                                    Total: <strong>${toDollars(totalAllocCents)} / ${toDollars(neededCents)}</strong>{" "}
                                    {totalAllocCents === neededCents ? (
                                        <span style={{ color: "green" }}>✓</span>
                                    ) : (
                                        <span style={{ color: "crimson" }}>✗</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: "crimson", fontSize: 13, marginBottom: 8 }}>{error}</div>
                        )}

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => {
                                    if (!submitting) {
                                        setAllocOpen(false);
                                        setAllocTx(null);
                                        setAllocRows([]);
                                    }
                                }}
                                disabled={submitting}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAllocation}
                                disabled={!canSubmit || submitting}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: canSubmit ? "#0c8f34" : "#b6e0c7",
                                    color: "white",
                                    cursor: canSubmit ? "pointer" : "not-allowed",
                                    fontWeight: 600,
                                }}
                            >
                                {submitting ? "Saving..." : "Save Allocation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
