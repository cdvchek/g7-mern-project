"use client";

import { useEffect, useMemo, useState } from "react";
import { allocateTransactionAPI } from "../api";

const toInt = (v, def = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : def;
};
const toCentsFromDollarsStr = (s) => {
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
};
const formatUSD = (cents) =>
    (toInt(cents) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function TransactionAllocationModal({
    styles,
    open,
    tx,            // { id, amount_cents(signed), allocated_cents, remaining_cents, name, account }
    envelopes,     // [{ id, name, color, amount(cents) }, ...]
    onClose,
    onAllocated,   // callback after success
}) {
    const totalCents = Math.abs(toInt(tx?.amount_cents, 0));
    const alreadyAllocated = toInt(tx?.allocated_cents, 0);
    const neededCents = Math.max(0, toInt(tx?.remaining_cents, 0));
    const isIncome = toInt(tx?.amount_cents, 0) > 0;

    // rows: [{ envelopeId, amount_cents }]
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState(false);

    // init one row on open
    useEffect(() => {
        if (!open) return;
        setRows(envelopes.length ? [{ envelopeId: envelopes[0].id, amount_cents: 0 }] : []);
        setSubmitting(false);
        setErr("");
        setOk(false);
    }, [open, envelopes]);

    const totalAllocCents = useMemo(
        () => rows.reduce((sum, r) => sum + toInt(r.amount_cents, 0), 0),
        [rows]
    );

    // Allow partial: any positive amount <= needed
    const canSubmit =
        open &&
        tx?.id &&
        rows.length > 0 &&
        totalAllocCents > 0 &&
        totalAllocCents <= neededCents &&
        rows.every((r) => r.envelopeId && toInt(r.amount_cents, -1) >= 0) &&
        !submitting;

    const updateRowEnvelope = (idx, envId) => {
        setRows((r) => {
            const next = [...r];
            next[idx] = { ...next[idx], envelopeId: envId };
            return next;
        });
    };

    const updateRowAmount = (idx, dollarsStr) => {
        setRows((r) => {
            const next = [...r];
            next[idx] = { ...next[idx], amount_cents: toCentsFromDollarsStr(dollarsStr) };
            return next;
        });
    };

    const addRow = () => {
        if (!envelopes.length) return;
        setRows((r) => [...r, { envelopeId: envelopes[0].id, amount_cents: 0 }]);
    };

    const removeRow = (idx) => {
        setRows((r) => r.filter((_, i) => i !== idx));
    };

    async function submit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setErr("");
        try {
            const splits = rows
                .filter((r) => toInt(r.amount_cents) > 0)
                .map((r) => ({
                    envelope_id: r.envelopeId,
                    amount_cents: toInt(r.amount_cents),
                }));

            await allocateTransactionAPI(tx.id, { splits }); // backend expects cents

            setOk(true);
            setTimeout(() => {
                onAllocated?.();
            }, 900);
        } catch (e) {
            console.error(e);
            setErr(e?.response?.data?.error || "Allocation failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!open || !tx) return null;

    const pct = totalCents > 0 ? Math.round((alreadyAllocated / totalCents) * 100) : 0;

    return (
        <div className={styles.modalBackdrop} onClick={() => !submitting && onClose?.()}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <strong className={styles.modalTitle}>
                        {isIncome ? "Allocate Income" : "Allocate Spending"}
                    </strong>
                    <button
                        className={styles.iconBtn}
                        onClick={() => !submitting && onClose?.()}
                        aria-label="Close"
                    >
                        ✖
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div style={{ fontSize: 13, color: "#555" }}>
                        <div><strong>Transaction:</strong> {tx.name || "Unnamed"}</div>
                        <div><strong>Account:</strong> {tx.account || "Unknown"}</div>
                        <div>
                            <strong>Change:</strong>{" "}
                            <span style={{ color: isIncome ? "#0b7a28" : "crimson", fontWeight: 700 }}>
                                {formatUSD(tx.amount_cents)}
                            </span>
                        </div>

                        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                            <div style={{ fontSize: 12 }}>
                                Allocated so far: <strong>{formatUSD(alreadyAllocated)}</strong>{" "}
                                of <strong>{formatUSD(totalCents)}</strong> ({pct}%)
                            </div>
                            <div style={{ height: 8, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
                                <div
                                    style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        background: "#5b9cff",
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 12 }}>
                                Remaining: <strong>{formatUSD(neededCents)}</strong>
                            </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            Distribute up to <strong>{formatUSD(neededCents)}</strong> across envelopes:
                        </div>
                    </div>

                    <div
                        style={{
                            border: "1px solid #eee",
                            borderRadius: 10,
                            padding: 10,
                            background: "#fafafa",
                            marginTop: 8,
                        }}
                    >
                        {rows.map((row, idx) => (
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
                                    style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
                                >
                                    {envelopes.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={
                                        row.amount_cents !== undefined && row.amount_cents !== null
                                            ? (toInt(row.amount_cents) / 100)
                                            : ""
                                    }
                                    onChange={(e) => updateRowAmount(idx, e.target.value)}
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        border: "1px solid #ddd",
                                        textAlign: "right",
                                        fontVariantNumeric: "tabular-nums",
                                        width: "124px",
                                    }}
                                />

                                <button
                                    onClick={() => removeRow(idx)}
                                    disabled={rows.length === 1 || submitting}
                                    className={styles.iconBtn}
                                    title={rows.length === 1 ? "Keep at least one row" : "Remove row"}
                                    style={{
                                        border: "1px solid #eee",
                                        background: "#fff",
                                        borderRadius: 8,
                                        height: 36,
                                        cursor: rows.length === 1 || submitting ? "not-allowed" : "pointer",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button
                                onClick={addRow}
                                disabled={submitting || !envelopes.length}
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    cursor: envelopes.length ? "pointer" : "not-allowed",
                                }}
                            >
                                + Add envelope
                            </button>

                            <div style={{ fontSize: 13 }}>
                                This allocation: <strong>{formatUSD(totalAllocCents)}</strong>{" "}
                                {totalAllocCents > neededCents ? (
                                    <span style={{ color: "crimson" }}> (exceeds remaining)</span>
                                ) : totalAllocCents === neededCents ? (
                                    <span style={{ color: "green" }}> (full)</span>
                                ) : totalAllocCents > 0 ? (
                                    <span style={{ color: "#8a5b00" }}> (partial)</span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {err && (
                        <div style={{ color: "crimson", fontSize: 13, marginTop: 8 }}>{err}</div>
                    )}
                    {ok && (
                        <div
                            style={{
                                marginTop: 8,
                                padding: "8px 10px",
                                background: "rgba(34,197,94,0.12)",
                                border: "1px solid rgba(34,197,94,0.35)",
                                color: "#065f46",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            ✅ Allocation saved
                        </div>
                    )}
                </div>

                <div className={`${styles.modalActions} ${styles.actionsRight}`}>
                    <button className={styles.btn} onClick={() => !submitting && onClose?.()} disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={submit}
                        disabled={!canSubmit}
                        title={
                            canSubmit
                                ? "Save allocation"
                                : "Enter an amount > 0 and ≤ remaining"
                        }
                    >
                        {submitting ? "Saving..." : "Save Allocation"}
                    </button>
                </div>
            </div>
        </div>
    );
}
