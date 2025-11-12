"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Dashboard.module.css";

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#06b6d4", "#0ea5e9", "#3b82f6",
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#14b8a6", "#0891b2", "#65a30d", "#7c3aed", "#475569"
];

const formatUSD = (cents) =>
    (Number(cents || 0) / 100).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
    });

function getContrastText(hex = "#ffffff") {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16) || 255;
    const g = parseInt(h.slice(2, 4), 16) || 255;
    const b = parseInt(h.slice(4, 6), 16) || 255;
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return L > 0.6 ? "#111" : "#fff";
}

export default function CreateEnvelopeModal({
    open,
    mode = "create",                 // "create" | "edit"
    initialId = null,
    initialName = "",
    initialColor = "#22c55e",
    initialAmountCents = 0,          // preview only & delete gating
    allEnvelopes = [],               // for transfer view
    onCancel,
    onSave,                          // ({name, color})
    onDelete,                        // optional in edit mode
    onTransfer,                      // ({fromId, toId, amountCents})
}) {
    const [view, setView] = useState("edit"); // "edit" | "transfer"
    const [name, setName] = useState(initialName);
    const [color, setColor] = useState(initialColor);
    const [saving, setSaving] = useState(false);

    // Delete gate (client-side)
    const isEmpty = Number(initialAmountCents) === 0;

    // Transfer state
    const defaultFromId = initialId ?? null;
    const firstOther = allEnvelopes.find((e) => String(e.id) !== String(defaultFromId));
    const [fromId, setFromId] = useState(defaultFromId);
    const [toId, setToId] = useState(firstOther?.id ?? null);
    const [amountCents, setAmountCents] = useState(0);
    const [transferBusy, setTransferBusy] = useState(false);
    const [transferOk, setTransferOk] = useState(false);

    // Reset when modal opens or record changes
    useEffect(() => {
        if (!open) return;
        setView("edit");
        setName(initialName);
        setColor(initialColor);
        setSaving(false);
        setFromId(defaultFromId);
        const other = allEnvelopes.find((e) => String(e.id) !== String(defaultFromId));
        setToId(other?.id ?? null);
        setAmountCents(0);
        setTransferBusy(false);
        setTransferOk(false);
    }, [open, initialName, initialColor, initialId, allEnvelopes, defaultFromId]);

    const textColor = useMemo(() => getContrastText(color), [color]);
    const flapBg = textColor === "#111" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.25)";
    const canSave = name.trim().length > 0 && !saving;

    async function handleSave() {
        if (!canSave) return;
        try {
            setSaving(true);
            await onSave?.({ name: name.trim(), color });
        } finally {
            setSaving(false);
        }
    }

    function swapFromTo() {
        setFromId(toId);
        setToId(fromId);
    }

    const fromEnv = allEnvelopes.find((e) => String(e.id) === String(fromId)) || null;
    const toEnv = allEnvelopes.find((e) => String(e.id) === String(toId)) || null;

    const transferAllowed =
        !!fromId &&
        !!toId &&
        String(fromId) !== String(toId) &&
        Number.isFinite(Number(amountCents)) &&
        Number(amountCents) > 0 &&
        !transferBusy;

    async function doTransfer() {
        if (!transferAllowed) return;
        try {
            setTransferBusy(true);
            await onTransfer?.({
                fromId,
                toId,
                amountCents: Number(amountCents),
            });
            setTransferOk(true);
            // brief success state, then go back to edit view
            setTimeout(() => {
                setTransferOk(false);
                setView("edit");
            }, 1200);
        } finally {
            setTransferBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className={styles.modalBackdrop} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <strong className={styles.modalTitle}>
                        {mode === "create" ? "New Envelope" : view === "transfer" ? "Transfer" : "Edit Envelope"}
                    </strong>

                    {/* top-right controls */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {mode === "edit" && view === "edit" && (
                            <button
                                className={`${styles.btn}`}
                                onClick={() => setView("transfer")}
                                title="Transfer between envelopes"
                            >
                                Transfer
                            </button>
                        )}
                        <button className={styles.iconBtn} onClick={onCancel} aria-label="Close">✖</button>
                    </div>
                </div>

                {/* EDIT VIEW */}
                {view === "edit" && (
                    <>
                        <div className={styles.modalGrid}>
                            {/* Live preview */}
                            <div className={styles.previewWrap}>
                                <div
                                    className={`${styles.envelopeCard} ${styles.envelopePreview}`}
                                    style={{ backgroundColor: color, color: textColor }}
                                >
                                    <div className={styles.envelopeFlap} style={{ background: flapBg }} />
                                    <div className={styles.envelopeContent}>
                                        <span className={styles.envelopeName}>{name || "New Envelope"}</span>
                                        <span className={styles.envelopeAmount}>{formatUSD(initialAmountCents)}</span>
                                    </div>
                                </div>
                                <div className={styles.inlineHelp}>This is how it will appear in your list.</div>
                            </div>

                            {/* Form */}
                            <div className={styles.formWrap}>
                                <div className={styles.fieldRow}>
                                    <label className={styles.label}>Name</label>
                                    <input
                                        placeholder="e.g., Groceries"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className={styles.colorPickRow}>
                                    <label className={styles.label}>Color</label>

                                    <div className={styles.swatchGrid}>
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`${styles.swatch} ${c === color ? styles.swatchSelected : ""}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setColor(c)}
                                                aria-label={`Choose color ${c}`}
                                                title={c}
                                            />
                                        ))}

                                        {/* Hex field + native color input */}
                                        <div className={styles.hexField}>
                                            <span>#</span>
                                            <input
                                                value={color.replace("#", "").toUpperCase()}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                                                    setColor(raw.length ? `#${raw}` : "#");
                                                }}
                                            />
                                            <input
                                                type="color"
                                                className={styles.colorFieldHidden}
                                                value={color.length === 7 ? color : "#22c55e"}
                                                onChange={(e) => setColor(e.target.value)}
                                                title="Custom color"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delete-lock notice when not empty */}
                        {mode === "edit" && !isEmpty && (
                            <div
                                className={styles.smallCard}
                                style={{ margin: "8px 16px 0", color: "#8a5b00", background: "#fff6e6", borderColor: "#ffe0a6" }}
                            >
                                You must move or allocate all funds before deleting this envelope.
                                Current balance: <strong>{formatUSD(initialAmountCents)}</strong>
                            </div>
                        )}

                        <div className={`${styles.modalActions} ${styles.actionsRight}`}>
                            <button className={styles.btn} onClick={onCancel} disabled={saving}>Cancel</button>

                            {onDelete && mode === "edit" && (
                                <button
                                    className={`${styles.btn} ${styles.btnAccent}`}
                                    onClick={() => {
                                        // extra guard: don’t call onDelete unless empty
                                        if (!isEmpty) return;
                                        onDelete?.();
                                    }}
                                    disabled={saving || !isEmpty}
                                    title={
                                        isEmpty
                                            ? "Delete this envelope"
                                            : "Envelope must be empty to delete"
                                    }
                                >
                                    Delete
                                </button>
                            )}

                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleSave}
                                disabled={!canSave}
                            >
                                {saving ? "Saving..." : mode === "create" ? "Create Envelope" : "Save Changes"}
                            </button>
                        </div>
                    </>
                )}

                {/* TRANSFER VIEW */}
                {view === "transfer" && (
                    <>
                        <div className={styles.modalBody} style={{ paddingTop: 10 }}>
                            <div className={styles.row} style={{ justifyContent: "space-between", gap: 12, alignItems: "stretch" }}>
                                {/* From Preview */}
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>From</label>
                                    <select
                                        value={fromId ?? ""}
                                        onChange={(e) => setFromId(e.target.value)}
                                        style={{ width: "100%" }}
                                    >
                                        {allEnvelopes.map((e) => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>

                                    <MiniPreview env={fromEnv} />
                                </div>

                                {/* Swap button */}
                                <div style={{ display: "grid", alignContent: "end" }}>
                                    <button className={styles.btn} onClick={swapFromTo} title="Swap">
                                        ⇄ Swap
                                    </button>
                                </div>

                                {/* To Preview */}
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>To</label>
                                    <select
                                        value={toId ?? ""}
                                        onChange={(e) => setToId(e.target.value)}
                                        style={{ width: "100%" }}
                                    >
                                        {allEnvelopes.map((e) => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>

                                    <MiniPreview env={toEnv} />
                                </div>
                            </div>

                            <div className={styles.fieldRow} style={{ marginTop: 12 }}>
                                <label className={styles.label}>Amount (cents)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={amountCents}
                                    onChange={(e) => setAmountCents(e.target.value)}
                                    placeholder="e.g., 2500 for $25.00"
                                />
                                <div className={styles.inlineHelp}>
                                    {Number(amountCents) > 0 ? `= ${formatUSD(Number(amountCents))}` : "Enter a positive amount"}
                                </div>
                            </div>

                            {transferOk && (
                                <div style={{
                                    marginTop: 8, padding: "8px 10px",
                                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)",
                                    color: "#065f46", borderRadius: 8, display: "flex", alignItems: "center", gap: 8
                                }}>
                                    ✅ Transfer successful
                                </div>
                            )}
                        </div>

                        <div className={`${styles.modalActions} ${styles.actionsRight}`}>
                            <button className={styles.btn} onClick={() => setView("edit")} disabled={transferBusy}>
                                Back
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={doTransfer}
                                disabled={!transferAllowed}
                                title="Execute transfer"
                            >
                                {transferBusy ? "Transferring..." : "Transfer"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* Small shared preview used in transfer view */
function MiniPreview({ env }) {
    if (!env) return <div className={styles.smallCard} style={{ marginTop: 8 }}>—</div>;
    const text = getContrastText(env.color || "#ddd");
    const flap = text === "#111" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.25)";
    return (
        <div
            className={styles.envelopeCard}
            style={{
                backgroundColor: env.color || "#ddd",
                color: text,
                height: 80,
                marginTop: 8,
            }}
        >
            <div className={styles.envelopeFlap} style={{ background: flap }} />
            <div className={styles.envelopeContent} style={{ padding: "8px 18px 10px 10px" }}>
                <span className={styles.envelopeName}>{env.name}</span>
                <span className={styles.envelopeAmount}>
                    {(Number(env.amount || 0) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </span>
            </div>
        </div>
    );
}
