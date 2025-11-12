"use client";

import { useState } from "react";
import styles from "./Dashboard.module.css";
import {
    createEnvelopeAPI,
    updateEnvelopeAPI,
    deleteEnvelopeAPI,
    transferEnvelopeAPI,
} from "../api";
import CreateEnvelopeModal from "./CreateEnvelopeModal";

const formatUSD = (cents) =>
    (Number(cents || 0) / 100).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
    });

export default function EnvelopesList({ envelopes, onChanged }) {
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
    const [editing, setEditing] = useState({
        id: null,
        name: "",
        color: "#22c55e",
        amount: 0, // cents for preview
    });

    const openCreate = () => {
        setModalMode("create");
        setEditing({ id: null, name: "", color: "#22c55e", amount: 0 });
        setModalOpen(true);
    };

    const openEdit = (env) => {
        setModalMode("edit");
        setEditing({
            id: env.id,
            name: env.name,
            color: env.color || "#22c55e",
            amount: Number(env.amount || 0),
        });
        setModalOpen(true);
    };

    // Save (create/edit)
    const handleSave = async ({ name, color }) => {
        if (modalMode === "create") {
            await createEnvelopeAPI({
                name,
                color,
                amount: 0, // cents
                order: envelopes.length,
            });
        } else {
            await updateEnvelopeAPI(editing.id, { name, color });
        }
        setModalOpen(false);
        onChanged?.();
    };

    // Delete (only in edit mode)
    const handleDelete = async () => {
        if (!editing.id) return;
        await deleteEnvelopeAPI(editing.id);
        setModalOpen(false);
        onChanged?.();
    };

    // Transfer
    const handleTransfer = async ({ fromId, toId, amountCents }) => {
        // Expect an atomic backend operation:
        // POST /api/envelopes/transfer { fromId, toId, amountCents }
        await transferEnvelopeAPI({ from_envelope_id: fromId, to_envelope_id: toId, amount: amountCents });
        // After success, refresh
        onChanged?.();
    };

    return (
        <div className={styles.envelopeListCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className={styles.envelopeHeader}>Your Envelopes</h3>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
                    + New Envelope
                </button>
            </div>

            <div className={styles.envelopeList}>
                {envelopes.map((e) => {
                    const text = getContrastText(e.color || "#ddd");
                    const flapBg = text === "#111" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.25)";
                    return (
                        <div
                            key={e.id}
                            className={styles.envelopeCard}
                            style={{ backgroundColor: e.color || "#ddd", color: text }}
                            onClick={() => openEdit(e)} // click to edit (and transfer)
                            role="button"
                        >
                            <div className={styles.envelopeFlap} style={{ background: flapBg }} />
                            <div className={styles.envelopeContent}>
                                <span className={styles.envelopeName}>{e.name}</span>
                                <span className={styles.envelopeAmount}>{formatUSD(e.amount)}</span>
                            </div>
                        </div>
                    );
                })}
                {envelopes.length === 0 && (
                    <p className={styles.noEnvelopes}>No envelopes yet. Create one to get started.</p>
                )}
            </div>

            {/* Unified Create/Edit + Transfer Modal */}
            <CreateEnvelopeModal
                open={modalOpen}
                mode={modalMode}
                initialId={editing.id}
                initialName={editing.name}
                initialColor={editing.color}
                initialAmountCents={editing.amount}
                allEnvelopes={envelopes}
                onCancel={() => setModalOpen(false)}
                onSave={handleSave}
                onDelete={modalMode === "edit" ? handleDelete : undefined}
                onTransfer={handleTransfer}
            />
        </div>
    );
}

/* util: choose dark/light text for envelope color */
function getContrastText(hex = "#ffffff") {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16) || 255;
    const g = parseInt(h.slice(2, 4), 16) || 255;
    const b = parseInt(h.slice(4, 6), 16) || 255;
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0..1
    return L > 0.6 ? "#111" : "#fff";
}
