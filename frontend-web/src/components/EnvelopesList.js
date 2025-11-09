import { useState } from "react";

export default function EnvelopesList({
    styles,
    envelopes,
    onAdd,
    onOpenDetail,
    // create/edit modal
    showForm,
    setShowForm,
    form,
    setForm,
    mode,
    saveEnvelope,
    onEdit,
    // transfer
    onTransfer,
}) {
    // Transfer modal state
    const [showTransfer, setShowTransfer] = useState(false);
    const [xfer, setXfer] = useState({ fromId: "", toId: "", amount: "" });

    function openTransferFor(env) {
        setShowTransfer(true);
        setXfer({ fromId: String(env.id), toId: "", amount: "" });
    }

    function swapFromTo() {
        const { fromId, toId } = xfer;
        // If "to" is empty, then: newTo = oldFrom, newFrom = ""
        if (!toId) {
            setXfer({ fromId: "", toId: fromId, amount: xfer.amount });
        } else {
            setXfer({ fromId: toId, toId: fromId, amount: xfer.amount });
        }
    }

    function confirmTransfer() {
        const amount = Number(xfer.amount || 0);
        if (!xfer.fromId || !xfer.toId || xfer.fromId === xfer.toId || Number.isNaN(amount) || amount <= 0) {
            return; // you can add a toast or inline error here
        }
        onTransfer?.(xfer.fromId, xfer.toId, amount);
        setShowTransfer(false);
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Envelopes</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onAdd}>
                        Add Envelope
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {envelopes.map((e) => {
                    const balance = e.amount ?? e.balance ?? 0;
                    const goal = e.monthly_target ?? e.goal ?? 0;
                    return (
                        <div
                            key={e.id}
                            onClick={() => onOpenDetail(e)}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                border: "1px solid #eee",
                                padding: 12,
                                borderRadius: 6,
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                    aria-hidden
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 999,
                                        background: e.color || "#999",
                                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700 }}>{e.name}</div>
                                    <div style={{ marginTop: 6 }}>
                                        Balance: ${balance} • Goal: ${goal}
                                    </div>
                                </div>
                            </div>

                            {/* Single Transfer button (double-arrows style) */}
                            <div
                                onClick={(ev) => ev.stopPropagation()}
                                style={{ display: "flex", gap: 8, alignItems: "center" }}
                            >
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    title="Transfer funds"
                                    onClick={() => openTransferFor(e)}
                                >
                                    ⇄ Transfer
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE / EDIT MODAL (unchanged) */}
            {showForm && (
                <div
                    className={styles.modalBackdrop}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowForm(false);
                    }}
                >
                    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="env-modal-title">
                        <div className={styles.modalHeader}>
                            <h4 id="env-modal-title" style={{ margin: 0 }}>
                                {mode === "create" ? "Create Envelope" : "Modify Envelope"}
                            </h4>
                            <button className={styles.iconBtn} onClick={() => setShowForm(false)} aria-label="Close">
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <label className={styles.label}>Envelope Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="inputBasic"
                                placeholder="Name *"
                            />
                            <label className={styles.label} style={{ marginTop: 12 }}>
                                Color
                            </label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                    type="color"
                                    value={form.color}
                                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                                    aria-label="Pick color"
                                    style={{ width: 44, height: 32, padding: 0, border: "1px solid #ddd", borderRadius: 6 }}
                                />
                                {["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                                        aria-label={`Set color ${c}`}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 999,
                                            background: c,
                                            border: "1px solid rgba(0,0,0,0.1)",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEnvelope}>
                                {mode === "create" ? "ADD ENVELOPE" : "SAVE CHANGES"}
                            </button>
                            <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL */}
            {showTransfer && (
                <div
                    className={styles.modalBackdrop}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowTransfer(false);
                    }}
                >
                    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="xfer-modal-title">
                        <div className={styles.modalHeader}>
                            <h4 id="xfer-modal-title" style={{ margin: 0 }}>Transfer Funds</h4>
                            <button className={styles.iconBtn} onClick={() => setShowTransfer(false)} aria-label="Close">×</button>
                        </div>

                        <div className={styles.modalBody} style={{ gap: 12 }}>
                            <div style={{ display: "grid", gap: 6 }}>
                                <label className={styles.label}>From envelope</label>
                                <select
                                    value={xfer.fromId}
                                    onChange={(e) => setXfer((t) => ({ ...t, fromId: e.target.value }))}
                                    style={{ padding: 8 }}
                                >
                                    <option value="">Select envelope</option>
                                    {envelopes.map((en) => (
                                        <option key={en.id} value={String(en.id)}>{en.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    type="button"
                                    onClick={swapFromTo}
                                    title="Swap From/To"
                                >
                                    ⇄ Swap
                                </button>
                            </div>

                            <div style={{ display: "grid", gap: 6 }}>
                                <label className={styles.label}>To envelope</label>
                                <select
                                    value={xfer.toId}
                                    onChange={(e) => setXfer((t) => ({ ...t, toId: e.target.value }))}
                                    style={{ padding: 8 }}
                                >
                                    <option value="">Select envelope</option>
                                    {envelopes.map((en) => (
                                        <option key={en.id} value={String(en.id)}>{en.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "grid", gap: 6 }}>
                                <label className={styles.label}>Amount</label>
                                <input
                                    value={xfer.amount}
                                    onChange={(e) => setXfer((t) => ({ ...t, amount: e.target.value }))}
                                    placeholder="$X,XXX.XX"
                                    style={{ padding: 8 }}
                                />
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={confirmTransfer}
                                disabled={
                                    !xfer.fromId || !xfer.toId || xfer.fromId === xfer.toId || Number(xfer.amount) <= 0
                                }
                            >
                                Transfer
                            </button>
                            <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => setShowTransfer(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
